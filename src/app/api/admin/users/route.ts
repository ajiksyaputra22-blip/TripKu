import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        travelProfile: { select: { businessName: true, verificationStatus: true } },
        workerProfile: { select: { workerType: true, licenseNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalTravels = await prisma.travel.count();
    const totalPackages = await prisma.package.count();
    const totalBookings = await prisma.booking.count();
    const totalTrips = await prisma.trip.count();
    const totalWorkers = await prisma.workerProfile.count();

    return NextResponse.json({
      users,
      stats: {
        totalUsers: users.length,
        totalTravels,
        totalPackages,
        totalBookings,
        totalTrips,
        totalWorkers,
      },
    });
  } catch (error) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json({ error: "Gagal memuat data pengguna." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { userId, status } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status }, // ACTIVE | SUSPENDED
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status pengguna." }, { status: 500 });
  }
}
