import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    // Dapatkan travelId
    let travelId = session.travelId;
    if (session.role === "TRAVEL" && session.userId) {
      const travel = await prisma.travel.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (travel) travelId = travel.id;
    }

    if (!travelId) {
      return NextResponse.json({ packages: [] });
    }

    // Ambil semua paket beserta SELURUH booking historisnya (termasuk dari trip yang sudah selesai)
    const packages = await prisma.package.findMany({
      where: { travelId },
      include: {
        trips: {
          include: {
            booking: {
              include: {
                customer: {
                  select: { id: true, name: true, email: true, phone: true },
                },
                participants: {
                  select: { id: true, name: true, identityNumber: true, phone: true, birthDate: true },
                },
                payments: {
                  select: { id: true, amount: true, method: true, paymentType: true, status: true, paymentDate: true },
                },
              },
            },
          },
          orderBy: { scheduleDate: "asc" },
        },
        bookings: {
          where: {
            status: { notIn: ["WAITING_PAYMENT", "WAITING_DP_PAYMENT"] },
          },
          include: {
            customer: {
              select: { id: true, name: true, email: true, phone: true },
            },
            participants: {
              select: { id: true, name: true, identityNumber: true, phone: true, birthDate: true },
            },
            payments: {
              select: { id: true, amount: true, method: true, paymentType: true, status: true, paymentDate: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Struktur data: per paket, kelompokkan booking berdasarkan trip (siklus perjalanan)
    const result = packages.map((pkg) => {
      // Buat siklus trip: setiap trip adalah satu siklus perjalanan
      const tripCycles = pkg.trips.map((trip) => {
        const tripBooking = trip.booking;
        
        // Hitung total pax dari booking yang terhubung ke trip ini
        const paxCount = tripBooking?.participantCount ?? 0;
        const totalRevenue = tripBooking?.totalPrice ?? 0;
        
        return {
          tripId: trip.id,
          tripStatus: trip.status,
          scheduleDate: trip.scheduleDate,
          destination: trip.destination,
          vehicle: trip.vehicle,
          booking: tripBooking ? {
            id: tripBooking.id,
            bookingCode: tripBooking.bookingCode,
            status: tripBooking.status,
            participantCount: tripBooking.participantCount,
            totalPrice: tripBooking.totalPrice,
            createdAt: tripBooking.createdAt,
            customer: tripBooking.customer,
            participants: tripBooking.participants,
            payments: tripBooking.payments,
          } : null,
          paxCount,
          totalRevenue,
        };
      });

      // Booking yang tidak terhubung ke trip manapun (booking langsung ke paket)
      const tripBookingIds = new Set(
        pkg.trips.map((t) => t.bookingId).filter(Boolean)
      );
      const standaloneBookings = pkg.bookings.filter(
        (b) => !tripBookingIds.has(b.id)
      );

      // Total statistik paket
      const allConfirmedBookings = pkg.bookings.filter(
        (b) => b.status === "CONFIRMED" || b.status === "COMPLETED"
      );
      const totalPax = pkg.bookings.reduce((acc, b) => acc + b.participantCount, 0);
      const totalRevenue = allConfirmedBookings.reduce((acc, b) => acc + b.totalPrice, 0);

      return {
        id: pkg.id,
        name: pkg.name,
        destination: pkg.destination,
        departureDate: pkg.departureDate,
        durationDays: pkg.durationDays,
        capacity: pkg.capacity,
        quotaLeft: pkg.quotaLeft,
        status: pkg.status,
        coverImage: pkg.coverImage,
        price: pkg.price,
        vehicle: pkg.vehicle,
        // Siklus perjalanan (per trip)
        tripCycles,
        // Semua booking untuk paket ini (historis lengkap)
        allBookings: pkg.bookings,
        standaloneBookings,
        // Statistik agregat
        stats: {
          totalBookings: pkg.bookings.length,
          confirmedBookings: allConfirmedBookings.length,
          totalPax,
          totalRevenue,
          completedTrips: pkg.trips.filter((t) => t.status === "COMPLETED").length,
          activeTrips: pkg.trips.filter((t) => t.status === "SCHEDULED" || t.status === "ONGOING").length,
        },
      };
    });

    return NextResponse.json({ packages: result });
  } catch (error) {
    console.error("Booking history error:", error);
    return NextResponse.json(
      { error: "Gagal memuat riwayat pemesanan." },
      { status: 500 }
    );
  }
}
