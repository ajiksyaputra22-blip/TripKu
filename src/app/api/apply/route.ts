import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

/**
 * REQ-5.1 — Tour Guide/Driver melamar ke paket sesuai domisili.
 * GET  /api/apply?packageId=xxx     → list lamaran untuk paket (TRAVEL)
 * POST /api/apply                   → worker ajukan lamaran ke paket
 */

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    if (session.role === "TRAVEL") {
      // Admin travel melihat daftar pelamar ke paket mereka
      if (!packageId) {
        return NextResponse.json({ error: "packageId diperlukan." }, { status: 400 });
      }

      const applications = await prisma.crewApplication.findMany({
        where: {
          packageId,
          package: { travelId: session.travelId! },
        },
        include: {
          worker: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              workerProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ applications });
    }

    if (session.role === "GUIDE" || session.role === "DRIVER") {
      // Worker melihat lamaran mereka sendiri
      const applications = await prisma.crewApplication.findMany({
        where: { workerId: session.userId },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              destination: true,
              departureDate: true,
              travel: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ applications });
    }

    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Gagal memuat data lamaran." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "DRIVER")) {
      return NextResponse.json({ error: "Hanya Tour Guide dan Driver yang dapat melamar." }, { status: 403 });
    }

    const body = await request.json();
    const { packageId, message } = body;

    if (!packageId) {
      return NextResponse.json({ error: "packageId wajib diisi." }, { status: 400 });
    }

    // Cek profil worker lengkap
    const worker = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { workerProfile: true },
    });

    if (!worker?.workerProfile?.profileCompleted) {
      return NextResponse.json(
        { error: "Profil Anda belum lengkap. Lengkapi profil terlebih dahulu sebelum melamar." },
        { status: 400 }
      );
    }

    // Cek domisili worker sesuai dengan paket
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { travel: { select: { userId: true, businessName: true } } },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    }

    if (pkg.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Paket tidak aktif." }, { status: 400 });
    }

    // REQ-5.1: Validasi kecocokan domisili
    const rawDomicile = worker.workerProfile.domicile || worker.workerProfile.address || "";
    if (!rawDomicile.trim()) {
      return NextResponse.json(
        { error: "Domisili tempat tinggal Anda belum diisi. Silakan lengkapi domisili pada profil Anda sebelum melamar." },
        { status: 400 }
      );
    }

    const workerDomicile = rawDomicile.toLowerCase().trim();
    const packageDestination = (pkg.destination || "").toLowerCase().trim();
    const packageOrigin = (pkg.originCity || "").toLowerCase().trim();
    const packageProvince = (pkg.province || "").toLowerCase().trim();

    const domicileMatch = 
      packageDestination.includes(workerDomicile) || 
      packageOrigin.includes(workerDomicile) ||
      packageProvince.includes(workerDomicile) ||
      workerDomicile.includes(packageDestination) ||
      workerDomicile.includes(packageOrigin) ||
      workerDomicile.includes(packageProvince);

    if (!domicileMatch) {
      return NextResponse.json(
        {
          error: `Domisili Anda (${rawDomicile}) tidak sesuai dengan lokasi paket ini (${pkg.destination}). Hanya kru dengan domisili yang sesuai yang dapat melamar.`,
        },
        { status: 400 }
      );
    }

    // Cek sudah pernah melamar
    const existingApp = await prisma.crewApplication.findFirst({
      where: { packageId, workerId: session.userId },
    });

    if (existingApp) {
      return NextResponse.json(
        { error: "Anda sudah mengajukan lamaran untuk paket ini." },
        { status: 400 }
      );
    }

    const application = await prisma.crewApplication.create({
      data: {
        packageId,
        workerId: session.userId,
        role: session.role,
        status: "PENDING",
        message: message || `Saya tertarik untuk menjadi ${session.role === "GUIDE" ? "Tour Guide" : "Driver"} untuk paket ${pkg.name}.`,
      },
    });

    // Notifikasi ke admin travel
    await createNotification({
      userId: pkg.travel.userId,
      type: "ASSIGNMENT",
      title: `Lamaran Kru Baru 📋`,
      message: `${worker.name} (${session.role}) mengajukan lamaran untuk paket "${pkg.name}" (${pkg.destination}).`,
      link: `/travel/dashboard?packageId=${packageId}&tab=crew`,
    });

    return NextResponse.json({
      success: true,
      message: "Lamaran berhasil diajukan. Menunggu persetujuan dari agensi travel.",
      application,
    });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Gagal mengajukan lamaran." }, { status: 500 });
  }
}
