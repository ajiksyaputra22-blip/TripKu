import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "TRAVEL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let travel = await prisma.travel.findUnique({
      where: { userId: session.userId },
      include: {
        user: { select: { avatarUrl: true } },
      },
    });

    if (!travel) {
      // Auto-create if not exists
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      travel = await prisma.travel.create({
        data: {
          userId: session.userId,
          businessName: user?.name || "Travel Agency Baru",
          verificationStatus: "PENDING",
        },
        include: {
          user: { select: { avatarUrl: true } },
        },
      });
    }

    // Sinkronisasi logoUrl dari user.avatarUrl jika travel.logoUrl masih kosong
    if (!travel.logoUrl && travel.user?.avatarUrl) {
      travel = await prisma.travel.update({
        where: { id: travel.id },
        data: { logoUrl: travel.user.avatarUrl },
        include: {
          user: { select: { avatarUrl: true } },
        },
      });
    }

    // Sinkronisasi user.avatarUrl dari travel.logoUrl jika user.avatarUrl masih kosong
    if (travel.logoUrl && !travel.user?.avatarUrl) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { avatarUrl: travel.logoUrl },
      });
      travel.user = { avatarUrl: travel.logoUrl };
    }

    // Auto-clean description dan pastikan siupUrl terisi jika ada tag lama
    if (travel.description && travel.description.includes("[IZIN_USAHA_URL]:")) {
      const extractedSiup = travel.description.split("[IZIN_USAHA_URL]:")[1]?.trim();
      const cleanedDesc = travel.description.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, "").trim();
      
      const newSiup = travel.siupUrl || extractedSiup || null;
      travel = await prisma.travel.update({
        where: { id: travel.id },
        data: {
          description: cleanedDesc || null,
          ...(newSiup && !travel.siupUrl ? { siupUrl: newSiup } : {}),
        },
        include: {
          user: { select: { avatarUrl: true } },
        },
      });
    }

    return NextResponse.json({ travel });
  } catch (error) {
    console.error("Fetch travel profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "TRAVEL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName, address, phone, whatsapp, description,
      bankName, bankAccount, bankHolder,
      npwpUrl, aktaUrl, logoUrl, siupUrl
    } = body;

    const cleanedDescription = typeof description === "string"
      ? description.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, "").trim()
      : description;

    const updatedTravel = await prisma.travel.update({
      where: { userId: session.userId },
      data: {
        businessName,
        address,
        phone,
        whatsapp,
        description: cleanedDescription,
        bankName,
        bankAccount,
        bankHolder,
        npwpUrl,
        aktaUrl,
        logoUrl,
        ...(siupUrl !== undefined && { siupUrl }),
      },
    });

    // Also update the User name and avatarUrl (agar foto profil muncul di navbar dan seluruh sistem)
    const userUpdateData: any = {};
    if (businessName) userUpdateData.name = businessName;
    if (logoUrl !== undefined) userUpdateData.avatarUrl = logoUrl;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: userUpdateData,
      });
    }

    return NextResponse.json({ message: "Profile updated successfully", travel: updatedTravel });
  } catch (error) {
    console.error("Update travel profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
