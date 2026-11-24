import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadToStorage } from "@/lib/supabase-storage";
import { createNotification } from "@/lib/notifications";
import { isBookingExpired, checkAndCancelSingleBooking } from "@/lib/booking-expiration";
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
    let fileToUpload: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      bookingId = (formData.get("bookingId") as string) || "";
      method = (formData.get("method") as string) || "BANK_TRANSFER";
      amount = parseFloat((formData.get("amount") as string) || "0");
      paymentType = (formData.get("paymentType") as string) || "FULL";
      fileToUpload = formData.get("file") as File | null;
    } else {
      const body = await request.json();
      bookingId = body.bookingId;
      method = body.method || "BANK_TRANSFER";
      amount = parseFloat(body.amount);
      proofUrl = body.proofUrl;
      paymentType = body.paymentType || "FULL";
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: "Data booking tidak ditemukan." },
        { status: 400 }
      );
    }

    // 1. Validasi keberadaan booking dan hak akses kepemilikan
    const booking = await (prisma.booking as any).findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.customerId !== session.userId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    // 2. Validasi status pesanan: jika sudah dibatalkan, tolak langsung
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        {
          error: "Pemesanan ini telah dibatalkan. Anda tidak dapat mengunggah bukti pembayaran untuk pemesanan yang dibatalkan.",
        },
        { status: 400 }
      );
    }

    // 3. Validasi batas waktu pembayaran (45 menit):
    // HANYA berlaku untuk pembayaran awal (WAITING_PAYMENT atau WAITING_DP_PAYMENT).
    // Jika batas waktu terlampaui, otomatis batalkan pesanan dan tolak unggahan.
    if (isBookingExpired(booking)) {
      await checkAndCancelSingleBooking(booking.id);
      return NextResponse.json(
        {
          error: "Batas waktu pembayaran (45 menit) untuk pesanan ini telah berakhir. Pemesanan telah dibatalkan secara otomatis oleh sistem. Silakan lakukan pemesanan ulang jika masih berminat.",
          isExpired: true,
        },
        { status: 400 }
      );
    }

    // 4. Proses upload file ke storage jika menggunakan multipart/form-data
    if (fileToUpload) {
      if (!(fileToUpload instanceof File) || fileToUpload.size === 0) {
        return NextResponse.json(
          { error: "Foto bukti transfer wajib diunggah." },
          { status: 400 }
        );
      }

      if (fileToUpload.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Ukuran file melebihi batas maksimal 3 MB. Silakan pilih foto yang lebih kecil." },
          { status: 400 }
        );
      }

      if (!fileToUpload.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Format berkas tidak valid. Harap unggah file foto (JPG, PNG, WEBP)." },
          { status: 400 }
        );
      }

      const bytes = await fileToUpload.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const rawExt = path.extname(fileToUpload.name) || ".jpg";
      const ext = [".jpg", ".jpeg", ".png", ".webp"].includes(rawExt.toLowerCase()) ? rawExt.toLowerCase() : ".jpg";
      const filename = `proofs/proof-${bookingId}-${Date.now()}${ext}`;

      const result = await uploadToStorage(buffer, "tripku-uploads", filename, fileToUpload.type);

      if ("error" in result) {
        console.error("Storage error:", result.error);
        return NextResponse.json({ error: "Gagal mengunggah bukti pembayaran." }, { status: 500 });
      }

      proofUrl = result.url;
    }

    if (!amount || !proofUrl) {
      return NextResponse.json(
        { error: "Nominal transfer dan bukti pembayaran wajib diisi." },
        { status: 400 }
      );
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

    // Kirim notifikasi ke pihak travel ketika customer upload bukti pembayaran
    const bookingWithPkg = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        package: {
          include: { travel: { select: { userId: true } } },
        },
      },
    });
    if (bookingWithPkg?.package?.travel?.userId) {
      const paymentLabel = isDP ? "Uang Muka (DP)" : isPelunasan ? "Pelunasan" : "Pembayaran";
      await createNotification({
        userId: bookingWithPkg.package.travel.userId,
        type: "PAYMENT",
        title: `Bukti ${paymentLabel} Diterima`,
        message: `Pelanggan telah mengupload bukti ${paymentLabel.toLowerCase()} untuk paket "${bookingWithPkg.package.name}". Silakan tinjau dan verifikasi pembayaran.`,
        link: "/travel/payments",
      });
    }

    return NextResponse.json({ success: true, payment, paymentType });
  } catch (error) {
    console.error("Upload payment proof error:", error);
    return NextResponse.json({ error: "Gagal menyimpan bukti pembayaran." }, { status: 500 });
  }
}
