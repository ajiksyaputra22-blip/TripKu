import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, nik, avatarUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name,
        phone: phone || null,
        nik: nik || null,
        avatarUrl: avatarUrl || null,
      },
    });

    await createNotification({
      userId: session.userId,
      type: "ACCOUNT_SECURITY",
      title: "Profil Berhasil Diperbarui",
      message: "Data profil akun pelanggan Anda telah berhasil disimpan dan diperbarui.",
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui",
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        nik: updatedUser.nik,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Update customer profile error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memperbarui profil." },
      { status: 500 }
    );
  }
}
