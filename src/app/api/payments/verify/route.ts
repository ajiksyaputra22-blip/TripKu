import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { paymentId, action, verificationNote } = body; // action: "VERIFY" | "REJECT"

    if (!paymentId || !action) {
      return NextResponse.json({ error: "Data verifikasi tidak lengkap." }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan." }, { status: 404 });
    }

    if (session.role === "TRAVEL" && payment.booking.package.travelId !== session.travelId) {
      return NextResponse.json({ error: "Anda tidak berhak memverifikasi transaksi ini." }, { status: 403 });
    }

    const isDP = payment.paymentType === "DP";
    const isPelunasan = payment.paymentType === "PELUNASAN";

    if (action === "VERIFY") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "VERIFIED",
          verificationNote: verificationNote || (isDP ? "Uang Muka (DP) telah diverifikasi dan valid." : "Pembayaran telah diverifikasi dan valid."),
        },
      });

      // If DP, booking moves to NEEDS_PELUNASAN with dpPaid true; if Full/Pelunasan, moves to CONFIRMED
      const targetBookingStatus = isDP ? "NEEDS_PELUNASAN" : "CONFIRMED";

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: targetBookingStatus,
          ...(isDP ? { dpPaid: true } : {}),
        },
      });

      // REQ-4.1: Kuota baru berkurang setelah pembayaran/DP dikonfirmasi
      if (isDP || !payment.booking.dpPaid) {
        await prisma.package.update({
          where: { id: payment.booking.packageId },
          data: {
            quotaLeft: { decrement: payment.booking.participantCount },
          },
        });
      }

      // Automatically create a Trip and Trip Room if one doesn't exist for this booking
      let activeTrip = await prisma.trip.findFirst({
        where: { bookingId: payment.bookingId },
        include: { package: true },
      });

      if (!activeTrip) {
        activeTrip = await prisma.trip.create({
          data: {
            packageId: payment.booking.packageId,
            bookingId: payment.bookingId,
            scheduleDate: payment.booking.package.departureDate,
            destination: payment.booking.package.destination,
            vehicle: payment.booking.package.vehicle,
            operationalNotes: `Perjalanan untuk pemesanan ${payment.booking.bookingCode}.`,
            status: "SCHEDULED",
          },
          include: { package: true },
        });

        // Initialize Trip Room
        const welcomeMessage = isDP
          ? `Selamat datang di ruang informasi perjalanan! Pembayaran Uang Muka (DP) Anda telah diverifikasi oleh agensi travel. Kru perjalanan sedang disiapkan. Harap lakukan pelunasan sisa tagihan paling lambat H-2 sebelum keberangkatan.`
          : `Selamat datang di ruang informasi perjalanan! Pembayaran lunas Anda telah terverifikasi. Kami akan segera memperbarui titik kumpul dan arahan persiapan di sini.`;

        await prisma.tripRoom.create({
          data: {
            tripId: activeTrip.id,
            title: `Trip Room: ${payment.booking.package.name} (${payment.booking.bookingCode})`,
            updates: {
              create: {
                userId: session.userId,
                category: "ANNOUNCEMENT",
                content: welcomeMessage,
              },
            },
          },
        });
      }

      const successMsg = isDP
        ? "Pembayaran DP berhasil diverifikasi! Jadwal Trip telah diaktifkan, silakan lanjutkan penugasan kru driver & guide."
        : "Pembayaran lunas berhasil diverifikasi. Trip Room telah aktif!";

      // Notifikasi ke customer
      await createNotification({
        userId: payment.booking.customerId,
        type: "PAYMENT",
        title: isDP ? "Pembayaran DP Diverifikasi ✓" : "Pembayaran Lunas Diverifikasi ✓",
        message: isDP
          ? `Uang Muka (DP) Anda untuk pemesanan ${payment.booking.bookingCode} telah diverifikasi. Silakan lakukan pelunasan sisa tagihan.`
          : `Pembayaran lunas Anda untuk pemesanan ${payment.booking.bookingCode} telah diverifikasi. Trip Room kini aktif!`,
        link: "/customer/bookings",
      });

      return NextResponse.json({ 
        success: true, 
        message: successMsg,
        trip: {
          id: activeTrip.id,
          destination: activeTrip.destination,
          scheduleDate: activeTrip.scheduleDate,
          package: { name: activeTrip.package.name },
        }
      });
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "REJECTED",
          verificationNote: verificationNote || "Bukti transfer tidak valid atau dana belum masuk rekening.",
        },
      });

      const fallbackStatus = isDP 
        ? "WAITING_DP_PAYMENT" 
        : isPelunasan 
        ? "NEEDS_PELUNASAN" 
        : "WAITING_PAYMENT";

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: fallbackStatus,
        },
      });

      // Notifikasi ke customer saat pembayaran ditolak
      await createNotification({
        userId: payment.booking.customerId,
        type: "PAYMENT",
        title: "Pembayaran Ditolak ✗",
        message: `Pembayaran untuk pemesanan ${payment.booking.bookingCode} ditolak. ${verificationNote || "Bukti transfer tidak valid atau dana belum masuk rekening."}`,
        link: "/customer/bookings",
      });

      return NextResponse.json({ success: true, message: "Pembayaran telah ditolak dengan catatan." });
    }
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json({ error: "Gagal memproses verifikasi pembayaran." }, { status: 500 });
  }
}
