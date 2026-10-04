import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: {
        id: true,
        destination: true,
        currentLocation: true,
        status: true,
        checkpoints: {
          include: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
          orderBy: { reportedAt: "desc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (error) {
    console.error("Get trip checkpoints error:", error);
    return NextResponse.json({ error: "Gagal memuat titik perjalanan." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { location, note, status = "REACHED" } = body;

    if (!location || !location.trim()) {
      return NextResponse.json({ error: "Nama titik lokasi wajib diisi." }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        package: true,
        assignments: true,
        tripRoom: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip tidak ditemukan." }, { status: 404 });
    }

    // Kru yang ditugaskan (Guide / Driver) berwenang mengupdate lokasi perjalanan (didukung juga oleh Admin & Travel Owner)
    const isAssignedCrew = trip.assignments.some(
      (a) => a.workerId === session.userId && a.status === "ACCEPTED"
    );
    const isAdmin = session.role === "ADMIN";
    const isTravelOwner = session.travelId && trip.package?.travelId === session.travelId;

    if (!isAssignedCrew && !isAdmin && !isTravelOwner) {
      return NextResponse.json(
        { error: "Hanya kru (Guide / Driver) yang bertugas pada perjalanan ini yang berwenang mengupdate titik lokasi." },
        { status: 403 }
      );
    }

    // Update lokasi hanya bisa diinput jika perjalanan belum selesai/dibatalkan
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Perjalanan telah selesai atau dibatalkan. Titik lokasi tidak dapat diubah." },
        { status: 400 }
      );
    }

    // 1. Create checkpoint record
    const checkpoint = await prisma.tripCheckpoint.create({
      data: {
        tripId: trip.id,
        userId: session.userId,
        location: location.trim(),
        note: note ? note.trim() : null,
        status: status || "REACHED",
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    // 2. Update Trip currentLocation and status to ONGOING if it was SCHEDULED
    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: {
        currentLocation: location.trim(),
        status: trip.status === "SCHEDULED" ? "ONGOING" : trip.status,
        driverStarted: session.role === "DRIVER" ? true : trip.driverStarted,
      },
    });

    // 3. Broadcast to TripRoom if available
    let tripRoomId = trip.tripRoom?.id;
    if (!tripRoomId) {
      const newRoom = await prisma.tripRoom.create({
        data: {
          tripId: trip.id,
          title: `Trip Room: ${trip.package.name}`,
        },
      });
      tripRoomId = newRoom.id;
    }

    const roleLabel = session.role === "GUIDE" ? "Tour Guide" : session.role === "DRIVER" ? "Driver Wisata" : "Travel Admin";
    const updateContent = `📍 [UPDATE LOKASI PERJALANAN]\n${session.name} (${roleLabel}) melaporkan titik: "${location.trim()}"\n${note ? `Catatan: ${note.trim()}` : "Rombongan wisata berjalan lancar."}`;

    await prisma.tripUpdate.create({
      data: {
        tripRoomId,
        userId: session.userId,
        category: "GATHERING_POINT",
        content: updateContent,
      },
    });

    return NextResponse.json({ success: true, checkpoint, trip: updatedTrip });
  } catch (error) {
    console.error("Report checkpoint error:", error);
    return NextResponse.json({ error: "Gagal menyimpan laporan titik lokasi." }, { status: 500 });
  }
}
