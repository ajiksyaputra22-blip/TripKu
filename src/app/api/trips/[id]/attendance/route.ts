import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST: Guide manages attendance (departure/return) for customers
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id: tripId } = await params;
    const body = await request.json();
    const { attendances, type } = body; 
    // attendances: [{ customerId, isPresent, note }]
    // type: "DEPARTURE" | "RETURN"

    if (!attendances || !type) {
      return NextResponse.json({ error: "Data absensi tidak lengkap." }, { status: 400 });
    }

    if (type === "DEPARTURE" && session.role === "GUIDE") {
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { scheduleDate: true },
      });
      if (trip && trip.scheduleDate) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const tripDate = new Date(trip.scheduleDate);
        const tripStart = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate()).getTime();
        if (todayStart < tripStart) {
          return NextResponse.json(
            { error: "Absen keberangkatan hanya dapat dilakukan pada hari jadwal keberangkatan." },
            { status: 400 }
          );
        }
      }
    }

    const results = [];
    for (const att of attendances) {
      const record = await prisma.tripAttendance.upsert({
        where: {
          tripId_customerId_type: {
            tripId,
            customerId: att.customerId,
            type,
          },
        },
        create: {
          tripId,
          customerId: att.customerId,
          recordedBy: session.userId,
          type,
          isPresent: att.isPresent,
          note: att.note || null,
        },
        update: {
          isPresent: att.isPresent,
          note: att.note || null,
          recordedBy: session.userId,
          recordedAt: new Date(),
        },
      });
      results.push(record);
    }

    // Update attendance flag on Trip
    if (type === "DEPARTURE") {
      await prisma.trip.update({
        where: { id: tripId },
        data: { departureAttendanceDone: true },
      });
    } else if (type === "RETURN") {
      await prisma.trip.update({
        where: { id: tripId },
        data: { returnAttendanceDone: true },
      });
    }

    return NextResponse.json({ success: true, attendances: results, departureAttendanceDone: type === "DEPARTURE" });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "Gagal menyimpan absensi." }, { status: 500 });
  }
}

// GET: Get attendance for a trip
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { id: tripId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const attendances = await prisma.tripAttendance.findMany({
      where: {
        tripId,
        ...(type ? { type } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, nik: true, avatarUrl: true } },
      },
      orderBy: { recordedAt: "asc" },
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json({ error: "Gagal mengambil data absensi." }, { status: 500 });
  }
}
