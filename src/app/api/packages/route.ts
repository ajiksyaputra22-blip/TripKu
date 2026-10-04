import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const destination = searchParams.get("destination");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const duration = searchParams.get("duration");
    const travelId = searchParams.get("travelId");
    const originCity = searchParams.get("originCity");
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "PUBLISHED";
    const myOnly = searchParams.get("myOnly") === "true";

    // REQ-3.1: Auto-deactivate packages past their bookingDeadline (or H-3 if not set)
    const now = new Date();
    try {
      // Packages with explicit bookingDeadline
      await prisma.package.updateMany({
        where: {
          status: "PUBLISHED",
          bookingDeadline: { lte: now },
        },
        data: { status: "INACTIVE" },
      });
      // Packages without bookingDeadline: use H-3 from departureDate
      const cutoffDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      await prisma.package.updateMany({
        where: {
          status: "PUBLISHED",
          bookingDeadline: null,
          departureDate: { lte: cutoffDate },
        },
        data: { status: "INACTIVE" },
      });
    } catch (e) {
      console.warn("Auto-deactivate expired packages warning:", e);
    }

    const whereClause: any = {};

    if (status !== "ALL") {
      whereClause.status = status;
    }

    const session = await getSession();

    if (myOnly || (session?.role === "TRAVEL" && status === "ALL")) {
      let myTravelId = session?.travelId;
      if (!myTravelId && session?.userId) {
        const tr = await prisma.travel.findUnique({
          where: { userId: session.userId },
          select: { id: true },
        });
        myTravelId = tr?.id;
      }

      if (!myTravelId) {
        // Travel profile not created yet or clean new account: return 0 packages
        return NextResponse.json({ packages: [] });
      }

      whereClause.travelId = myTravelId;
    } else if (travelId) {
      whereClause.travelId = travelId;
    }

    if (destination && destination !== "ALL") {
      whereClause.destination = {
        contains: destination,
      };
    }

    if (originCity && originCity !== "ALL") {
      whereClause.originCity = {
        contains: originCity,
      };
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    if (duration && duration !== "ALL") {
      whereClause.durationDays = parseInt(duration);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { destination: { contains: search } },
        { description: { contains: search } },
        { travel: { businessName: { contains: search } } },
      ];
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
      include: {
        travel: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            bankName: true,
            bankAccount: true,
            bankHolder: true,
            verificationStatus: true,
          },
        },
        trips: {
          select: {
            id: true,
            status: true,
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: { not: "CANCELLED" },
          },
          select: {
            participantCount: true,
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: [
        { bookings: { _count: "desc" } },
        { createdAt: "desc" },
      ],
    });

    const enrichedPackages = packages.map((pkg) => {
      const allReviews = pkg.trips?.flatMap((t) => t.reviews) || [];
      const reviewCount = allReviews.length;
      const avgRating = reviewCount > 0
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

      // Total keseluruhan orang yang memesan trip ini (kumulatif seluruh batch/riwayat)
      const totalBookedPax = pkg.bookings.reduce((sum, b) => sum + (b.participantCount || 1), 0);

      const { trips, bookings, ...rest } = pkg;
      return {
        ...rest,
        rating: avgRating,
        reviewCount,
        totalBookedPax,
        totalBookings: totalBookedPax,
      };
    });

    // Urutkan dari yang paling banyak dipesan ke yang paling sedikit (Best Seller & Rekomendasi)
    enrichedPackages.sort((a, b) => {
      const bBooked = (b.totalBookedPax || 0) - (a.totalBookedPax || 0);
      if (bBooked !== 0) return bBooked;
      const bBookings = (b._count?.bookings || 0) - (a._count?.bookings || 0);
      if (bBookings !== 0) return bBookings;
      const bReviews = (b.reviewCount || 0) - (a.reviewCount || 0);
      if (bReviews !== 0) return bReviews;
      const bRating = (b.rating || 0) - (a.rating || 0);
      if (bRating !== 0) return bRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ packages: enrichedPackages });
  } catch (error) {
    console.error("Fetch packages error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar paket wisata." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Hanya agen Travel yang diizinkan membuat paket wisata." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      destination,
      originCity,
      province,
      price,
      departureDate,
      bookingDeadline,
      durationDays,
      vehicle,
      facilities,
      accommodation,
      capacity,
      description,
      coverImage,
      gallery,
      checkpointRoute,
      dpPercentage,
      category,
    } = body;

    if (!name || !destination || !price || !capacity || !description) {
      return NextResponse.json(
        { error: "Nama, destinasi, harga, kapasitas, dan deskripsi wajib diisi." },
        { status: 400 }
      );
    }

    // Determine travelId strictly for this travel agency
    let targetTravelId = session.travelId;
    if (!targetTravelId && session.userId) {
      const tr = await prisma.travel.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      targetTravelId = tr?.id;
    }

    if (!targetTravelId && session.role === "TRAVEL") {
      const userRec = await prisma.user.findUnique({ where: { id: session.userId } });
      const newTr = await prisma.travel.create({
        data: {
          userId: session.userId,
          businessName: userRec?.name ? `Travel ${userRec.name}` : "Mitra Travel",
          verificationStatus: "PENDING",
        },
      });
      targetTravelId = newTr.id;
    } else if (!targetTravelId && session.role === "ADMIN") {
      const firstTravel = await prisma.travel.findFirst();
      targetTravelId = firstTravel?.id;
    }

    if (!targetTravelId) {
      return NextResponse.json(
        { error: "Profil Travel tidak ditemukan untuk akun ini." },
        { status: 400 }
      );
    }

    // Create unique slug
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const facilitiesString = Array.isArray(facilities)
      ? JSON.stringify(facilities)
      : typeof facilities === "string"
      ? facilities
      : JSON.stringify(["Transportasi", "Tiket Wisata"]);

    const newPackage = await prisma.package.create({
      data: {
        travelId: targetTravelId,
        name,
        slug,
        destination,
        originCity: originCity || null,
        province: province || "Indonesia",
        price: parseFloat(price),
        departureDate: departureDate ? new Date(departureDate) : new Date(Date.now() + 7 * 86400000),
        bookingDeadline: bookingDeadline ? new Date(bookingDeadline) : null,
        durationDays: parseInt(durationDays) || 1,
        vehicle: vehicle || "HiAce Commuter / Bus Pariwisata",
        facilities: facilitiesString,
        accommodation: accommodation || "Hotel / Penginapan",
        capacity: parseInt(capacity),
        quotaLeft: parseInt(capacity),
        description,
        coverImage: coverImage || "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800",
        gallery: gallery ? JSON.stringify(gallery) : null,
        checkpointRoute: checkpointRoute ? JSON.stringify(checkpointRoute) : null,
        dpPercentage: parseInt(dpPercentage) || 0,
        category: category || "WISATA_ALAM",
        status: "PUBLISHED",
      },
    });

    return NextResponse.json({ success: true, package: newPackage });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json(
      { error: "Gagal membuat paket wisata baru." },
      { status: 500 }
    );
  }
}
