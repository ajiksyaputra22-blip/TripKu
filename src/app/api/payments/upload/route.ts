import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Hanya akun Customer yang dapat mengunggah bukti pembayaran." },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let bookingId = "";
    let method = "BANK_TRANSFER";
    let paymentType = "FULL";
    let amount = 0;
    let proofUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      bookingId = (formData.get("bookingId") as string) || "";
      method = (formData.get("method") as string) || "BANK_TRANSFER";
      amount = parseFloat((formData.get("amount") as string) || "0");
      paymentType = (formData.get("paymentType") as string) || "FULL";

      const file = formData.get("file") as File | null;
      if (!file || !(file instanceof File) || file.size === 0) {
        return NextResponse.json(
          { error: "Foto bukti transfer wajib diunggah." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Ukuran file melebihi batas maksimal 3 MB. Silakan pilih foto yang lebih kecil." },
          { status: 400 }
        );
      }

      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Format berkas tidak valid. Harap unggah file foto (JPG, PNG, WEBP)." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const rawExt = path.extname(file.name) || ".jpg";
      const ext = [".jpg", ".jpeg", ".png", ".webp"].includes(rawExt.toLowerCase()) ? rawExt.toLowerCase() : ".jpg";
      const filename = `proof-${bookingId}-${Date.now()}${ext}`;

      const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs");
      await fs.mkdir(uploadDir, { recursive: true });

      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, buffer);

      proofUrl = `/uploads/proofs/${filename}`;
    } else {
      const body = await request.json();
      bookingId = body.bookingId;
      method = body.method || "BANK_TRANSFER";
      amount = parseFloat(body.amount);
      proofUrl = body.proofUrl;
      paymentType = body.paymentType || "FULL";
    }

    if (!bookingId || !amount || !proofUrl) {
      return NextResponse.json(
        { error: "Data booking, nominal transfer, dan bukti pembayaran wajib diisi." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.customerId !== session.userId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    // Determine payment type and booking status based on what's being paid
    const isDP = paymentType === "DP";
    const isPelunasan = paymentType === "PELUNASAN";

    // Upsert payment — multiple payments possible (DP + PELUNASAN)
    const existingDP = await prisma.payment.findFirst({
      where: { bookingId, paymentType: "DP" },
    });

    let payment;
    if (isDP && existingDP) {
      // Re-upload DP proof
      payment = await prisma.payment.update({
        where: { id: existingDP.id },
        data: { method, amount, proofUrl, status: "PENDING", paymentDate: new Date() },
      });
    } else {
      payment = await prisma.payment.create({
        data: {
          bookingId,
          method: method || "BANK_TRANSFER",
          amount,
          proofUrl,
          paymentType: paymentType || "FULL",
          status: "PENDING",
          paymentDate: new Date(),
        },
      });
    }

    // Update booking status
    const newBookingStatus = isDP ? "WAITING_VERIFICATION" : isPelunasan ? "WAITING_VERIFICATION" : "WAITING_VERIFICATION";
    const updateData: any = { status: newBookingStatus };
    if (isDP) updateData.dpAmount = amount;

    await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return NextResponse.json({ success: true, payment, paymentType });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    return NextResponse.json({ error: "Gagal menyimpan bukti pembayaran." }, { status: 500 });
  }
}
