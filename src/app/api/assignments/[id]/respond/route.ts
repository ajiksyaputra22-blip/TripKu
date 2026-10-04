import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

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
    const { action, counterFee, note } = body;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        fee: true,
        trip: {
          include: {
            package: { select: { name: true, destination: true } },
          },
        },
        travel: {
          select: { id: true, userId: true, businessName: true },
        },
        worker: {
          select: { id: true, name: true, role: true, workerProfile: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Penugasan tidak ditemukan." }, { status: 404 });
    }

    // Worker actions (ACCEPT, REJECT, NEGOTIATE)
    if (action === "ACCEPT" || action === "REJECT" || action === "NEGOTIATE") {
      if (session.role !== "ADMIN" && assignment.workerId !== session.userId) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }

      if (session.role === "DRIVER" || session.role === "GUIDE") {
        if (!assignment.worker?.workerProfile?.profileCompleted) {
          return NextResponse.json(
            { error: "Anda belum melengkapi profil. Silakan lengkapi profil terlebih dahulu sebelum merespons penugasan." },
            { status: 403 }
          );
        }
      }

      if (action === "NEGOTIATE") {
        if (!counterFee || isNaN(Number(counterFee)) || Number(counterFee) <= 0) {
          return NextResponse.json({ error: "Nominal penawaran fee harus valid." }, { status: 400 });
        }

        const negotiatedAmount = parseFloat(String(counterFee));
        const updatedAgreement = note 
          ? `${assignment.agreement || ""}\n[Tawaran Kru]: Rp ${negotiatedAmount.toLocaleString("id-ID")} - "${note}"`
          : `${assignment.agreement || ""}\n[Tawaran Kru]: Rp ${negotiatedAmount.toLocaleString("id-ID")}`;

        const updated = await prisma.assignment.update({
          where: { id },
          data: {
            status: "NEGOTIATING",
            agreement: updatedAgreement,
            fee: {
              upsert: {
                create: {
                  amount: assignment.feeAmount,
                  negotiatedAmount: negotiatedAmount,
                  paymentStatus: "UNPAID",
                },
                update: {
                  negotiatedAmount: negotiatedAmount,
                },
              },
            },
          },
          include: { fee: true },
        });

        // Notify Travel Admin
        if (assignment.travel?.userId) {
          await createNotification({
            userId: assignment.travel.userId,
            type: "ASSIGNMENT",
            title: `Negosiasi Fee Baru dari ${assignment.worker.name} 💬`,
            message: `${assignment.worker.name} (${assignment.role}) mengajukan tawar fee sebesar Rp ${negotiatedAmount.toLocaleString("id-ID")} untuk trip ${assignment.trip.package.name}.`,
            link: "/travel/trips",
          });
        }

        return NextResponse.json({
          success: true,
          message: `Tawaran fee Rp ${negotiatedAmount.toLocaleString("id-ID")} berhasil diajukan ke agensi travel!`,
          assignment: updated,
        });
      }

      const newStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
      const updated = await prisma.assignment.update({
        where: { id },
        data: { status: newStatus },
        include: { fee: true },
      });

      // Notify travel admin about acceptance / rejection
      if (assignment.travel?.userId) {
        await createNotification({
          userId: assignment.travel.userId,
          type: "ASSIGNMENT",
          title: action === "ACCEPT" ? "Penugasan Disetujui Kru ✓" : "Penugasan Ditolak Kru ✗",
          message: `${assignment.worker.name} (${assignment.role}) telah ${action === "ACCEPT" ? "menyetujui" : "menolak"} penugasan untuk paket ${assignment.trip.package.name}.`,
          link: "/travel/trips",
        });
      }

      return NextResponse.json({
        success: true,
        message: action === "ACCEPT" ? "Penugasan berhasil diterima!" : "Penugasan telah ditolak.",
        assignment: updated,
      });
    }

    // Travel Agency actions (TRAVEL_ACCEPT_NEGOTIATION, TRAVEL_COUNTER, TRAVEL_REJECT)
    if (action === "TRAVEL_ACCEPT_NEGOTIATION" || action === "TRAVEL_COUNTER" || action === "TRAVEL_REJECT") {
      if (session.role !== "ADMIN" && session.role !== "TRAVEL") {
        return NextResponse.json({ error: "Hanya agensi travel yang dapat merespons negosiasi." }, { status: 403 });
      }

      if (action === "TRAVEL_ACCEPT_NEGOTIATION") {
        const agreedFee = assignment.fee?.negotiatedAmount || assignment.feeAmount;

        const updated = await prisma.assignment.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            feeAmount: agreedFee,
            fee: {
              update: {
                amount: agreedFee,
              },
            },
          },
          include: { fee: true },
        });

        // Notify worker
        await createNotification({
          userId: assignment.workerId,
          type: "ASSIGNMENT",
          title: "Tawaran Fee Disetujui Agensi Travel! 🎉",
          message: `Agensi ${assignment.travel.businessName} telah menyetujui tawaran fee Anda sebesar Rp ${agreedFee.toLocaleString("id-ID")} untuk trip ${assignment.trip.package.name}. Penugasan kini resmi aktif.`,
          link: assignment.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
        });

        return NextResponse.json({
          success: true,
          message: `Negosiasi fee Rp ${agreedFee.toLocaleString("id-ID")} disetujui! Status kru kini aktif.`,
          assignment: updated,
        });
      }

      if (action === "TRAVEL_COUNTER") {
        if (!counterFee || isNaN(Number(counterFee)) || Number(counterFee) <= 0) {
          return NextResponse.json({ error: "Nominal penawaran fee baru harus valid." }, { status: 400 });
        }
        const newCounter = parseFloat(String(counterFee));
        const updatedAgreement = note 
          ? `${assignment.agreement || ""}\n[Tawaran Balik Agensi]: Rp ${newCounter.toLocaleString("id-ID")} - "${note}"`
          : `${assignment.agreement || ""}\n[Tawaran Balik Agensi]: Rp ${newCounter.toLocaleString("id-ID")}`;

        const updated = await prisma.assignment.update({
          where: { id },
          data: {
            status: "PROPOSED",
            feeAmount: newCounter,
            agreement: updatedAgreement,
            fee: {
              update: {
                amount: newCounter,
                negotiatedAmount: newCounter,
              },
            },
          },
          include: { fee: true },
        });

        // Notify worker
        await createNotification({
          userId: assignment.workerId,
          type: "ASSIGNMENT",
          title: "Tawaran Balik Fee dari Agensi Travel 💬",
          message: `Agensi ${assignment.travel.businessName} mengajukan penawaran fee baru sebesar Rp ${newCounter.toLocaleString("id-ID")}. Silakan tinjau kembali.`,
          link: assignment.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
        });

        return NextResponse.json({
          success: true,
          message: `Tawaran balik sebesar Rp ${newCounter.toLocaleString("id-ID")} berhasil dikirim ke kru.`,
          assignment: updated,
        });
      }

      if (action === "TRAVEL_REJECT") {
        const updated = await prisma.assignment.update({
          where: { id },
          data: { status: "REJECTED" },
        });

        return NextResponse.json({
          success: true,
          message: "Negosiasi ditolak dan penugasan dibatalkan.",
          assignment: updated,
        });
      }
    }

    return NextResponse.json({ error: "Tindakan tidak dikenali." }, { status: 400 });
  } catch (error) {
    console.error("Respond assignment error:", error);
    return NextResponse.json({ error: "Gagal merespons penugasan." }, { status: 500 });
  }
}
