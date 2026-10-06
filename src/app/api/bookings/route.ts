import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (session.role === "CUSTOMER") {
      whereClause.customerId = session.userId;
    } else if (session.role === "TRAVEL") {
      whereClause.package = {
        travelId: session.travelId,
      };
      // REQ-4.1: Pesanan belum bayar/DP tidak masuk ke daftar pemesanan Admin Travel
      if (!status || status === "ALL") {
        whereClause.status = {
          notIn: ["WAITING_PAYMENT", "WAITING_DP_PAYMENT"],
        };
      }
    } else if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        package: {
          include: {
            travel: {
              select: {
                businessName: true,
                phone: true,
                bankName: true,
                bankAccount: true,
                bankHolder: true,
              },
            },
          },
        },
        participants: true,
        payments: true,
        customer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        trips: {
          include: {
            tripRoom: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar pemesanan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Hanya akun Customer yang dapat melakukan pemesanan paket wisata." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { packageId, participantCount, participants, notes, paymentPlan } = body;

    if (!packageId || !participantCount || !participants || !Array.isArray(participants)) {
      return NextResponse.json(
        { error: "Data paket dan peserta tidak lengkap." },
        { status: 400 }
      );
    }

    if (participants.length !== parseInt(participantCount)) {
      return NextResponse.json(
        { error: `Jumlah data peserta (${participants.length}) harus sama dengan jumlah booking (${participantCount}).` },
        { status: 400 }
      );
    }

    for (const p of participants) {
      if (!p.name || !p.identityNumber) {
        return NextResponse.json(
          { error: "Nama dan Nomor Identitas (KTP/Passport) seluruh peserta wajib diisi." },
          { status: 400 }
        );
      }
      // Validate NIK exactly 16 digits
      const nik = p.identityNumber.replace(/\D/g, "");
      if (nik.length !== 16) {
        return NextResponse.json(
          { error: `NIK peserta "${p.name}" harus tepat 16 digit (terdeteksi: ${nik.length} digit).` },
          { status: 400 }
        );
      }
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket wisata tidak ditemukan." }, { status: 404 });
    }

    // REQ-3.1: Batas waktu pemesanan — gunakan bookingDeadline jika ada, fallback H-1 dari departureDate
    const now = new Date();
    let isExpired = false;
    if (pkg.bookingDeadline) {
      const deadline = new Date(pkg.bookingDeadline);
      if (deadline.getUTCHours() === 0 && deadline.getUTCMinutes() === 0) {
        deadline.setUTCHours(23, 59, 59, 999);
      }
      isExpired = now.getTime() > deadline.getTime();
    } else if (pkg.departureDate) {
      isExpired = new Date(pkg.departureDate).getTime() - now.getTime() <= 1 * 24 * 60 * 60 * 1000;
    }

    if (pkg.status !== "PUBLISHED" || isExpired) {
      if (pkg.status === "PUBLISHED" && isExpired) {
        await prisma.package.update({
          where: { id: pkg.id },
          data: { status: "INACTIVE" },
        });
      }
      return NextResponse.json(
        { error: "Batas waktu pemesanan untuk paket ini telah ditutup. Paket sudah tidak dapat dipesan." },
        { status: 400 }
      );
    }

    if (pkg.quotaLeft < participantCount) {
      return NextResponse.json(
        { error: `Sisa kuota paket tidak mencukupi. Sisa kuota: ${pkg.quotaLeft} orang.` },
        { status: 400 }
      );
    }

    const count = parseInt(participantCount);
    const totalPrice = pkg.price * count;
    const bookingCode = `WST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Determine payment scheme chosen by customer (DP vs Full Payment)
    const dpPercentage = pkg.dpPercentage || 0;
    const isDPChosen = (paymentPlan === "DP" || !paymentPlan) && dpPercentage > 0;
    const dpAmount = isDPChosen ? Math.ceil(totalPrice * dpPercentage / 100) : 0;

    const newBooking = await prisma.booking.create({
      data: {
        bookingCode,
        customerId: session.userId,
        packageId,
        participantCount: count,
        totalPrice,
        dpAmount,
        dpPaid: false,
        notes,
        // If customer chose DP and package allows DP, set WAITING_DP_PAYMENT; otherwise WAITING_PAYMENT
        status: isDPChosen ? "WAITING_DP_PAYMENT" : "WAITING_PAYMENT",
        participants: {
          create: participants.map((p: any) => ({
            name: p.name,
            identityNumber: p.identityNumber,
            birthDate: p.birthDate ? new Date(p.birthDate) : null,
            emergencyContact: p.emergencyContact || null,
            phone: p.phone || null,
          })),
        },
      },
      include: {
        package: true,
        participants: true,
      },
    });

    // Update customer phone if provided and not yet set
    const primaryPhone = participants[0]?.phone;
    if (primaryPhone) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { phone: primaryPhone },
      }).catch(() => {});
    }

    // REQ-4.1: Kuota trip TIDAK berkurang sebelum pembayaran/DP dikonfirmasi.
    // Quota decrement dipindahkan ke verifikasi pembayaran / payment confirmation.

    // Kirim notifikasi ke customer
    await createNotification({
      userId: session.userId,
      type: "BOOKING",
      title: "Pemesanan Berhasil Dibuat",
      message: `Pemesanan Anda untuk paket "${pkg.name}" (Kode: ${bookingCode}) telah berhasil dibuat. Silakan lakukan pembayaran.`,
      link: "/customer/bookings",
    });

    return NextResponse.json({ success: true, booking: newBooking });
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json({ error: "Gagal membuat pemesanan." }, { status: 500 });
  }
}

