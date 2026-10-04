import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    // Create upload directory if not exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${folder}/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
  }
}
