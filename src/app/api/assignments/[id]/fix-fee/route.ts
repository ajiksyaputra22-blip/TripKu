import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { parseChatMessages, ChatMessage } from "@/lib/chat-utils";

// POST /api/assignments/[id]/fix-fee — Mengunci dan menetapkan nominal fee yang sudah fix disepakati
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fixedFee, note } = body;

    if (!fixedFee || isNaN(Number(fixedFee)) || Number(fixedFee) <= 0) {
      return NextResponse.json({ error: "Nominal harga/fee fix harus valid dan lebih dari 0." }, { status: 400 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        fee: true,
        travel: { select: { id: true, userId: true, businessName: true } },
        worker: { select: { id: true, name: true, role: true } },
        trip: { include: { package: { select: { name: true } } } },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Penugasan tidak ditemukan." }, { status: 404 });
    }

    const isWorker = assignment.workerId === session.userId;
    const isTravel = assignment.travel?.userId === session.userId || (session.travelId && assignment.travelId === session.travelId);
    const isAdmin = session.role === "ADMIN";

    if (!isWorker && !isTravel && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const finalFee = parseFloat(String(fixedFee));
    const existingMessages = parseChatMessages(assignment.agreement, assignment);

    // Add milestone confirmation message to chat
    const dealMessage: ChatMessage = {
      id: `deal-${Date.now()}`,
      senderId: session.userId,
      senderName: session.name || (isWorker ? assignment.worker.name : assignment.travel.businessName),
      senderRole: session.role as any,
      messageType: "system",
      message: note || `✅ HARGA FIX TELAH DISEPAKATI: Rp ${finalFee.toLocaleString("id-ID")}. Penugasan ini resmi aktif dan disetujui bersama!`,
      proposedFee: finalFee,
      isFixedDeal: true,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...existingMessages, dealMessage];

    // Update assignment to ACCEPTED with the exact fixed fee
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        status: "ACCEPTED",
        feeAmount: finalFee,
        agreement: JSON.stringify(updatedMessages),
        fee: {
          upsert: {
            create: {
              amount: finalFee,
              negotiatedAmount: finalFee,
              paymentStatus: "UNPAID",
            },
            update: {
              amount: finalFee,
              negotiatedAmount: finalFee,
            },
          },
        },
      },
      include: { fee: true },
    });

    // Notify counterparty
    const targetUserId = isWorker ? assignment.travel.userId : assignment.workerId;
    const actorName = isWorker ? assignment.worker.name : assignment.travel.businessName;

    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: "ASSIGNMENT",
        title: "Harga Fee Fix Berhasil Ditetapkan! 🎉",
        message: `${actorName} telah menetapkan harga fix sebesar Rp ${finalFee.toLocaleString("id-ID")} untuk paket ${assignment.trip.package.name}. Penugasan kini resmi aktif.`,
        link: isWorker ? "/travel/dashboard" : (assignment.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard"),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Harga fix Rp ${finalFee.toLocaleString("id-ID")} berhasil ditetapkan dan penugasan resmi aktif!`,
      assignment: updatedAssignment,
      fixedFee: finalFee,
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("Set fixed fee error:", error);
    return NextResponse.json({ error: "Gagal menetapkan harga fix." }, { status: 500 });
  }
}
