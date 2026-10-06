import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pkg = await prisma.package.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        travel: {
          select: {
            id: true,
            businessName: true,
            description: true,
            logoUrl: true,
            phone: true,
            verificationStatus: true,
            bankName: true,
            bankAccount: true,
            bankHolder: true,
          },
        },
        trips: {
          include: {
            assignments: {
              include: {
                worker: {
                  select: { id: true, name: true, phone: true, role: true, avatarUrl: true, workerProfile: true },
                },
                fee: true,
              },
            },
            checkpoints: {
              include: { user: { select: { id: true, name: true, role: true } } },
              orderBy: { reportedAt: "desc" },
            },
            tripRoom: {
              include: {
                updates: {
                  include: { user: { select: { id: true, name: true, role: true } } },
                  orderBy: { createdAt: "desc" },
                },
              },
            },
            booking: {
              include: {
                customer: { select: { id: true, name: true, email: true, phone: true, nik: true } },
                participants: true,
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
            customer: { select: { id: true, name: true, email: true, phone: true, nik: true } },
            participants: true,
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: "Paket wisata tidak ditemukan." },
        { status: 404 }
      );
    }

    // REQ-3.1: Auto-deactivate if past bookingDeadline (or H-1 fallback)
    const now = new Date();
    let currentStatus = pkg.status;
    let isExpired = false;
    if (pkg.bookingDeadline) {
      const deadline = new Date(pkg.bookingDeadline);
      if (deadline.getUTCHours() === 0 && deadline.getUTCMinutes() === 0) {
        deadline.setUTCHours(23, 59, 59, 999);
      }
      isExpired = now.getTime() > deadline.getTime();
    } else if (pkg.departureDate) {
      isExpired = new Date(pkg.departureDate).getTime() - now.getTime() <= 1 * 24 * 60 * 60 * 1000;
    }

    if (pkg.status === "PUBLISHED" && isExpired) {
      await prisma.package.update({
        where: { id: pkg.id },
        data: { status: "INACTIVE" },
      });
      currentStatus = "INACTIVE";
    }

    // Fetch reviews for this package
    const reviews = await prisma.review.findMany({
      where: { trip: { packageId: pkg.id } },
      include: {
        customer: {
          select: { name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // REQ-3.3: Rating agensi dihitung dari agregasi rating seluruh paket yang dimiliki Admin Travel tersebut
    const travelPackages = await prisma.package.findMany({
      where: { travelId: pkg.travelId },
      select: { id: true, _count: { select: { bookings: true } } },
    });

    const allAgencyReviews = await prisma.review.findMany({
      where: {
        travelId: pkg.travelId,
      },
      select: { rating: true },
    });

    const packageReviewCount = reviews.length;
    const packageRating = packageReviewCount > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / packageReviewCount).toFixed(1))
      : null;

    const avgAgencyRating = allAgencyReviews.length > 0
      ? parseFloat((allAgencyReviews.reduce((sum, r) => sum + r.rating, 0) / allAgencyReviews.length).toFixed(1))
      : null;

    // REQ: Total keseluruhan orang yang memesan paket wisata ini (kumulatif seluruh batch)
    const packageBookings = await prisma.booking.findMany({
      where: {
        packageId: pkg.id,
        status: { not: "CANCELLED" },
      },
      select: {
        participantCount: true,
      },
    });
    const totalBookedPax = packageBookings.reduce((sum, b) => sum + (b.participantCount || 1), 0);

    const enrichedPackage = {
      ...pkg,
      status: currentStatus,
      rating: packageRating,
      reviewCount: packageReviewCount,
      totalBookedPax,
      totalBookings: totalBookedPax,
      travel: {
        ...pkg.travel,
        rating: avgAgencyRating,
        reviewsCount: allAgencyReviews.length,
        packagesCount: travelPackages.length,
        totalBookings: travelPackages.reduce((acc, p) => acc + p._count.bookings, 0),
      },
    };

    return NextResponse.json({ package: enrichedPackage, reviews });
  } catch (error) {
    console.error("Get package detail error:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail paket wisata." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan." },
        { status: 404 }
      );
    }

    if (session.role === "TRAVEL" && existingPackage.travelId !== session.travelId) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin mengubah paket ini." },
        { status: 403 }
      );
    }

    // Cek apakah ada pesanan aktif yang masih berlangsung
    const activeBookingsCount = await prisma.booking.count({
      where: {
        packageId: id,
        status: { in: ["CONFIRMED", "PAID", "DP_PAID", "WAITING_PAYMENT", "WAITING_DP_PAYMENT"] },
      },
    });
    if (activeBookingsCount > 0) {
      return NextResponse.json(
        { error: "Paket tidak bisa diedit karena masih ada pesanan yang berlangsung." },
        { status: 409 }
      );
    }

    const newCapacity = body.capacity ? parseInt(body.capacity) : existingPackage.capacity;
    let quotaLeftToSet = existingPackage.quotaLeft;

    // Reset quotaLeft ke penuh HANYA saat reactivate dari COMPLETED ke PUBLISHED
    if (body.status === "PUBLISHED" && existingPackage.status === "COMPLETED") {
      quotaLeftToSet = newCapacity;
    } else if (body.quotaLeft !== undefined) {
      quotaLeftToSet = parseInt(body.quotaLeft);
    } else if (body.capacity && parseInt(body.capacity) !== existingPackage.capacity) {
      const diff = parseInt(body.capacity) - existingPackage.capacity;
      quotaLeftToSet = Math.max(0, (existingPackage.quotaLeft ?? existingPackage.capacity) + diff);
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name: body.name ?? existingPackage.name,
        destination: body.destination ?? existingPackage.destination,
        originCity: body.originCity !== undefined ? (body.originCity || null) : existingPackage.originCity,
        price: body.price ? parseFloat(body.price) : existingPackage.price,
        departureDate: body.departureDate ? new Date(body.departureDate) : existingPackage.departureDate,
        bookingDeadline: body.bookingDeadline !== undefined
          ? (body.bookingDeadline
              ? new Date(typeof body.bookingDeadline === "string" && !body.bookingDeadline.includes("T") ? `${body.bookingDeadline}T23:59:59.999Z` : body.bookingDeadline)
              : null)
          : existingPackage.bookingDeadline,
        durationDays: body.durationDays ? parseInt(body.durationDays) : existingPackage.durationDays,
        vehicle: body.vehicle ?? existingPackage.vehicle,
        facilities: body.facilities ? (typeof body.facilities === "string" ? body.facilities : JSON.stringify(body.facilities)) : existingPackage.facilities,
        accommodation: body.accommodation ?? existingPackage.accommodation,
        capacity: newCapacity,
        quotaLeft: quotaLeftToSet,
        description: body.description ?? existingPackage.description,
        coverImage: body.coverImage ?? existingPackage.coverImage,
        checkpointRoute: body.checkpointRoute !== undefined
          ? (Array.isArray(body.checkpointRoute) && body.checkpointRoute.length > 0 ? JSON.stringify(body.checkpointRoute) : null)
          : existingPackage.checkpointRoute,
        dpPercentage: body.dpPercentage !== undefined ? (parseInt(body.dpPercentage) || 0) : existingPackage.dpPercentage,
        category: body.category ?? existingPackage.category,
        status: body.status ?? existingPackage.status,
      },
    });

    // If reactivating to PUBLISHED from COMPLETED, ensure a fresh scheduled trip is available for the new departureDate
    if (body.status === "PUBLISHED" && existingPackage.status === "COMPLETED") {
      try {
        const activeTrip = await prisma.trip.findFirst({
          where: { packageId: id, status: { in: ["SCHEDULED", "ONGOING"] } },
        });
        if (!activeTrip) {
          const depDate = body.departureDate ? new Date(body.departureDate) : existingPackage.departureDate;
          const newTrip = await prisma.trip.create({
            data: {
              packageId: id,
              scheduleDate: depDate,
              destination: body.destination ?? existingPackage.destination,
              vehicle: body.vehicle ?? existingPackage.vehicle,
              operationalNotes: `Perjalanan rombongan: ${body.name ?? existingPackage.name}`,
              status: "SCHEDULED",
            },
          });
          await prisma.tripRoom.create({
            data: {
              tripId: newTrip.id,
              title: `Trip Room: ${body.name ?? existingPackage.name}`,
              updates: {
                create: {
                  userId: session.userId,
                  category: "ANNOUNCEMENT",
                  content: "Jadwal perjalanan baru telah diaktifkan kembali oleh pihak travel.",
                },
              },
            },
          });
        }
      } catch (tripErr) {
        console.warn("Init trip on reactivate warning:", tripErr);
      }
    }

    return NextResponse.json({ success: true, package: updated });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui paket wisata." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existingPackage = await prisma.package.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan." },
        { status: 404 }
      );
    }

    if (session.role === "TRAVEL" && existingPackage.travelId !== session.travelId) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin mengubah paket ini." },
        { status: 403 }
      );
    }

    let quotaLeftUpdate = body.quotaLeft !== undefined ? parseInt(body.quotaLeft) : undefined;
    // Reset quotaLeft ke penuh HANYA saat reactivate dari COMPLETED ke PUBLISHED
    if (body.status === "PUBLISHED" && existingPackage.status === "COMPLETED" && quotaLeftUpdate === undefined) {
      quotaLeftUpdate = existingPackage.capacity;
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.price !== undefined && { price: parseFloat(body.price) }),
        ...(quotaLeftUpdate !== undefined && { quotaLeft: quotaLeftUpdate }),
      },
    });

    // If reactivating to PUBLISHED from COMPLETED via toggle, ensure scheduled trip exists
    if (body.status === "PUBLISHED" && existingPackage.status === "COMPLETED") {
      try {
        const activeTrip = await prisma.trip.findFirst({
          where: { packageId: id, status: { in: ["SCHEDULED", "ONGOING"] } },
        });
        if (!activeTrip) {
          const newTrip = await prisma.trip.create({
            data: {
              packageId: id,
              scheduleDate: existingPackage.departureDate,
              destination: existingPackage.destination,
              vehicle: existingPackage.vehicle,
              operationalNotes: `Perjalanan rombongan: ${existingPackage.name}`,
              status: "SCHEDULED",
            },
          });
          await prisma.tripRoom.create({
            data: {
              tripId: newTrip.id,
              title: `Trip Room: ${existingPackage.name}`,
              updates: {
                create: {
                  userId: session.userId,
                  category: "ANNOUNCEMENT",
                  content: "Jadwal perjalanan baru telah diaktifkan kembali oleh pihak travel.",
                },
              },
            },
          });
        }
      } catch (tripErr) {
        console.warn("Init trip on toggle reactivate warning:", tripErr);
      }
    }

    return NextResponse.json({ success: true, package: updated });
  } catch (error) {
    console.error("Patch package error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status paket." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existingPackage = await prisma.package.findUnique({ where: { id } });

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan." },
        { status: 404 }
      );
    }

    if (session.role === "TRAVEL" && existingPackage.travelId !== session.travelId) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin menghapus paket ini." },
        { status: 403 }
      );
    }

    // Cek apakah ada pesanan aktif yang masih berlangsung
    const activeBookingsCount = await prisma.booking.count({
      where: {
        packageId: id,
        status: { in: ["CONFIRMED", "PAID", "DP_PAID", "WAITING_PAYMENT", "WAITING_DP_PAYMENT"] },
      },
    });
    if (activeBookingsCount > 0) {
      return NextResponse.json(
        { error: "Paket tidak bisa dihapus karena masih ada pesanan yang berlangsung." },
        { status: 409 }
      );
    }

    await prisma.package.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Paket berhasil dihapus." });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus paket wisata." },
      { status: 500 }
    );
  }
}
