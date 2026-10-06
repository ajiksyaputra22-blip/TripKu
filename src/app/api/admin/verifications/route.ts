import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat mengakses data verifikasi." }, { status: 403 });
    }

    // Auto-heal any worker users missing a WorkerProfile record (e.g., from prior partial registrations)
    const orphanWorkers = await prisma.user.findMany({
      where: {
        role: { in: ["DRIVER", "GUIDE"] },
        workerProfile: null,
      },
    });

    for (const orphan of orphanWorkers) {
      try {
        await prisma.workerProfile.create({
          data: {
            userId: orphan.id,
            workerType: orphan.role,
            licenseNumber: "MENUNGGU_VERIFIKASI",
            isAvailable: orphan.status === "ACTIVE",
          },
        });
      } catch (e) {
        console.warn("Auto-heal orphan worker failed for:", orphan.id, e);
      }
    }

    const pendingTravels = await prisma.travel.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pendingWorkers = await prisma.workerProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ travels: pendingTravels, workers: pendingWorkers });
  } catch (error) {
    console.error("Fetch verifications error:", error);
    return NextResponse.json({ error: "Gagal memuat data verifikasi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login ulang.", code: "NO_SESSION" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak. Hanya Admin.", code: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, action } = body; // type: "TRAVEL" | "WORKER", action: "APPROVED" | "REJECTED"

    if (!type || !id || !action) {
      return NextResponse.json({ error: "Parameter tidak lengkap.", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (type === "TRAVEL") {
      const travel = await prisma.travel.findUnique({ where: { id } });
      if (!travel) {
        return NextResponse.json({ error: `Travel dengan ID ${id} tidak ditemukan.`, code: "NOT_FOUND" }, { status: 404 });
      }

      const updated = await prisma.travel.update({
        where: { id },
        data: { verificationStatus: action },
      });

      // Update user status
      await prisma.user.update({
        where: { id: updated.userId },
        data: { status: action === "APPROVED" ? "ACTIVE" : "SUSPENDED" },
      });

      return NextResponse.json({ success: true, travel: updated });
    } else {
      // For worker
      const worker = await prisma.workerProfile.findUnique({ where: { id } });
      if (!worker) {
        return NextResponse.json({ error: `Worker dengan ID ${id} tidak ditemukan.`, code: "NOT_FOUND" }, { status: 404 });
      }

      const updated = await prisma.workerProfile.update({
        where: { id },
        data: { isAvailable: action === "APPROVED" },
      });

      // Update user status
      await prisma.user.update({
        where: { id: updated.userId },
        data: { status: action === "APPROVED" ? "ACTIVE" : "SUSPENDED" },
      });

      return NextResponse.json({ success: true, worker: updated });
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Process verification error:", errMessage);
    return NextResponse.json(
      { error: "Gagal memproses verifikasi.", detail: errMessage, code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
