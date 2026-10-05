import { NextResponse } from "next/server";
import { uploadToStorage } from "@/lib/supabase-storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah." }, { status: 400 });
    }

    // Validate file type (Images & PDF allowed)
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    const isImageOrPdf = file.type.startsWith("image/") || file.type === "application/pdf" || allowedMimeTypes.includes(file.type);
    if (!isImageOrPdf) {
      return NextResponse.json({ error: "Hanya file gambar (JPG/PNG/WEBP) atau PDF yang diizinkan." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file melebihi batas 5 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const result = await uploadToStorage(buffer, "tripku-uploads", filename, file.type);

    if ("error" in result) {
      console.error("Storage error:", result.error);
      return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: result.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
  }
}
