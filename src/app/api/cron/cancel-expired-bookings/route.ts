import { NextResponse } from "next/server";
import { cancelExpiredBookings } from "@/lib/booking-expiration";

export async function GET() {
  try {
    const cancelledCount = await cancelExpiredBookings();
    return NextResponse.json({
      success: true,
      message: `Berhasil memproses pembatalan otomatis untuk ${cancelledCount} pesanan kedaluwarsa.`,
      cancelledCount,
    });
  } catch (error) {
    console.error("Cron cancel-expired-bookings error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pembatalan pesanan kedaluwarsa." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
