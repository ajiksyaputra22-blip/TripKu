import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST: Customer confirms trip completion  
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Hanya customer yang dapat mengkonfirmasi penyelesaian trip." }, { status: 403 });
    }

    const { id: tripId } = await params;

    // Verify this trip belongs to this customer
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        package: true,
        booking: true,
        assignments: {
          where: { status: "ACCEPTED" },
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                workerProfile: { select: { workerType: true, rating: true, totalWorkDays: true } },
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip tidak ditemukan." }, { status: 404 });
    }

    if (trip.booking?.customerId !== session.userId) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke trip ini." }, { status: 403 });
    }

    // Update trip status to COMPLETED
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: "COMPLETED" },
    });

    // Update package status to COMPLETED
    if (trip.packageId) {
      await prisma.package.update({
        where: { id: trip.packageId },
        data: { status: "COMPLETED" },
      }).catch(err => console.error("Error updating package status on customer trip complete:", err));
    }

    // Update booking status to COMPLETED
    if (trip.bookingId) {
      await prisma.booking.update({
        where: { id: trip.bookingId },
        data: { status: "COMPLETED" },
      });
    }

    // Increment totalWorkDays for assigned crew
    for (const assignment of trip.assignments) {
      await prisma.workerProfile.updateMany({
        where: { userId: assignment.workerId },
        data: { totalWorkDays: { increment: trip.package?.durationDays || 1 } },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Perjalanan berhasil dikonfirmasi selesai.",
      crew: trip.assignments.map(a => ({
        id: a.workerId,
        name: a.worker.name,
        role: a.role,
        avatarUrl: a.worker.avatarUrl,
        rating: a.worker.workerProfile?.rating,
        totalWorkDays: a.worker.workerProfile?.totalWorkDays,
      })),
    });
  } catch (error) {
    console.error("Complete trip error:", error);
    return NextResponse.json({ error: "Gagal mengkonfirmasi penyelesaian trip." }, { status: 500 });
  }
}
