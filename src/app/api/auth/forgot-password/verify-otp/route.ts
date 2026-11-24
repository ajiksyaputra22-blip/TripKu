import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawPhone = (body.phone || body.identifier || "").toString().trim();
    const otp = (body.otp || "").toString().trim();

    if (!rawPhone || !otp) {
      return NextResponse.json(
        { error: "Nomor WhatsApp dan kode OTP 6 digit wajib diisi." },
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

    // Cari user berdasarkan nomor telepon
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: { in: phoneVariations } },
          { travelProfile: { whatsapp: { in: phoneVariations } } },
          { travelProfile: { phone: { in: phoneVariations } } },
        ],
      },
      select: { id: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan nomor WhatsApp ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cari OTP yang valid di database
    const cleanOtp = otp.replace(/\D/g, "");
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
        {
          error:
            "Kode OTP yang Anda masukkan salah atau sudah kedaluwarsa. Silakan periksa kembali pesan WhatsApp Anda atau minta kode baru.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kode OTP valid! Silakan lanjutkan ke pembuatan kata sandi baru.",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi kode OTP." },
      { status: 500 }
    );
  }
}
