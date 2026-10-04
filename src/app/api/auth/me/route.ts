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

  return NextResponse.json({ user });
}
