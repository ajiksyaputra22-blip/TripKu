import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json(); // SCHEDULED, ONGOING, COMPLETED, CANCELLED

    const validStatuses = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status perjalanan tidak valid." }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        package: true,
        booking: {
          select: {
            id: true,
            customerId: true,
            bookingCode: true,
          },
        },
        assignments: {
          include: {
            fee: true,
            worker: { select: { id: true, name: true, role: true } },
          },
        },
        checkpoints: true,
        attendances: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Perjalanan tidak ditemukan." }, { status: 404 });
    }

    const isTravelOwner = trip.package.travelId === session.travelId;
    const isAssignedWorker = trip.assignments.some(
      (a) => a.workerId === session.userId && a.status === "ACCEPTED"
    );
    const isAdmin = session.role === "ADMIN";

    if (!isTravelOwner && !isAssignedWorker && !isAdmin) {
      return NextResponse.json({ error: "Anda tidak berhak memperbarui status perjalanan ini." }, { status: 403 });
    }

    // 1. STARTING THE TRIP (status: "ONGOING")
    if (status === "ONGOING") {
      // Find current user's assignment if worker
      const userAssignment = trip.assignments.find((a) => a.workerId === session.userId && a.status === "ACCEPTED");

      if (userAssignment && !isAdmin && !isTravelOwner) {
        // Validation: Fee must be paid (DP or Full)
        const isFeePaid =
          userAssignment.fee?.paymentStatus === "PAID" ||
          userAssignment.fee?.paymentStatus === "DP_PAID" ||
          userAssignment.fee?.dpPaid ||
          userAssignment.dpFeePaid;

        if (!isFeePaid) {
          return NextResponse.json(
            { error: "Fee penugasan belum dibayar oleh Admin Travel. Perjalanan hanya dapat dimulai setelah pembayaran fee (DP atau Lunas) diverifikasi." },
            { status: 400 }
          );
        }

        // Guide-specific validation: Must do Absen Berangkat first
        if (session.role === "GUIDE" || userAssignment.role === "GUIDE") {
          const hasDepartureAttendance =
            trip.departureAttendanceDone ||
            trip.attendances.some((att) => att.type === "DEPARTURE");

          if (!hasDepartureAttendance) {
            return NextResponse.json(
              { error: "Tour Guide wajib mendahulukan 'Absen Berangkat' wisatawan terlebih dahulu sebelum bisa memulai trip." },
              { status: 400 }
            );
          }
        }
      }

      // Jika perjalanan mandiri tanpa Guide/kru dan dimulai oleh pihak Travel: wajib Absen Berangkat dulu
      const hasGuideAssigned = trip.assignments.some(
        (a) => a.role === "GUIDE" && ["ACCEPTED", "ASSIGNED", "CONFIRMED"].includes(a.status)
      );
      if (!hasGuideAssigned && isTravelOwner) {
        const hasDepartureAttendance =
          trip.departureAttendanceDone ||
          trip.attendances.some((att) => att.type === "DEPARTURE");

        if (!hasDepartureAttendance) {
          return NextResponse.json(
            { error: "Perjalanan mandiri wajib melakukan 'Absen Berangkat' wisatawan terlebih dahulu sebelum bisa memulai perjalanan." },
            { status: 400 }
          );
        }
      }

      // Check mutual confirmation for Guide and Driver
      const guideAssignment = trip.assignments.find((a) => a.role === "GUIDE" && a.status === "ACCEPTED");
      const driverAssignment = trip.assignments.find((a) => a.role === "DRIVER" && a.status === "ACCEPTED");

      let guideStarted = trip.guideStarted;
      let driverStarted = trip.driverStarted;
      let guideStartedAt = trip.guideStartedAt;
      let driverStartedAt = trip.driverStartedAt;

      if (session.role === "GUIDE" || userAssignment?.role === "GUIDE") {
        guideStarted = true;
        driverStarted = true;
        guideStartedAt = new Date();
        driverStartedAt = new Date();
      } else if (session.role === "DRIVER" || userAssignment?.role === "DRIVER") {
        driverStarted = true;
        driverStartedAt = new Date();
      } else if (isAdmin || isTravelOwner) {
        guideStarted = true;
        driverStarted = true;
        guideStartedAt = new Date();
        driverStartedAt = new Date();
      }

      // Tour Guide memegang kendali memulai trip; driver otomatis ikut on-going
      let newStatus = "ONGOING";
      let responseMessage = "Perjalanan rombongan resmi dimulai 🚀";
      let waitingFor: "GUIDE" | "DRIVER" | null = null;

      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: {
          status: newStatus,
          guideStarted,
          driverStarted,
          guideStartedAt,
          driverStartedAt,
        },
      });

      // Kirim notifikasi ke pelanggan/customer bahwa trip telah aktif dan resmi dimulai
      try {
        const customerIdsToNotify = new Set<string>();
        if (trip.booking?.customerId) {
          customerIdsToNotify.add(trip.booking.customerId);
        }

        // Jika Open Trip tanpa direct bookingId di trip, cari seluruh booking CONFIRMED untuk paket ini
        if (trip.packageId && !trip.bookingId) {
          const packageBookings = await prisma.booking.findMany({
            where: {
              packageId: trip.packageId,
              status: { in: ["CONFIRMED", "PAID"] },
            },
            select: { customerId: true },
          });
          packageBookings.forEach((b) => {
            if (b.customerId) customerIdsToNotify.add(b.customerId);
          });
        }

        const packageName = trip.package?.name || "Wisata";
        for (const cId of customerIdsToNotify) {
          await createNotification({
            userId: cId,
            type: "TRIP_UPDATE",
            title: "Perjalanan Wisata Telah Dimulai! 🚀",
            message: `Kabar gembira! Paket perjalanan "${packageName}" Anda telah resmi dimulai oleh pihak pelaksana. Selamat berwisata dan nikmati liburan Anda!`,
            link: "/customer/bookings",
          });
        }
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi trip dimulai ke customer:", notifErr);
      }

      return NextResponse.json({
        success: true,
        trip: updatedTrip,
        message: responseMessage,
        waitingFor,
        isFullyStarted: newStatus === "ONGOING",
      });
    }

    // 2. COMPLETING THE TRIP (status: "COMPLETED")
    if (status === "COMPLETED") {
      // Check if all route checkpoints have been reported
      let stops: string[] = [];
      try {
        const raw = trip.package?.checkpointRoute;
        if (raw) {
          if (Array.isArray(raw)) {
            stops = raw;
          } else if (typeof raw === "string") {
            try {
              const parsed = JSON.parse(raw);
              stops = Array.isArray(parsed) ? parsed : [];
            } catch {
              stops = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
          }
        }
      } catch {
        stops = [];
      }
      if (stops.length === 0) {
        stops = ["Titik Kumpul / Keberangkatan", "Perjalanan Menuju Destinasi", "Tiba di Lokasi Utama", "Aktivitas Wisata", "Perjalanan Pulang"];
      }

      const lastStop = stops[stops.length - 1];
      const dest = trip.package?.destination;
      const hasReachedAllStops =
        trip.checkpoints.length >= stops.length ||
        trip.currentLocation === lastStop ||
        (dest && trip.currentLocation?.toLowerCase() === dest.toLowerCase());

      if (!hasReachedAllStops && !isAdmin && session.role !== "DRIVER") {
        return NextResponse.json(
          { error: `Perjalanan belum dapat diselesaikan. Seluruh titik rute (${trip.checkpoints.length}/${stops.length}) wajib dilaporkan hingga titik akhir terlebih dahulu melalui tombol 'Lapor Titik'.` },
          { status: 400 }
        );
      }

      const hasGuide = trip.assignments.some((a) => a.role === "GUIDE" && a.status === "ACCEPTED");
      if (hasGuide && !isAdmin && session.role !== "DRIVER") {
        const hasReturnAttendance =
          trip.returnAttendanceDone ||
          trip.attendances.some((att) => att.type === "RETURN");
        if (!hasReturnAttendance) {
          return NextResponse.json(
            { error: "Perjalanan belum dapat diselesaikan. Tour Guide wajib melakukan 'Absen Pulang' wisatawan di titik akhir terlebih dahulu." },
            { status: 400 }
          );
        }
      } else if (!hasGuide && !isAdmin && isTravelOwner) {
        // Jika perjalanan mandiri tanpa kru, pihak travel wajib melakukan 'Absen Pulang' wisatawan di titik akhir
        const hasReturnAttendance =
          trip.returnAttendanceDone ||
          trip.attendances.some((att) => att.type === "RETURN");
        if (!hasReturnAttendance) {
          return NextResponse.json(
            { error: "Perjalanan mandiri belum dapat diselesaikan. Pihak travel wajib melakukan 'Absen Pulang' wisatawan di titik akhir terlebih dahulu." },
            { status: 400 }
          );
        }
      }

      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      if (trip.packageId && trip.package?.tripType !== "PRIVATE") {
        await prisma.package.update({
          where: { id: trip.packageId },
          data: { status: "COMPLETED" },
        }).catch(err => console.error("Error updating package status on trip completion:", err));
      }

      if (trip.bookingId) {
        await prisma.booking.update({
          where: { id: trip.bookingId },
          data: { status: "COMPLETED" },
        });
      }

      // Kirim notifikasi ke pelanggan/customer bahwa trip telah selesai
      try {
        const customerIdsToNotify = new Set<string>();
        if (trip.booking?.customerId) {
          customerIdsToNotify.add(trip.booking.customerId);
        }
        if (trip.packageId && !trip.bookingId) {
          const packageBookings = await prisma.booking.findMany({
            where: {
              packageId: trip.packageId,
              status: { in: ["CONFIRMED", "PAID", "COMPLETED"] },
            },
            select: { customerId: true },
          });
          packageBookings.forEach((b) => {
            if (b.customerId) customerIdsToNotify.add(b.customerId);
          });
        }
        const packageName = trip.package?.name || "Wisata";
        for (const cId of customerIdsToNotify) {
          await createNotification({
            userId: cId,
            type: "TRIP_UPDATE",
            title: "Perjalanan Telah Selesai! 🎉",
            message: `Perjalanan paket wisata "${packageName}" telah selesai dilaksanakan. Terima kasih telah berwisata bersama kami! Jangan lupa berikan ulasan Anda.`,
            link: "/customer/bookings",
          });
        }
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi trip selesai ke customer:", notifErr);
      }

      return NextResponse.json({
        success: true,
        trip: updatedTrip,
        message: "Perjalanan telah berhasil diselesaikan! Terima kasih atas pelayanan terbaik Anda. 🎉",
      });
    }

    // Default status update (e.g. CANCELLED / SCHEDULED)
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Update trip status error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status perjalanan." }, { status: 500 });
  }
}
