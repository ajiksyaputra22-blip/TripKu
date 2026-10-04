import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

/**
 * REQ-5.3 — Travel mengupload bukti bayar fee kru.
 * Status berubah: UNPAID → WAITING_CONFIRMATION
 * Worker harus mengkonfirmasi penerimaan fee → PAID
 * 
 * POST /api/fees/[id]/pay
 * Body: { proofUrl: string, negotiatedAmount?: number }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "TRAVEL" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { proofUrl, negotiatedAmount, paymentType = "FULL", dpAmount: reqDpAmount } = body;

    if (!proofUrl) {
      return NextResponse.json(
        { error: "Bukti transfer wajib diupload sebelum mengkonfirmasi pembayaran fee." },
        { status: 400 }
      );
    }

    const fee = await prisma.fee.findUnique({
      where: { id },
      include: {
        assignment: {
          include: {
            worker: { select: { id: true, name: true, role: true } },
            trip: { include: { package: { select: { name: true, destination: true } } } },
            travel: { select: { businessName: true } },
          },
        },
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Data fee tidak ditemukan." }, { status: 404 });
    }

    if (session.role === "TRAVEL" && fee.assignment.travelId !== session.travelId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    if (fee.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Fee sudah berstatus LUNAS." }, { status: 400 });
    }

    const totalAmount = negotiatedAmount
      ? parseFloat(String(negotiatedAmount))
      : (fee.negotiatedAmount || fee.amount);

    const travelName = fee.assignment.travel.businessName || "Admin Travel";
    const dest = fee.assignment.trip.package.destination || fee.assignment.trip.package.name;

    if (paymentType === "DP") {
      const dpVal = reqDpAmount ? parseFloat(String(reqDpAmount)) : Math.round(totalAmount / 2);
      const remainingVal = Math.max(0, totalAmount - dpVal);

      const updated = await prisma.fee.update({
        where: { id },
        data: {
          paymentType: "DP",
          dpAmount: dpVal,
          dpProofUrl: proofUrl,
          dpPaid: true,
          dpPaidDate: new Date(),
          remainingAmount: remainingVal,
          paymentStatus: "DP_PAID",
          negotiatedAmount: totalAmount,
        },
      });

      await prisma.assignment.update({
        where: { id: fee.assignmentId },
        data: {
          dpFeeAmount: dpVal,
          dpFeePaid: true,
        },
      });

      // Notifikasi ke worker
      await createNotification({
        userId: fee.assignment.workerId,
        type: "ASSIGNMENT",
        title: "DP Fee Tugas Telah Dibayarkan 💰",
        message: `Agen ${travelName} telah mentransfer DP fee sebesar Rp ${dpVal.toLocaleString("id-ID")} untuk tugas di ${dest}. Sisa fee Rp ${remainingVal.toLocaleString("id-ID")} akan dilunasi saat perjalanan mencapai setengah rute.`,
        link: fee.assignment.worker.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
      });

      return NextResponse.json({
        success: true,
        message: `DP Fee sebesar Rp ${dpVal.toLocaleString("id-ID")} berhasil dibayarkan! Sisa pelunasan: Rp ${remainingVal.toLocaleString("id-ID")}.`,
        fee: updated,
      });
    }

    if (paymentType === "REMAINING") {
      const remainingVal = fee.remainingAmount || (totalAmount - (fee.dpAmount || 0));

      const updated = await prisma.fee.update({
        where: { id },
        data: {
          remainingProofUrl: proofUrl,
          proofUrl: proofUrl,
          paymentStatus: "WAITING_CONFIRMATION",
          paymentDate: new Date(),
        },
      });

      await createNotification({
        userId: fee.assignment.workerId,
        type: "ASSIGNMENT",
        title: "Pelunasan Sisa Fee Menunggu Konfirmasi Anda 💰",
        message: `Agen ${travelName} telah mengirim bukti transfer pelunasan sisa fee sebesar Rp ${remainingVal.toLocaleString("id-ID")} untuk tugas di ${dest}. Silakan konfirmasi penerimaan.`,
        link: fee.assignment.worker.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
      });

      return NextResponse.json({
        success: true,
        message: "Bukti pelunasan fee berhasil dikirim! Menunggu konfirmasi penerimaan dari kru.",
        fee: updated,
      });
    }

    // FULL PAYMENT
    const updated = await prisma.fee.update({
      where: { id },
      data: {
        paymentType: "FULL",
        paymentStatus: "WAITING_CONFIRMATION",
        proofUrl,
        negotiatedAmount: totalAmount,
        paymentDate: new Date(),
      },
    });

    // Notifikasi ke worker untuk konfirmasi pembayaran penuh
    await createNotification({
      userId: fee.assignment.workerId,
      type: "ASSIGNMENT",
      title: "Pembayaran Fee Menunggu Konfirmasi Anda 💰",
      message: `Agen ${travelName} telah mengirim bukti transfer fee penuh sebesar Rp ${totalAmount.toLocaleString("id-ID")} untuk tugas di ${dest}. Silakan konfirmasi penerimaan.`,
      link: fee.assignment.worker.role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: "Bukti bayar fee penuh berhasil diupload. Menunggu konfirmasi dari kru.",
      fee: updated,
    });
  } catch (error) {
    console.error("Pay fee error:", error);
    return NextResponse.json({ error: "Gagal memproses pembayaran fee." }, { status: 500 });
  }
}
