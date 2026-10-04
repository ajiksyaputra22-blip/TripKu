import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

/**
 * REQ-5.1 — Admin Travel approve/reject lamaran kru.
 * PATCH /api/apply/[id]
 * Body: { action: "APPROVE" | "REJECT" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Action tidak valid. Gunakan APPROVE atau REJECT." }, { status: 400 });
    }

    const application = await prisma.crewApplication.findUnique({
      where: { id },
      include: {
        package: { include: { travel: { select: { userId: true } } } },
        worker: { select: { id: true, name: true, role: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Lamaran tidak ditemukan." }, { status: 404 });
    }

    // Verifikasi travel agency ownership
    if (session.role === "TRAVEL" && application.package.travelId !== session.travelId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const updated = await prisma.crewApplication.update({
      where: { id },
      data: { status: action === "APPROVE" ? "APPROVED" : "REJECTED" },
    });

    let createdAssignment = null;
    if (action === "APPROVE") {
      // Find or create trip for this package
      let trip = await prisma.trip.findFirst({
        where: { packageId: application.packageId },
        orderBy: { scheduleDate: "asc" },
      });

      if (!trip) {
        trip = await prisma.trip.create({
          data: {
            packageId: application.packageId,
            scheduleDate: application.package.departureDate || new Date(Date.now() + 7 * 86400000),
            destination: application.package.destination,
            vehicle: application.package.vehicle,
            operationalNotes: `Perjalanan rombongan untuk paket: ${application.package.name}`,
            status: "SCHEDULED",
          },
        });
      }

      // Check if assignment already exists
      const existingAssignment = await prisma.assignment.findFirst({
        where: {
          tripId: trip.id,
          workerId: application.workerId,
        },
      });

      if (!existingAssignment) {
        const defaultFee = application.role === "GUIDE" ? 500000 : 350000;
        createdAssignment = await prisma.assignment.create({
          data: {
            tripId: trip.id,
            travelId: application.package.travelId,
            workerId: application.workerId,
            role: application.role,
            status: "PROPOSED",
            feeAmount: defaultFee,
            fee: {
              create: {
                amount: defaultFee,
                paymentStatus: "UNPAID",
              },
            },
            agreement: JSON.stringify([
              {
                id: `init-${Date.now()}`,
                senderId: session.userId,
                senderName: session.name || "Agensi Travel",
                senderRole: "TRAVEL",
                message: `Lamaran Anda untuk posisi ${application.role === "GUIDE" ? "Tour Guide" : "Driver"} telah disetujui. Tawaran fee awal: Rp ${defaultFee.toLocaleString("id-ID")}. Silakan diskusikan dan sepakati harga fix di sini.`,
                proposedFee: defaultFee,
                createdAt: new Date().toISOString(),
              },
            ]),
          },
        });
      }
    }

    // Notifikasi ke worker
    const isApproved = action === "APPROVE";
    await createNotification({
      userId: application.workerId,
      type: "ASSIGNMENT",
      title: isApproved ? "Lamaran Anda Disetujui! 🎉" : "Lamaran Ditolak",
      message: isApproved
        ? `Lamaran Anda untuk paket "${application.package.name}" telah disetujui oleh agensi travel. Penugasan baru telah dibuat, silakan cek chat negosiasi fee.`
        : `Maaf, lamaran Anda untuk paket "${application.package.name}" belum bisa diterima saat ini.`,
      link: application.worker.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: isApproved ? "Lamaran berhasil disetujui dan penugasan telah diterbitkan." : "Lamaran berhasil ditolak.",
      application: updated,
      assignment: createdAssignment,
    });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Gagal memproses lamaran." }, { status: 500 });
  }
}
