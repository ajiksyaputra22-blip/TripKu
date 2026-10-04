import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { type ChatMessage, parseChatMessages } from "@/lib/chat-utils";

// GET /api/assignments/[id]/chat — Dapatkan riwayat live chat negosiasi fee
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

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        fee: true,
        travel: {
          select: { id: true, userId: true, businessName: true, logoUrl: true, phone: true },
        },
        worker: {
          select: { id: true, name: true, role: true, phone: true, avatarUrl: true, workerProfile: true },
        },
        trip: {
          include: {
            package: {
              select: { id: true, name: true, destination: true, departureDate: true, durationDays: true, vehicle: true },
            },
          },
        },
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

    const messages = parseChatMessages(assignment.agreement, assignment);

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        role: assignment.role,
        status: assignment.status,
        feeAmount: assignment.feeAmount,
        negotiatedAmount: assignment.fee?.negotiatedAmount || null,
        paymentStatus: assignment.fee?.paymentStatus || "UNPAID",
        travel: assignment.travel,
        worker: assignment.worker,
        trip: assignment.trip,
      },
      messages,
    });
  } catch (error) {
    console.error("Fetch negotiation chat error:", error);
    return NextResponse.json({ error: "Gagal memuat chat negosiasi." }, { status: 500 });
  }
}

// POST /api/assignments/[id]/chat — Kirim pesan atau ajukan harga baru
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
    const { message, proposedFee } = body;

    if (!message?.trim() && (!proposedFee || isNaN(Number(proposedFee)))) {
      return NextResponse.json({ error: "Pesan atau nominal fee wajib diisi." }, { status: 400 });
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

    if (assignment.status === "ACCEPTED") {
      return NextResponse.json({ error: "Harga sudah fix. Chat negosiasi ditutup." }, { status: 400 });
    }

    const isWorker = assignment.workerId === session.userId;
    const isTravel = assignment.travel?.userId === session.userId || (session.travelId && assignment.travelId === session.travelId);
    const isAdmin = session.role === "ADMIN";

    if (!isWorker && !isTravel && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const existingMessages = parseChatMessages(assignment.agreement, assignment);
    const parsedProposedFee = proposedFee && !isNaN(Number(proposedFee)) && Number(proposedFee) > 0
      ? parseFloat(String(proposedFee))
      : null;

    // If a new price offer is being made, mark all previous offers as superseded
    let updatedMessages = [...existingMessages];
    if (parsedProposedFee) {
      updatedMessages = updatedMessages.map((m) =>
        m.messageType === "price_offer" && !m.superseded && !m.isFixedDeal
          ? { ...m, superseded: true, approvedByTravel: false, approvedByWorker: false }
          : m
      );
    }

    const senderName = session.name || (isWorker ? assignment.worker.name : assignment.travel.businessName);

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: session.userId,
      senderName,
      senderRole: session.role as ChatMessage["senderRole"],
      messageType: parsedProposedFee ? "price_offer" : "text",
      message: message
        ? String(message).trim()
        : `Mengajukan penawaran fee: Rp ${parsedProposedFee!.toLocaleString("id-ID")}`,
      proposedFee: parsedProposedFee,
      // The proposer auto-approves their own offer
      approvedByTravel: parsedProposedFee ? (isTravel || isAdmin ? true : false) : undefined,
      approvedByWorker: parsedProposedFee ? (isWorker ? true : false) : undefined,
      superseded: false,
      createdAt: new Date().toISOString(),
    };

    updatedMessages.push(newMessage);

    const updateData: any = {
      agreement: JSON.stringify(updatedMessages),
    };

    if (parsedProposedFee) {
      updateData.status = "NEGOTIATING";
      updateData.fee = {
        upsert: {
          create: { amount: assignment.feeAmount, negotiatedAmount: parsedProposedFee, paymentStatus: "UNPAID" },
          update: { negotiatedAmount: parsedProposedFee },
        },
      };
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: { fee: true },
    });

    // Notify counterparty
    const targetUserId = isWorker ? assignment.travel.userId : assignment.workerId;
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: "ASSIGNMENT",
        title: parsedProposedFee
          ? `Penawaran Fee Baru dari ${senderName} 💰`
          : `Pesan Chat dari ${senderName} 💬`,
        message: parsedProposedFee
          ? `${senderName} menawarkan fee Rp ${parsedProposedFee.toLocaleString("id-ID")} untuk paket ${assignment.trip.package.name}.`
          : `${senderName}: "${String(message || "").slice(0, 70)}${String(message || "").length > 70 ? "..." : ""}"`,
        link: isWorker
          ? "/travel/dashboard"
          : assignment.role === "GUIDE"
          ? "/guide/dashboard"
          : "/driver/dashboard",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pesan terkirim.",
      assignment: updatedAssignment,
      messages: updatedMessages,
    });
  } catch (error) {
    console.error("Send negotiation chat message error:", error);
    return NextResponse.json({ error: "Gagal mengirim pesan." }, { status: 500 });
  }
}

// PATCH /api/assignments/[id]/chat — Setujui tawaran harga (approve offer)
export async function PATCH(
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
    const { offerId } = body; // ID of the ChatMessage offer being approved

    if (!offerId) {
      return NextResponse.json({ error: "offerId wajib diisi." }, { status: 400 });
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

    if (assignment.status === "ACCEPTED") {
      return NextResponse.json({ error: "Harga sudah fix. Tidak bisa mengubah persetujuan." }, { status: 400 });
    }

    const isWorker = assignment.workerId === session.userId;
    const isTravel = assignment.travel?.userId === session.userId || (session.travelId && assignment.travelId === session.travelId);
    const isAdmin = session.role === "ADMIN";

    if (!isWorker && !isTravel && !isAdmin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const messages = parseChatMessages(assignment.agreement, assignment);
    const offerIndex = messages.findIndex((m) => m.id === offerId && m.messageType === "price_offer" && !m.superseded);

    if (offerIndex === -1) {
      return NextResponse.json({ error: "Tawaran tidak ditemukan atau sudah tidak berlaku." }, { status: 404 });
    }

    const offer = messages[offerIndex];

    // Update approval flags
    if (isTravel || isAdmin) {
      offer.approvedByTravel = true;
    }
    if (isWorker) {
      offer.approvedByWorker = true;
    }

    messages[offerIndex] = offer;

    const bothApproved = offer.approvedByTravel && offer.approvedByWorker;
    const finalFee = offer.proposedFee!;
    const senderName = session.name || (isWorker ? assignment.worker.name : assignment.travel.businessName);

    let newStatus = "NEGOTIATING";
    const updateData: any = { agreement: JSON.stringify(messages) };

    if (bothApproved) {
      // Mark the offer as fixed deal
      messages[offerIndex] = { ...offer, isFixedDeal: true };

      // Add a system message
      const dealMsg: ChatMessage = {
        id: `deal-${Date.now()}`,
        senderId: "system",
        senderName: "Sistem TripKu",
        senderRole: "ADMIN",
        messageType: "system",
        message: `✅ HARGA FIX DISEPAKATI: Rp ${finalFee.toLocaleString("id-ID")}. Penugasan ini resmi aktif. Chat negosiasi ditutup.`,
        proposedFee: finalFee,
        isFixedDeal: true,
        createdAt: new Date().toISOString(),
      };
      messages.push(dealMsg);

      newStatus = "ACCEPTED";
      updateData.status = "ACCEPTED";
      updateData.feeAmount = finalFee;
      updateData.fee = {
        upsert: {
          create: { amount: finalFee, negotiatedAmount: finalFee, paymentStatus: "UNPAID" },
          update: { amount: finalFee, negotiatedAmount: finalFee },
        },
      };
      updateData.agreement = JSON.stringify(messages);
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
      include: { fee: true },
    });

    // Notify counterparty
    const targetUserId = isWorker ? assignment.travel.userId : assignment.workerId;
    if (targetUserId) {
      await createNotification({
        userId: targetUserId,
        type: "ASSIGNMENT",
        title: bothApproved
          ? `Harga Fix Disepakati! 🎉`
          : `${senderName} Menyetujui Tawaran Fee ✅`,
        message: bothApproved
          ? `Kedua pihak menyetujui fee Rp ${finalFee.toLocaleString("id-ID")} untuk paket ${assignment.trip.package.name}. Penugasan resmi aktif!`
          : `${senderName} menyetujui tawaran Rp ${finalFee.toLocaleString("id-ID")}. Menunggu persetujuan Anda.`,
        link: isWorker
          ? "/travel/dashboard"
          : assignment.role === "GUIDE"
          ? "/guide/dashboard"
          : "/driver/dashboard",
      });
    }

    return NextResponse.json({
      success: true,
      bothApproved,
      finalFee: bothApproved ? finalFee : null,
      status: newStatus,
      messages,
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Approve offer error:", error);
    return NextResponse.json({ error: "Gagal menyetujui tawaran." }, { status: 500 });
  }
}
