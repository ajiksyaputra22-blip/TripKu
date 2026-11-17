import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      nik: true,
      status: true,
      avatarUrl: true,
      travelProfile: true,
      workerProfile: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Pastikan avatarUrl selalu terisi jika user travel memiliki logoUrl di travelProfile
  const resolvedAvatarUrl = user.avatarUrl || user.travelProfile?.logoUrl || null;

  if (!user.avatarUrl && user.travelProfile?.logoUrl) {
    prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: user.travelProfile.logoUrl },
    }).catch((err) => console.error("Sync avatarUrl to user error:", err));
  }

  return NextResponse.json({
    user: {
      ...user,
      avatarUrl: resolvedAvatarUrl,
    },
  });
}
