import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  return NextResponse.json({
    success: false,
    message: "Fitur OCR KTP telah dinonaktifkan sesuai kebijakan sistem.",
  });
}
