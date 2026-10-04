import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { nik: email.trim() },
        ],
      },
      include: {
        travelProfile: true,
        workerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan oleh Administrator." },
        { status: 403 }
      );
    }

    // Blokir mitra yang belum diverifikasi dari login
    if (user.status === "PENDING" && user.role !== "CUSTOMER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Akun Anda masih dalam proses verifikasi oleh Admin. Mohon tunggu konfirmasi melalui email Anda." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        travelId: user.travelProfile?.id,
        profileCompleted: user.workerProfile?.profileCompleted ?? false,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
