import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // REQ-3.1: Batas waktu pemesanan otomatis menonaktifkan paket (bookingDeadline atau minimal H-1)
    const now = new Date();
    const cutoffDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

    // 1. Matikan paket dengan explicit bookingDeadline yang sudah terlewati
    const resDeadline = await prisma.package.updateMany({
      where: {
        status: "PUBLISHED",
        bookingDeadline: { lte: now },
      },
      data: {
        status: "INACTIVE",
      },
    });

    // 2. Matikan paket tanpa bookingDeadline yang sudah melewati batas H-1 keberangkatan
    const resFallback = await prisma.package.updateMany({
      where: {
        status: "PUBLISHED",
        bookingDeadline: null,
        departureDate: { lte: cutoffDate },
      },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil memeriksa dan menonaktifkan paket lewat batas waktu.`,
      deactivatedCount: resDeadline.count + resFallback.count,
    });
  } catch (error) {
    console.error("Cron check packages error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan scheduled check paket." },
      { status: 500 }
    );
  }
}
