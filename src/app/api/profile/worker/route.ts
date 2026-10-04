import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET: Get worker profile for logged-in guide/driver
export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "DRIVER")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        nik: true,
        avatarUrl: true,
        workerProfile: true,
        workerReviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customerId: true,
            customer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 });
    }

    let workerProfile = user.workerProfile;
    if (workerProfile && workerProfile.bio && (workerProfile.bio.includes("[SIM_URL]:") || workerProfile.bio.includes("[CERTIFICATE_PDF_URL]:"))) {
      let extractedSim = workerProfile.simImageUrl;
      let extractedCert = workerProfile.certificateUrl;

      if (!extractedSim && workerProfile.bio.includes("[SIM_URL]:")) {
        extractedSim = workerProfile.bio.split("[SIM_URL]:")[1]?.split("|")[0]?.trim();
      }
      if (!extractedCert && workerProfile.bio.includes("[CERTIFICATE_PDF_URL]:")) {
        extractedCert = workerProfile.bio.split("[CERTIFICATE_PDF_URL]:")[1]?.split("|")[0]?.trim();
      }

      const cleanedBio = workerProfile.bio
        .replace(/\[SIM_URL\]:[^\s\n\r|]+/gi, "")
        .replace(/\[CERTIFICATE_PDF_URL\]:[^\s\n\r|]+/gi, "")
        .replace(/\|\s*\|/g, "|")
        .replace(/^\s*\|\s*/, "")
        .replace(/\s*\|\s*$/, "")
        .trim();

      workerProfile = await prisma.workerProfile.update({
        where: { id: workerProfile.id },
        data: {
          bio: cleanedBio || null,
          ...(extractedSim && !workerProfile.simImageUrl ? { simImageUrl: extractedSim } : {}),
          ...(extractedCert && !workerProfile.certificateUrl ? { certificateUrl: extractedCert } : {}),
        },
      });
    }

    const reviews = user.workerReviews || [];
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : (workerProfile?.rating || 5.0);

    const updatedWorkerProfile = workerProfile ? {
      ...workerProfile,
      rating: avgRating,
      reviewCount: totalReviews,
    } : null;

    return NextResponse.json({
      user: {
        ...user,
        workerProfile: updatedWorkerProfile,
        totalReviews,
        rating: avgRating,
      },
    });
  } catch (error) {
    console.error("Get worker profile error:", error);
    return NextResponse.json({ error: "Gagal mengambil profil." }, { status: 500 });
  }
}

// PATCH: Update worker profile (complete profile after registration)
export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "GUIDE" && session.role !== "DRIVER")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { name, nik, phone, bio, experienceYears, ktpImageUrl, simImageUrl, avatarUrl, bankName, bankAccount, bankHolder, address, birthDate, certificateUrl, domicile } = body;

    // Update user basic info (name, nik, phone, avatar) - REQ-2.1 & REQ-2.7
    const userUpdate: any = {};
    if (name) userUpdate.name = name;
    if (nik) userUpdate.nik = nik;
    if (phone) userUpdate.phone = phone;
    if (avatarUrl) userUpdate.avatarUrl = avatarUrl;

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: session.userId },
        data: userUpdate,
      });
    }

    // Get current profile to merge documents and details
    const currentWorker = await prisma.workerProfile.findUnique({
      where: { userId: session.userId },
    });

    const resolvedKtp = ktpImageUrl || currentWorker?.ktpImageUrl;
    const resolvedSim = simImageUrl || currentWorker?.simImageUrl;
    const resolvedAddress = address || currentWorker?.address;
    const resolvedDomicile = domicile || currentWorker?.domicile;

    let parsedBirthDate: Date | undefined = undefined;
    if (birthDate) {
      const d = new Date(birthDate);
      if (!isNaN(d.getTime())) parsedBirthDate = d;
    }

    let parsedExp: number | undefined = undefined;
    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== "") {
      const parsed = parseInt(String(experienceYears), 10);
      if (!isNaN(parsed)) parsedExp = parsed;
    }

    // Driver requires KTP, SIM, Address/Domicile. Guide requires KTP, Address/Domicile.
    const isCompleted = session.role === "DRIVER" 
      ? Boolean(resolvedKtp && resolvedSim && (resolvedAddress || resolvedDomicile))
      : Boolean(resolvedKtp && (resolvedAddress || resolvedDomicile));

    let cleanedBio = bio;
    if (typeof bio === "string") {
      cleanedBio = bio
        .replace(/\[SIM_URL\]:[^\s\n\r|]+/gi, "")
        .replace(/\[CERTIFICATE_PDF_URL\]:[^\s\n\r|]+/gi, "")
        .replace(/\|\s*\|/g, "|")
        .replace(/^\s*\|\s*/, "")
        .replace(/\s*\|\s*$/, "")
        .trim();
    }

    // Update worker profile
    const updatedProfile = await prisma.workerProfile.update({
      where: { userId: session.userId },
      data: {
        bio: cleanedBio !== undefined ? cleanedBio : undefined,
        experienceYears: parsedExp,
        ktpImageUrl: ktpImageUrl || undefined,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
        bankHolder: bankHolder || undefined,
        address: address || undefined,
        domicile: domicile || undefined,
        birthDate: parsedBirthDate,
        simImageUrl: simImageUrl || undefined,
        certificateUrl: certificateUrl || undefined,
        profileCompleted: isCompleted,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Update worker profile error:", error);
    return NextResponse.json({ error: "Gagal memperbarui profil." }, { status: 500 });
  }
}
