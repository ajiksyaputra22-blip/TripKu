import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Get worker reviews (for a specific workerId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get("workerId");
    const tripId = searchParams.get("tripId");

    const where: any = {};
    if (workerId) where.workerId = workerId;
    if (tripId) where.tripId = tripId;

    const reviews = await prisma.workerReview.findMany({
      where,
      include: {
        customer: { select: { name: true, avatarUrl: true } },
        worker: {
          select: {
            name: true,
            avatarUrl: true,
            workerProfile: { select: { workerType: true, rating: true, totalWorkDays: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Get worker reviews error:", error);
    return NextResponse.json({ error: "Gagal mengambil ulasan." }, { status: 500 });
  }
}

// POST: Customer submits review for guide/driver
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Hanya customer yang bisa memberikan ulasan." }, { status: 403 });
    }

    const body = await request.json();
    const { tripId, workerId, workerRole, rating, comment } = body;

    if (!tripId || !workerId || !workerRole || !rating) {
      return NextResponse.json({ error: "Data ulasan tidak lengkap." }, { status: 400 });
    }

    // Check if already reviewed
    const existing = await prisma.workerReview.findUnique({
      where: {
        tripId_workerId_customerId: {
          tripId,
          workerId,
          customerId: session.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Anda sudah memberikan ulasan untuk kru ini." }, { status: 409 });
    }

    // Verify trip belongs to this customer's booking
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { booking: true },
    });

    if (!trip || trip.booking?.customerId !== session.userId) {
      return NextResponse.json({ error: "Trip tidak valid." }, { status: 403 });
    }

    const review = await prisma.workerReview.create({
      data: {
        tripId,
        workerId,
        customerId: session.userId,
        workerRole,
        rating: parseInt(rating),
        comment: comment || null,
      },
    });

    // Update worker's average rating
    const allReviews = await prisma.workerReview.findMany({ where: { workerId } });
    const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await prisma.workerProfile.updateMany({
      where: { userId: workerId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error("Worker review error:", error);
    return NextResponse.json({ error: "Gagal menyimpan ulasan." }, { status: 500 });
  }
}
