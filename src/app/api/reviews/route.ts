import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/reviews?tripId=xxx — cek apakah customer sudah mereview trip tertentu
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId wajib disertakan." }, { status: 400 });
    }

    const existing = await prisma.review.findFirst({
      where: { tripId, customerId: session.userId },
    });

    return NextResponse.json({ hasReviewed: !!existing, review: existing || null });
  } catch (error) {
    console.error("Check review error:", error);
    return NextResponse.json({ error: "Gagal memeriksa status ulasan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Hanya Customer yang dapat memberikan ulasan." }, { status: 403 });
    }

    const body = await request.json();
    const { tripId, rating, comment } = body;

    if (!tripId || !rating || !comment) {
      return NextResponse.json({ error: "Trip, rating (1-5), dan komentar wajib diisi." }, { status: 400 });
    }

    // Cek duplikat — satu customer hanya boleh review satu kali per trip
    const existing = await prisma.review.findFirst({
      where: { tripId, customerId: session.userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah memberikan ulasan untuk perjalanan ini." },
        { status: 409 }
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { package: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Perjalanan tidak ditemukan." }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        tripId,
        customerId: session.userId,
        travelId: trip.package.travelId,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        comment,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Gagal mengirimkan ulasan." }, { status: 500 });
  }
}
