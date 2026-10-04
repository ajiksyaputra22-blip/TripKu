import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingCode: id }],
      },
      include: {
        package: {
          include: {
            travel: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                address: true,
                bankName: true,
                bankAccount: true,
                bankHolder: true,
              },
            },
          },
        },
        participants: true,
        payments: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        trips: {
          include: {
            tripRoom: {
              include: {
                updates: {
                  include: {
                    user: { select: { name: true, role: true } },
                  },
                  orderBy: { createdAt: "desc" },
                },
              },
            },
            assignments: {
              include: {
                worker: { select: { name: true, role: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    // Permission check
    const isCustomerOwner = booking.customerId === session.userId;
    const isTravelOwner = booking.package.travelId === session.travelId;
    const isAdmin = session.role === "ADMIN";

    if (!isCustomerOwner && !isTravelOwner && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Get booking error:", error);
    return NextResponse.json({ error: "Gagal memuat detail booking." }, { status: 500 });
  }
}
