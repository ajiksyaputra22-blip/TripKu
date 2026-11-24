import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function maskPhone(phone: string) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 7) return phone;
  const start = cleaned.slice(0, 4);
  const end = cleaned.slice(-4);
  return `${start}****${end}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawInput = (body.phone || body.identifier || "").toString().trim();

    if (!rawInput) {
      return NextResponse.json(
        { error: "Nomor WhatsApp / telepon wajib diisi." },
        { status: 400 }
      );
    }

    const digitsOnly = rawInput.replace(/\D/g, "");
    if (digitsOnly.length < 8) {
      return NextResponse.json(
        { error: "Nomor WhatsApp tidak valid." },
        { status: 400 }
      );
    }

    const phoneVariations: string[] = [digitsOnly];
    if (digitsOnly.startsWith("0")) {
      phoneVariations.push("62" + digitsOnly.slice(1));
      phoneVariations.push(digitsOnly.slice(1));
    } else if (digitsOnly.startsWith("62")) {
      phoneVariations.push("0" + digitsOnly.slice(2));
      phoneVariations.push(digitsOnly.slice(2));
    }

    // Cari user HANYA berdasarkan nomor telepon / WhatsApp
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: { in: phoneVariations } },
          { travelProfile: { whatsapp: { in: phoneVariations } } },
          { travelProfile: { phone: { in: phoneVariations } } },
        ],
      },
      include: {
        travelProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Nomor WhatsApp atau nomor telepon ini tidak terdaftar pada akun mana pun. Pastikan nomor yang Anda masukkan sudah benar.",
        },
        { status: 404 }
      );
    }

    if (user.status === "BANNED" || user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan oleh administrator. Silakan hubungi admin sistem." },
        { status: 403 }
      );
    }

    // Tentukan nomor WhatsApp tujuan
    const targetPhoneRaw =
      user.phone || user.travelProfile?.whatsapp || user.travelProfile?.phone || digitsOnly;

    // Format nomor WhatsApp internasional (628...)
    let cleanWa = targetPhoneRaw.replace(/\D/g, "");
    if (cleanWa.startsWith("0")) {
      cleanWa = "62" + cleanWa.slice(1);
    } else if (!cleanWa.startsWith("62")) {
      cleanWa = "62" + cleanWa;
    }

    const maskedPhone = maskPhone(targetPhoneRaw);

    // Buat kode OTP 6 digit angka
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Nonaktifkan OTP lama yang belum terpakai
    await (prisma as any).passwordResetOtp.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Simpan OTP baru ke database
    await (prisma as any).passwordResetOtp.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
        used: false,
      },
    });

    // Buat template pesan WhatsApp
    const waMessage = `Halo ${user.name},\n\nBerikut adalah Kode OTP untuk verifikasi reset kata sandi akun TripKu Anda:\n\n*${otpCode}*\n\nKode ini berlaku selama 15 menit. JANGAN bagikan kode ini kepada siapapun demi keamanan akun Anda.`;

    const whatsappUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waMessage)}`;

    // Buat notifikasi keamanan in-app
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT_SECURITY",
          title: "Kode OTP Reset Kata Sandi (WhatsApp)",
          message: `Kode OTP verifikasi (${otpCode}) telah dikirimkan ke nomor WhatsApp Anda (${maskedPhone}). Berlaku 15 menit.`,
        },
      });
    } catch {
      // ignore
    }

    console.log(`[PASSWORD RESET OTP WHATSAPP] User: ${user.name} | WA: ${cleanWa} | OTP: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi telah dikirimkan ke nomor WhatsApp ${maskedPhone}. Silakan periksa pesan WhatsApp Anda.`,
      targetPhone: maskedPhone,
      rawPhone: cleanWa,
      phone: digitsOnly,
      whatsappUrl,
      userName: user.name,
    });
  } catch (error) {
    console.error("Forgot password WA request error:", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan pengiriman OTP ke WhatsApp." },
      { status: 500 }
    );
  }
}
