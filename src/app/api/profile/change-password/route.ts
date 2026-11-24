import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession, comparePassword, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const user = await (prisma.user as any).findUnique({
      where: { id: session.userId },
      select: {
        passwordChangedAt: true,
      },
    });

    const now = new Date();
    let canChange = true;
    let nextAllowedDate: Date | null = null;
    let daysRemaining = 0;

    if (user?.passwordChangedAt) {
      const lastChanged = new Date(user.passwordChangedAt);
      // Batas 2 bulan (60 hari)
      const allowedTime = new Date(lastChanged.getTime() + 60 * 24 * 60 * 60 * 1000);
      if (now.getTime() < allowedTime.getTime()) {
        canChange = false;
        nextAllowedDate = allowedTime;
        daysRemaining = Math.ceil((allowedTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    return NextResponse.json({
      canChange,
      lastChangedAt: user?.passwordChangedAt || null,
      nextAllowedDate,
      daysRemaining,
    });
  } catch (error) {
    console.error("Check password change status error:", error);
    return NextResponse.json({ error: "Gagal memeriksa status perubahan sandi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Kata sandi saat ini dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Konfirmasi kata sandi baru tidak sesuai." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini." },
        { status: 400 }
      );
    }

    const user = await (prisma.user as any).findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        passwordHash: true,
        passwordChangedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    // 1. Cek pembatasan 2 bulan sekali (60 hari)
    if (user.passwordChangedAt) {
      const lastChanged = new Date(user.passwordChangedAt);
      const allowedTime = new Date(lastChanged.getTime() + 60 * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now.getTime() < allowedTime.getTime()) {
        const daysRemaining = Math.ceil((allowedTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const formattedDate = allowedTime.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        return NextResponse.json(
          {
            error: `Pengubahan kata sandi dibatasi maksimal 2 bulan sekali demi keamanan akun. Anda baru dapat mengubah kata sandi lagi pada ${formattedDate} (${daysRemaining} hari lagi).`,
            daysRemaining,
            nextAllowedDate: allowedTime,
          },
          { status: 400 }
        );
      }
    }

    // 2. Verifikasi kata sandi saat ini
    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Kata sandi saat ini yang Anda masukkan salah." },
        { status: 400 }
      );
    }

    // 3. Hash kata sandi baru
    const newHash = await hashPassword(newPassword);

    // 4. Simpan kata sandi baru dan update timestamp passwordChangedAt
    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    });

    // 5. Beri notifikasi keamanan akun
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_SECURITY",
          title: "Kata Sandi Berhasil Diubah",
          message: "Kata sandi akun Anda berhasil diperbarui. Perubahan berikutnya dapat dilakukan setelah 2 bulan.",
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Kata sandi akun Anda berhasil diubah! Pengubahan berikutnya dapat dilakukan setelah 2 bulan.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Gagal mengubah kata sandi." }, { status: 500 });
  }
}
