import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "DRIVER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Hanya Tour Guide dan Driver yang dapat mengakses portal lowongan kerja." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const domicileOnly = searchParams.get("domicileOnly") === "true";
    const destination = searchParams.get("destination");

    // Get worker profile
    const workerUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { workerProfile: true },
    });

    const workerProfile = workerUser?.workerProfile;
    const workerDomicile = (workerProfile?.domicile || workerProfile?.address || "").toLowerCase().trim();

    // Query active published packages with future departure dates
    const now = new Date();
    const whereClause: any = {
      status: "PUBLISHED",
      departureDate: { gte: now },
    };

    if (destination && destination !== "ALL") {
      whereClause.destination = { contains: destination };
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { destination: { contains: search } },
        { originCity: { contains: search } },
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
            phone: true,
            address: true,
            verificationStatus: true,
          },
        },
        trips: {
          select: {
            id: true,
            status: true,
            assignments: {
              select: {
                id: true,
                role: true,
                status: true,
                workerId: true,
              },
            },
          },
        },
        crewApplications: {
          where: { workerId: session.userId },
          select: {
            id: true,
            status: true,
            message: true,
            createdAt: true,
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { departureDate: "asc" },
    });

    const enrichedJobs = packages.map((pkg) => {
      const myApplication = pkg.crewApplications?.[0] || null;

      // Check whether Guide / Driver is already assigned in this package's trips
      const allAssignments = pkg.trips?.flatMap((t) => t.assignments) || [];
      const hasAssignedRole = allAssignments.some(
        (a) => a.role === session.role && (a.status === "ACCEPTED" || a.status === "PROPOSED" || a.status === "NEGOTIATING")
      );
      const isAssignedToMe = allAssignments.some((a) => a.workerId === session.userId);

      // Domicile match evaluation
      const pkgDest = (pkg.destination || "").toLowerCase();
      const pkgOrig = (pkg.originCity || "").toLowerCase();
      const pkgProv = (pkg.province || "").toLowerCase();

      let isDomicileMatch = false;
      if (workerDomicile) {
        isDomicileMatch =
          pkgDest.includes(workerDomicile) ||
          pkgOrig.includes(workerDomicile) ||
          pkgProv.includes(workerDomicile) ||
          workerDomicile.includes(pkgDest) ||
          workerDomicile.includes(pkgOrig) ||
          workerDomicile.includes(pkgProv);
      }

      return {
        id: pkg.id,
        name: pkg.name,
        slug: pkg.slug,
        destination: pkg.destination,
        originCity: pkg.originCity,
        province: pkg.province,
        departureDate: pkg.departureDate,
        durationDays: pkg.durationDays,
        vehicle: pkg.vehicle,
        capacity: pkg.capacity,
        quotaLeft: pkg.quotaLeft,
        coverImage: pkg.coverImage,
        category: pkg.category,
        description: pkg.description,
        travel: pkg.travel,
        bookingCount: pkg._count.bookings,
        isDomicileMatch,
        hasAssignedRole,
        isAssignedToMe,
        myApplication: myApplication
          ? {
              id: myApplication.id,
              status: myApplication.status,
              message: myApplication.message,
              appliedAt: myApplication.createdAt,
            }
          : null,
      };
    });

    const filteredJobs = domicileOnly
      ? enrichedJobs.filter((j) => j.isDomicileMatch)
      : enrichedJobs;

    return NextResponse.json({
      success: true,
      worker: {
        id: session.userId,
        name: session.name,
        role: session.role,
        domicile: workerProfile?.domicile || workerProfile?.address || null,
        profileCompleted: workerProfile?.profileCompleted ?? false,
      },
      jobs: filteredJobs,
      totalJobs: filteredJobs.length,
    });
  } catch (error) {
    console.error("Fetch jobs error:", error);
    return NextResponse.json({ error: "Gagal memuat lowongan tugas wisata." }, { status: 500 });
  }
}
