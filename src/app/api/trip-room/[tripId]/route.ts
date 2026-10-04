import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { tripId } = await params;

    let tripRoom = await prisma.tripRoom.findUnique({
      where: { tripId },
      include: {
        trip: {
          include: {
            package: { select: { name: true, destination: true, coverImage: true } },
            booking: { select: { bookingCode: true, customerId: true } },
            assignments: {
              include: {
                worker: { select: { id: true, name: true, role: true, phone: true } },
              },
            },
            checkpoints: {
              include: {
                user: { select: { id: true, name: true, role: true } },
              },
              orderBy: { reportedAt: "desc" },
            },
          },
        },
        updates: {
          include: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Auto-create room if not exists
    if (!tripRoom) {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: { package: true },
      });
      if (!trip) {
        return NextResponse.json({ error: "Trip tidak ditemukan." }, { status: 404 });
      }

      tripRoom = await prisma.tripRoom.create({
        data: {
          tripId: trip.id,
          title: `Trip Room: ${trip.package.name}`,
        },
        include: {
          trip: {
            include: {
              package: { select: { name: true, destination: true, coverImage: true } },
              booking: { select: { bookingCode: true, customerId: true } },
              assignments: {
                include: {
                  worker: { select: { id: true, name: true, role: true, phone: true } },
                },
              },
              checkpoints: {
                include: {
                  user: { select: { id: true, name: true, role: true } },
                },
                orderBy: { reportedAt: "desc" },
              },
            },
          },
          updates: {
            include: {
              user: { select: { id: true, name: true, role: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

    return NextResponse.json({ tripRoom });
  } catch (error) {
    console.error("Get trip room error:", error);
    return NextResponse.json({ error: "Gagal memuat Trip Room." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { tripId } = await params;
    const body = await request.json();
    const { content, category } = body;

    // Hanya Tour Guide yang berwenang menyampaikan pengumuman di Trip Room
    if (session.role !== "GUIDE" && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Hanya Tour Guide yang berwenang menyampaikan pengumuman di Trip Room." },
        { status: 403 }
      );
    }

    if (!content) {
      return NextResponse.json({ error: "Isi pengumuman wajib diisi." }, { status: 400 });
    }

    let tripRoom = await prisma.tripRoom.findUnique({
      where: { tripId },
    });

    if (!tripRoom) {
      tripRoom = await prisma.tripRoom.create({
        data: {
          tripId,
          title: "Trip Coordination Room",
        },
      });
    }

    const update = await prisma.tripUpdate.create({
      data: {
        tripRoomId: tripRoom.id,
        userId: session.userId,
        content,
        category: category || "ANNOUNCEMENT",
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    // Kirim notifikasi ke semua anggota trip (kecuali pengirim)
    const tripData = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        booking: { select: { customerId: true } },
        assignments: { select: { workerId: true } },
      },
    });

    if (tripData) {
      const recipientIds = new Set<string>();
      if (tripData.booking?.customerId) recipientIds.add(tripData.booking.customerId);
      tripData.assignments.forEach((a) => recipientIds.add(a.workerId));
      recipientIds.delete(session.userId); // jangan kirim ke pengirim

      const categoryLabel = category === "EMERGENCY" ? "🚨 Darurat" : category === "LOCATION" ? "📍 Lokasi" : "📢 Pengumuman";
      for (const uid of recipientIds) {
        await createNotification({
          userId: uid,
          type: "TRIP_UPDATE",
          title: `${categoryLabel} di Trip Room`,
          message: content.length > 100 ? content.slice(0, 97) + "..." : content,
          link: `/customer/bookings`,
        });
      }
    }

    return NextResponse.json({ success: true, update });
  } catch (error) {
    console.error("Post trip update error:", error);
    return NextResponse.json({ error: "Gagal mengirim pembaruan ke Trip Room." }, { status: 500 });
  }
}
