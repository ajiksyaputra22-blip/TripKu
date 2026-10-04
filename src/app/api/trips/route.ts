import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (session.role === "TRAVEL") {
      whereClause.package = { travelId: session.travelId };
    } else if (session.role === "GUIDE" || session.role === "DRIVER") {
      whereClause.assignments = {
        some: { workerId: session.userId },
      };
    } else if (session.role === "CUSTOMER") {
      whereClause.booking = { customerId: session.userId };
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: {
        package: {
          select: {
            id: true,
            name: true,
            destination: true,
            coverImage: true,
            durationDays: true,
            checkpointRoute: true,
            travel: {
              select: { businessName: true, phone: true },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
            participantCount: true,
            participants: true,
            customer: { select: { name: true, phone: true } },
          },
        },
        assignments: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
                workerProfile: {
                  select: {
                    bankName: true,
                    bankAccount: true,
                    bankHolder: true,
                    licenseNumber: true,
                  },
                },
              },
            },
            fee: true,
          },
        },
        checkpoints: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { reportedAt: "desc" },
        },
        tripRoom: {
          include: {
            _count: { select: { updates: true } },
          },
        },
      },
      orderBy: { scheduleDate: "desc" },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error("Fetch trips error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar perjalanan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { packageId, bookingId, scheduleDate, destination, vehicle, operationalNotes } = body;

    if (!packageId || !scheduleDate || !destination) {
      return NextResponse.json({ error: "Paket, tanggal jadwal, dan destinasi wajib diisi." }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        packageId,
        bookingId: bookingId || null,
        scheduleDate: new Date(scheduleDate),
        destination,
        vehicle: vehicle || "HiAce Commuter / Bus",
        operationalNotes,
        status: "SCHEDULED",
      },
      include: {
        package: true,
      },
    });

    // Create default trip room
    await prisma.tripRoom.create({
      data: {
        tripId: trip.id,
        title: `Trip Room: ${trip.package.name}`,
        updates: {
          create: {
            userId: session.userId,
            category: "ANNOUNCEMENT",
            content: "Jadwal perjalanan telah ditetapkan oleh pihak travel.",
          },
        },
      },
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json({ error: "Gagal membuat jadwal perjalanan." }, { status: 500 });
  }
}
