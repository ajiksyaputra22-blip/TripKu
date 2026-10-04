import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

/**
 * REQ-5.3 — Worker (Guide/Driver) mengkonfirmasi penerimaan fee.
 * Status berubah: WAITING_CONFIRMATION → PAID
 * 
 * POST /api/fees/[id]/confirm
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "DRIVER" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            travel: { select: { userId: true, businessName: true } },
            trip: { include: { package: { select: { destination: true } } } },
          },
        },
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Data fee tidak ditemukan." }, { status: 404 });
    }

    // Hanya worker yang ditugaskan yang bisa konfirmasi
    if (session.role !== "ADMIN" && fee.assignment.workerId !== session.userId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    if (fee.paymentStatus !== "WAITING_CONFIRMATION") {
      return NextResponse.json(
        { error: "Fee belum dalam status menunggu konfirmasi." },
        { status: 400 }
      );
    }

    const updated = await prisma.fee.update({
      where: { id },
      data: {
        paymentStatus: "PAID",
      },
    });

    // Notifikasi ke admin travel bahwa fee dikonfirmasi
    await createNotification({
      userId: fee.assignment.travel.userId,
      type: "ASSIGNMENT",
      title: "Fee Kru Dikonfirmasi Diterima ✅",
      message: `Kru telah mengkonfirmasi penerimaan fee untuk perjalanan ke ${fee.assignment.trip.package.destination}. Status fee: LUNAS.`,
      link: "/travel/trips",
    });

    return NextResponse.json({
      success: true,
      message: "Fee berhasil dikonfirmasi. Status: LUNAS.",
      fee: updated,
    });
  } catch (error) {
    console.error("Confirm fee error:", error);
    return NextResponse.json({ error: "Gagal mengkonfirmasi penerimaan fee." }, { status: 500 });
  }
}
