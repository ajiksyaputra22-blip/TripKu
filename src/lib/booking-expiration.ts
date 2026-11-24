import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export const PAYMENT_DEADLINE_MINUTES = 45;

/**
 * Hitung batas akhir pembayaran (45 menit sejak waktu mulai)
 */
export function calculatePaymentDeadline(startedAt: Date = new Date()): Date {
  return new Date(startedAt.getTime() + PAYMENT_DEADLINE_MINUTES * 60 * 1000);
}

/**
 * Periksa apakah suatu booking telah melewati batas waktu pembayaran
 * HANYA berlaku untuk pesanan yang masih berstatus menunggu pembayaran awal (belum upload/bayar)
 */
export function isBookingExpired(booking: {
  status: string;
  paymentDeadline?: Date | string | null;
}): boolean {
  const waitingStatuses = ["WAITING_PAYMENT", "WAITING_DP_PAYMENT", "PENDING", "UNPAID"];
  if (!waitingStatuses.includes(booking.status)) {
    return false;
  }

  if (!booking.paymentDeadline) {
    return false;
  }

  const deadline = new Date(booking.paymentDeadline).getTime();
  return Date.now() > deadline;
}

/**
 * Batalkan semua pesanan yang telah melewati batas waktu 45 menit secara otomatis di database.
 * Dapat dipanggil secara berkala atau setiap ada request ke daftar/detail booking.
 */
export async function cancelExpiredBookings(): Promise<number> {
  try {
    const now = new Date();

    // Cari pesanan yang expired dan belum bayar
    const expiredBookings = await (prisma.booking as any).findMany({
      where: {
        status: { in: ["WAITING_PAYMENT", "WAITING_DP_PAYMENT", "PENDING", "UNPAID"] },
        paymentDeadline: { lt: now },
      },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
      },
    });

    if (expiredBookings.length === 0) {
      return 0;
    }

    const ids = expiredBookings.map((b: any) => b.id);

    // Update status menjadi CANCELLED
    await (prisma.booking as any).updateMany({
      where: { id: { in: ids } },
      data: { status: "CANCELLED" },
    });

    // Kirim notifikasi ke masing-masing customer
    for (const b of expiredBookings) {
      try {
        await createNotification({
          userId: b.customerId,
          type: "BOOKING",
          title: "Batas Waktu Pembayaran Berakhir",
          message: `Batas waktu pembayaran 45 menit untuk pesanan ${b.bookingCode} telah berakhir. Pesanan dibatalkan otomatis oleh sistem. Silakan lakukan pemesanan ulang jika masih berminat.`,
          link: "/customer/bookings",
        });
      } catch (err) {
        console.error(`Gagal mengirim notifikasi pembatalan booking ${b.bookingCode}:`, err);
      }
    }

    return expiredBookings.length;
  } catch (error) {
    console.error("Error cancelExpiredBookings:", error);
    return 0;
  }
}

/**
 * Periksa dan batalkan satu booking tertentu jika telah melewati batas waktu
 */
export async function checkAndCancelSingleBooking(bookingId: string): Promise<{
  isExpired: boolean;
  status: string;
}> {
  try {
    const booking = await (prisma.booking as any).findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingCode: true,
        customerId: true,
        status: true,
        paymentDeadline: true,
      },
    });

    if (!booking) {
      return { isExpired: false, status: "" };
    }

    if (isBookingExpired(booking)) {
      await (prisma.booking as any).update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      try {
        await createNotification({
          userId: booking.customerId,
          type: "BOOKING",
          title: "Batas Waktu Pembayaran Berakhir",
          message: `Batas waktu pembayaran 45 menit untuk pesanan ${booking.bookingCode} telah berakhir. Pesanan dibatalkan otomatis oleh sistem.`,
          link: "/customer/bookings",
        });
      } catch {
        // ignore
      }

      return { isExpired: true, status: "CANCELLED" };
    }

    return { isExpired: false, status: booking.status };
  } catch (error) {
    console.error("Error checkAndCancelSingleBooking:", error);
    return { isExpired: false, status: "" };
  }
}
