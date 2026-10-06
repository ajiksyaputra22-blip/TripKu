import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

      if (!hasReachedAllStops && !isAdmin && !isTravelOwner && session.role !== "DRIVER") {
        return NextResponse.json(
          { error: `Perjalanan belum dapat diselesaikan. Seluruh titik rute (${trip.checkpoints.length}/${stops.length}) wajib dilaporkan terlebih dahulu melalui tombol 'Lapor Titik'.` },
          { status: 400 }
        );
      }

      const hasGuide = trip.assignments.some((a) => a.role === "GUIDE" && a.status === "ACCEPTED");
      if (hasGuide && !isAdmin && !isTravelOwner && session.role !== "DRIVER") {
        const hasReturnAttendance =
          trip.returnAttendanceDone ||
          trip.attendances.some((att) => att.type === "RETURN");
        if (!hasReturnAttendance) {
          return NextResponse.json(
            { error: "Perjalanan belum dapat diselesaikan. Tour Guide wajib melakukan 'Absen Pulang' wisatawan di titik akhir terlebih dahulu." },
            { status: 400 }
          );
        }
      }

      const updatedTrip = await prisma.trip.update({
        where: { id },
        data: { status: "COMPLETED" },
      });

      if (trip.packageId) {
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
