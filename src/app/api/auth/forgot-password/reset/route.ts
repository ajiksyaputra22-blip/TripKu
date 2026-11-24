import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = (body.phone || body.identifier || "").toString().trim();
    const { otp, newPassword, confirmPassword } = body;

    if (!rawPhone || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Nomor WhatsApp, kode OTP, dan kata sandi baru wajib diisi." },
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
        { error: "Konfirmasi kata sandi baru tidak cocok." },
        { status: 400 }
      );
    }

    const digitsOnly = rawPhone.replace(/\D/g, "");
    const phoneVariations: string[] = [digitsOnly];
    if (digitsOnly.startsWith("0")) {
      phoneVariations.push("62" + digitsOnly.slice(1));
      phoneVariations.push(digitsOnly.slice(1));
    } else if (digitsOnly.startsWith("62")) {
      phoneVariations.push("0" + digitsOnly.slice(2));
      phoneVariations.push(digitsOnly.slice(2));
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: { in: phoneVariations } },
          { travelProfile: { whatsapp: { in: phoneVariations } } },
          { travelProfile: { phone: { in: phoneVariations } } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        travelProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cari OTP yang valid
    const cleanOtp = otp.toString().trim().replace(/\D/g, "");
    const otpRecord = await (prisma as any).passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        code: cleanOtp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    // Hash password baru
    const newHash = await hashPassword(newPassword);

    // Tandai OTP sudah digunakan
    await (prisma as any).passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Update password user dan catat waktu perubahan
    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordChangedAt: new Date(),
      },
    });

    // Buat notifikasi keamanan akun
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_SECURITY",
          title: "Kata Sandi Berhasil Direset",
          message: "Kata sandi akun Anda telah berhasil diperbarui menggunakan verifikasi OTP WhatsApp.",
        },
      });
    } catch {
      // ignore
    }

    // Tentukan URL dashboard tujuan sesuai role akun
    let dashboardUrl = "/";
    if (user.role === "ADMIN") {
      dashboardUrl = "/admin/dashboard";
    } else if (user.role === "TRAVEL") {
      dashboardUrl = "/travel/dashboard";
    } else if (user.role === "GUIDE") {
      dashboardUrl = "/guide/dashboard";
    } else if (user.role === "DRIVER") {
      dashboardUrl = "/driver/dashboard";
    }

    // Otomatis buat sesi login langsung agar tidak perlu login manual lagi
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "TRAVEL" | "CUSTOMER" | "GUIDE" | "DRIVER",
      travelId: user.travelProfile?.id,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      message: "Kata sandi Anda berhasil diperbarui! Mengalihkan ke dashboard...",
      redirectUrl: dashboardUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        travelId: user.travelProfile?.id,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Reset password WA error:", error);
    return NextResponse.json({ error: "Gagal mereset kata sandi." }, { status: 500 });
  }
}
