import prisma from "./prisma";

export type NotificationType = "BOOKING" | "PAYMENT" | "ASSIGNMENT" | "TRIP_UPDATE";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Membuat notifikasi baru di database untuk user tertentu.
 * Fungsi ini aman untuk dipanggil tanpa mengganggu flow utama (error ditangkap secara diam-diam).
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
      },
    });
  } catch (err) {
    // Jangan throw error agar tidak mengganggu response API utama
    console.error("[Notification] Gagal membuat notifikasi:", err);
  }
}
