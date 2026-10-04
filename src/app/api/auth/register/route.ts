import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, password, phone, nik, role, 
      businessName, address, agencyPhone, description,
      workerType, licenseNumber, bankName, bankAccount, bankHolder,
      avatarUrl, experienceYears, bioDetails,
      siupUrl, simImageUrl, certificateUrl, domicile,
      ktpImageUrl, birthDate
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role wajib diisi." },
        { status: 400 }
      );
    }

    const validRoles = ["CUSTOMER", "TRAVEL", "GUIDE", "DRIVER"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Pilihan role tidak valid." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Mitra (Travel, Guide, Driver) harus menunggu verifikasi admin (PENDING).
    // Customer langsung ACTIVE.
    const initialStatus = role === "CUSTOMER" ? "ACTIVE" : "PENDING";

    // Parse birthDate safely to prevent invalid date errors
    let parsedBirthDate: Date | null = null;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) {
        parsedBirthDate = d;
      }
    }

    // Parse experienceYears safely
    let parsedExp = 1;
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== "") {
      const p = parseInt(String(experienceYears), 10);
      if (!isNaN(p)) parsedExp = p;
    }

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash,
          phone,
          nik: (role === "CUSTOMER" || role === "GUIDE" || role === "DRIVER") ? (nik || null) : null,
          role,
          status: initialStatus,
          avatarUrl: avatarUrl || null,
        },
      });

      let travelId: string | undefined;

      if (role === "TRAVEL") {
        // REQ-2.5: SIUP / Surat Izin Usaha wajib bagi Travel
        const resolvedSiup = siupUrl || (description?.includes("[IZIN_USAHA_URL]:") ? description.split("[IZIN_USAHA_URL]:")[1]?.trim() : null);
        const cleanDescription = description
          ? description.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, "").trim()
          : null;

        const travel = await tx.travel.create({
          data: {
            userId: newUser.id,
            businessName: businessName || name,
            description: cleanDescription || null,
            address: address || null,
            phone: agencyPhone || phone || null,
            siupUrl: resolvedSiup,
            verificationStatus: "PENDING",
          },
        });
        travelId = travel.id;
      } else if (role === "GUIDE" || role === "DRIVER") {
        const resolvedSim = simImageUrl || (bioDetails?.includes("[SIM_URL]:") ? bioDetails.split("[SIM_URL]:")[1]?.trim() : null);
        const resolvedCert = certificateUrl || (bioDetails?.includes("[CERTIFICATE_PDF_URL]:") ? bioDetails.split("[CERTIFICATE_PDF_URL]:")[1]?.trim() : null);
        const resolvedDomicile = domicile || (bioDetails?.includes("Domisili:") ? bioDetails.split("Domisili:")[1]?.split("|")[0]?.trim() : (bioDetails?.includes("Wilayah:") ? bioDetails.split("Wilayah:")[1]?.split("|")[0]?.trim() : null));

        const cleanBio = bioDetails
          ? bioDetails
              .replace(/\[SIM_URL\]:[^\s\n\r|]+/gi, "")
              .replace(/\[CERTIFICATE_PDF_URL\]:[^\s\n\r|]+/gi, "")
              .replace(/\|\s*\|/g, "|")
              .replace(/^\s*\|\s*/, "")
              .replace(/\s*\|\s*$/, "")
              .trim()
          : null;

        await tx.workerProfile.create({
          data: {
            userId: newUser.id,
            workerType: role,
            licenseNumber: licenseNumber || "MENUNGGU_VERIFIKASI",
            bankName: bankName || "Bank BCA",
            bankAccount: bankAccount || null,
            bankHolder: bankHolder || name,
            experienceYears: parsedExp,
            bio: cleanBio || null,
            simImageUrl: resolvedSim,
            certificateUrl: resolvedCert,
            domicile: resolvedDomicile,
            ktpImageUrl: ktpImageUrl || null,
            birthDate: parsedBirthDate,
            profileCompleted: false, // Wajib melengkapi profil setelah di-ACC oleh Admin
            isAvailable: false, // Tidak tersedia sebelum diverifikasi admin
          },
        });
      }

      return { newUser, travelId };
    });

    const { newUser, travelId } = result;

    // Hanya Customer yang langsung mendapat sesi login.
    // Mitra harus menunggu verifikasi admin terlebih dahulu.
    if (role === "CUSTOMER") {
      const token = await createSessionToken({
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role as "ADMIN" | "TRAVEL" | "CUSTOMER" | "GUIDE" | "DRIVER",
        travelId,
        status: newUser.status,
      });

      const response = NextResponse.json({
        success: true,
        message: "Registrasi berhasil. Selamat datang!",
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
        requiresVerification: false,
      });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    // Untuk Mitra: kembalikan sukses tanpa sesi (tanpa cookie).
    return NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi oleh Admin. Anda akan menerima konfirmasi setelah akun diverifikasi.",
      requiresVerification: true,
      role: newUser.role,
    });

  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan server saat pendaftaran akun." },
      { status: 500 }
    );
  }
}
