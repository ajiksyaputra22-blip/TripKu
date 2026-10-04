import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    let travelId = session.travelId;
    let verificationStatus = "PENDING";
    
    if (session.role === "TRAVEL" && session.userId) {
      const tr = await prisma.travel.findUnique({
        where: { userId: session.userId },
        select: { id: true, verificationStatus: true },
      });
      if (tr) {
        travelId = tr.id;
        verificationStatus = tr.verificationStatus;
      } else {
        travelId = "NO_TRAVEL_FOUND";
      }
    }

    const packageWhere = session.role === "TRAVEL" 
      ? { travelId: travelId || "NO_TRAVEL_FOUND" } 
      : (travelId ? { travelId } : {});
    const bookingWhere: any = session.role === "TRAVEL" 
      ? { 
          package: { travelId: travelId || "NO_TRAVEL_FOUND" },
          status: { notIn: ["WAITING_PAYMENT", "WAITING_DP_PAYMENT"] }, // REQ-4.1
        } 
      : (travelId ? { package: { travelId } } : {});
    const tripWhere = session.role === "TRAVEL" 
      ? { package: { travelId: travelId || "NO_TRAVEL_FOUND" } } 
      : (travelId ? { package: { travelId } } : {});

    const packages = await prisma.package.findMany({
      where: packageWhere,
      include: {
        bookings: {
          where: {
            status: { notIn: ["WAITING_PAYMENT", "WAITING_DP_PAYMENT"] },
          },
          include: {
            customer: { select: { id: true, name: true, email: true, phone: true } },
            payments: true,
            participants: true,
          },
          orderBy: { createdAt: "desc" },
        },
        trips: {
          include: {
            assignments: {
              include: { worker: { select: { id: true, name: true, role: true, phone: true } } },
            },
            checkpoints: {
              include: { user: { select: { name: true, role: true } } },
              orderBy: { reportedAt: "desc" },
              take: 1,
            },
            tripRoom: true,
          },
          orderBy: { scheduleDate: "asc" },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Sort by booking count descending (best seller first)
    packages.sort((a, b) => b._count.bookings - a._count.bookings);

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        package: { select: { name: true, price: true } },
        customer: { select: { name: true, email: true, phone: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const trips = await prisma.trip.findMany({
      where: tripWhere,
    });

    const activeTrips = await prisma.trip.findMany({
      where: {
        ...tripWhere,
        status: { in: ["ONGOING", "SCHEDULED"] },
      },
      include: {
        package: { select: { name: true, destination: true } },
        booking: { select: { bookingCode: true, participantCount: true, customer: { select: { name: true, phone: true } } } },
        assignments: {
          include: { worker: { select: { name: true, role: true } } },
        },
        checkpoints: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { reportedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { scheduleDate: "asc" },
      take: 6,
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
    const totalRevenue = confirmedBookings.reduce((acc, b) => acc + b.totalPrice, 0);
    const totalParticipants = bookings.reduce((acc, b) => acc + b.participantCount, 0);
    const activeTripsCount = trips.filter((t) => t.status === "SCHEDULED" || t.status === "ONGOING").length;

    // Monthly aggregation for simple chart display
    const monthlyStats: Record<string, { month: string; bookings: number; revenue: number }> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyStats[key] = { month: key, bookings: 0, revenue: 0 };
    }

    bookings.forEach((b) => {
      const d = new Date(b.createdAt);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyStats[key]) {
        monthlyStats[key].bookings += 1;
        if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
          monthlyStats[key].revenue += b.totalPrice;
        }
      }
    });

    return NextResponse.json({
      verificationStatus,
      kpi: {
        totalBookings,
        confirmedBookingsCount: confirmedBookings.length,
        totalRevenue,
        totalParticipants,
        activeTripsCount,
        totalPackages: packages.length,
      },
      packages,
      popularPackages: [...packages]
        .sort((a, b) => b._count.bookings - a._count.bookings)
        .slice(0, 5)
        .map((p) => ({
        id: p.id,
        name: p.name,
        destination: p.destination,
        price: p.price,
        bookingCount: p._count.bookings,
      })),
      monthlyChart: Object.values(monthlyStats),
      recentBookings: bookings.slice(0, 8),
      activeTrips,
    });
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: "Gagal memuat analitik laporan." }, { status: 500 });
  }
}
