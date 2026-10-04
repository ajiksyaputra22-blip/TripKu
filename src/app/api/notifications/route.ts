import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/notifications — Ambil daftar notifikasi user yang login
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const onlyUnread = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.userId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// PATCH /api/notifications — Tandai semua sebagai sudah dibaca
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body as { id?: string };

    if (id) {
      // Mark satu notifikasi sebagai dibaca
      await prisma.notification.updateMany({
        where: { id, userId: session.userId },
        data: { isRead: true },
      });
    } else {
      // Mark semua notifikasi sebagai dibaca
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notifications error:", error);
    return NextResponse.json({ error: "Gagal memperbarui notifikasi." }, { status: 500 });
  }
}
