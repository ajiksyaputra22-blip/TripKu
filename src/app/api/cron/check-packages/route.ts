import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // REQ-3.1: Batas waktu pemesanan otomatis menonaktifkan paket (minimal H-3)
    // Jika tanggal keberangkatan <= now + 3 hari, ubah status jadi INACTIVE
    const cutoffDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    const result = await prisma.package.updateMany({
      where: {
        status: "PUBLISHED",
        departureDate: { lte: cutoffDate },
      },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memeriksa dan menonaktifkan paket lewat batas waktu (H-3).`,
      deactivatedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Cron check packages error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan scheduled check paket." },
      { status: 500 }
    );
  }
}
