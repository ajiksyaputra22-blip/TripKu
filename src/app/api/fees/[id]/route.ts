import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

/**
 * REQ-5.3: Alur Negosiasi Harga Fee Kru
 * POST /api/fees/[id]/negotiate  → worker mengajukan counter-offer
 * POST /api/fees/[id]/pay         → travel upload bukti bayar, status = WAITING_CONFIRMATION
 * POST /api/fees/[id]/confirm     → worker konfirmasi pembayaran, status = PAID
 */

// GET — lihat detail fee
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });

    const { id } = await params;
    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            worker: { select: { id: true, name: true, role: true } },
            travel: { select: { businessName: true } },
            trip: { include: { package: { select: { name: true, destination: true } } } },
          },
        },
      },
    });

    if (!fee) return NextResponse.json({ error: "Fee tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ fee });
  } catch (error) {
    console.error("Get fee error:", error);
    return NextResponse.json({ error: "Gagal memuat data fee." }, { status: 500 });
  }
}
