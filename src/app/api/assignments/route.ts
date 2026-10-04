import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workerType = searchParams.get("workerType"); // GUIDE | DRIVER | ALL

    // If travel wants to list available workers to assign
    if (searchParams.get("action") === "list_available_workers") {
      const domicile = searchParams.get("domicile");
      const search = searchParams.get("search");

      const workerWhere: any = {
        role: workerType && workerType !== "ALL" ? workerType : { in: ["GUIDE", "DRIVER"] },
        status: "ACTIVE",
        workerProfile: {
          isAvailable: true,
          profileCompleted: true, // REQ-2.8: Profil tidak lengkap = tidak tampil di kandidat
        },
      };

      if (domicile && domicile.trim()) {
        workerWhere.workerProfile.domicile = { contains: domicile.trim(), mode: "insensitive" };
      }

      if (search && search.trim()) {
        workerWhere.OR = [
          { name: { contains: search.trim(), mode: "insensitive" } },
          { phone: { contains: search.trim(), mode: "insensitive" } },
          { workerProfile: { domicile: { contains: search.trim(), mode: "insensitive" } } },
        ];
      }

      const workers = await prisma.user.findMany({
        where: workerWhere,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatarUrl: true,
          workerProfile: true,
        },
      });
      return NextResponse.json({ workers });
    }

    const whereClause: any = {};

    if (session.role === "TRAVEL") {
      whereClause.travelId = session.travelId;
    } else if (session.role === "GUIDE" || session.role === "DRIVER") {
      whereClause.workerId = session.userId;
    } else if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        trip: {
          include: {
            package: {
              select: { name: true, destination: true, originCity: true, coverImage: true, durationDays: true, checkpointRoute: true, vehicle: true },
            },
            booking: {
              include: {
                customer: { select: { id: true, name: true, email: true, phone: true, nik: true, avatarUrl: true } },
                participants: true,
              },
            },
            checkpoints: {
              include: { user: { select: { name: true, role: true } } },
              orderBy: { reportedAt: "desc" as const },
            },
            attendances: true,
          },
        },
        travel: {
          select: { businessName: true, phone: true },
        },
        worker: {
          select: { id: true, name: true, phone: true, role: true, avatarUrl: true, workerProfile: true },
        },
        fee: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Fetch assignments error:", error);
    return NextResponse.json({ error: "Gagal memuat penugasan." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { tripId } = body;

    if (!tripId) {
      return NextResponse.json({ error: "Trip ID wajib diisi." }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { package: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Perjalanan tidak ditemukan." }, { status: 404 });
    }

    // Determine travelId
    const travelId = session.travelId || trip.package.travelId;

    // Collect list of assignments to create
    let itemsToAssign: Array<{ workerId: string; role: string; feeAmount: number; dpFeeAmount?: number; agreement?: string }> = [];

    if (Array.isArray(body.assignments)) {
      itemsToAssign = body.assignments;
    } else if (body.guide || body.driver) {
      if (body.guide?.workerId) {
        itemsToAssign.push({
          workerId: body.guide.workerId,
          role: "GUIDE",
          feeAmount: parseFloat(body.guide.feeAmount || "500000"),
          dpFeeAmount: parseFloat(body.guide.dpFeeAmount || "0"),
          agreement: body.guide.agreement,
        });
      }
      if (body.driver?.workerId) {
        itemsToAssign.push({
          workerId: body.driver.workerId,
          role: "DRIVER",
          feeAmount: parseFloat(body.driver.feeAmount || "350000"),
          dpFeeAmount: parseFloat(body.driver.dpFeeAmount || "0"),
          agreement: body.driver.agreement,
        });
      }
    } else if (body.workerId && body.role && body.feeAmount) {
      itemsToAssign.push({
        workerId: body.workerId,
        role: body.role,
        feeAmount: parseFloat(body.feeAmount),
        dpFeeAmount: parseFloat(body.dpFeeAmount || "0"),
        agreement: body.agreement,
      });
    }

    if (itemsToAssign.length === 0) {
      return NextResponse.json({ error: "Data penugasan kru tidak valid atau kosong." }, { status: 400 });
    }

    const createdAssignments = [];
    for (const item of itemsToAssign) {
      // REQ-2.8: Profil Tidak Lengkap = Tidak Bisa Ditugaskan
      const targetWorker = await prisma.user.findUnique({
        where: { id: item.workerId },
        include: { workerProfile: true },
      });
      if (!targetWorker?.workerProfile?.profileCompleted) {
        return NextResponse.json({
          error: `Kru ${targetWorker?.name || item.workerId} belum melengkapi profil & dokumen wajib sehingga tidak bisa menerima penugasan.`,
        }, { status: 400 });
      }

      // Bersihkan penugasan sebelumnya yang ditolak untuk trip & role ini
      await prisma.assignment.deleteMany({
        where: {
          tripId,
          role: item.role,
          status: "REJECTED",
        },
      });

      const assignment = await prisma.assignment.create({
        data: {
          tripId,
          travelId,
          workerId: item.workerId,
          role: item.role,
          feeAmount: item.feeAmount,
          dpFeeAmount: item.dpFeeAmount || 0,
          agreement: item.agreement || `Penugasan sebagai ${item.role} untuk trip destinasi ${trip.destination}.`,
          status: "PROPOSED",
          fee: {
            create: {
              amount: item.feeAmount,
              paymentStatus: "UNPAID",
            },
          },
        },
        include: {
          trip: true,
          fee: true,
          worker: {
            select: { id: true, name: true, role: true },
          },
        },
      });
      createdAssignments.push(assignment);

      // Kirim notifikasi ke worker yang ditugaskan
      await createNotification({
        userId: item.workerId,
        type: "ASSIGNMENT",
        title: "Penugasan Perjalanan Baru 🗺️",
        message: `Anda telah ditugaskan sebagai ${item.role === "GUIDE" ? "Tour Guide" : "Driver"} untuk perjalanan ke ${trip.destination}. Segera periksa detail penugasan Anda.`,
        link: item.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menugaskan ${createdAssignments.length} kru perjalanan.`,
      assignments: createdAssignments,
      assignment: createdAssignments[0] 
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: "Gagal membuat penugasan." }, { status: 500 });
  }
}
