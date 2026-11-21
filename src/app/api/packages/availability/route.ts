import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/packages/availability?packageId=xxx&date=YYYY-MM-DD&pax=N
 *
 * Cek ketersediaan kuota per hari untuk Private Trip.
 * - Hitung total peserta aktif pada rentang tanggal yang overlap dengan
 *   [date, date + durationDays - 1].
 * - Kembalikan: sisa kuota dan apakah tanggal tersedia.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");
    const dateStr = searchParams.get("date");
    const paxStr = searchParams.get("pax");

    if (!packageId || !dateStr) {
      return NextResponse.json(
        { error: "Parameter packageId dan date wajib diisi." },
        { status: 400 }
      );
    }

    const pkg: any = await prisma.package.findUnique({
      where: { id: packageId },
      select: {
        tripType: true,
        durationDays: true,
        dailyQuota: true,
        availableDays: true,
        status: true,
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Paket tidak ditemukan." }, { status: 404 });
    }

    if (pkg.tripType !== "PRIVATE") {
      return NextResponse.json(
        { error: "Paket ini bukan Private Trip." },
        { status: 400 }
      );
    }

    if (!pkg.dailyQuota || pkg.dailyQuota <= 0) {
      return NextResponse.json(
        { error: "Kuota harian belum dikonfigurasi untuk paket ini." },
        { status: 400 }
      );
    }

    const requestedDate = new Date(dateStr + "T00:00:00.000Z");
    if (isNaN(requestedDate.getTime())) {
      return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
    }

    const durationDays = pkg.durationDays || 1;
    // Range akhir trip customer ini
    const requestedEnd = new Date(requestedDate);
    requestedEnd.setUTCDate(requestedEnd.getUTCDate() + durationDays - 1);

    // Cek apakah tanggal yang dipilih sesuai dengan kategori availableDays
    // 0 = Minggu, 6 = Sabtu (WEEKEND), 1-5 = Senin-Jumat (WEEKDAY)
    const allowedCategory = pkg.availableDays || "ALL_DAYS";
    let isDayCategoryAllowed = true;
    let dayCategoryError = "";

    const checkCur = new Date(requestedDate);
    while (checkCur <= requestedEnd) {
      const dayOfWeek = checkCur.getUTCDay();
      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
      if (allowedCategory === "WEEKDAY" && isWeekendDay) {
        isDayCategoryAllowed = false;
        dayCategoryError = "Paket ini hanya tersedia untuk hari kerja (Senin - Jumat / Week Day).";
        break;
      } else if (allowedCategory === "WEEKEND" && !isWeekendDay) {
        isDayCategoryAllowed = false;
        dayCategoryError = "Paket ini hanya tersedia untuk akhir pekan (Sabtu - Minggu / Week End).";
        break;
      }
      checkCur.setUTCDate(checkCur.getUTCDate() + 1);
    }

    if (!isDayCategoryAllowed) {
      return NextResponse.json({
        available: false,
        canFit: false,
        categoryBlocked: true,
        message: dayCategoryError,
        dailyQuota: pkg.dailyQuota,
        booked: 0,
        remaining: 0,
        requestedDate: dateStr,
        durationDays,
        availableDays: allowedCategory,
      });
    }

    // Ambil semua booking AKTIF untuk paket ini yang tanggalnya OVERLAP
    // Overlap terjadi jika: booking.selectedDate <= requestedEnd && bookingEnd >= requestedDate
    // bookingEnd = selectedDate + (durationDays - 1) hari
    // Karena semua booking paket ini memiliki durationDays yang sama, cukup cek:
    // selectedDate <= requestedEnd && selectedDate >= (requestedDate - (durationDays-1))
    const earliestStart = new Date(requestedDate);
    earliestStart.setUTCDate(earliestStart.getUTCDate() - (durationDays - 1));

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        packageId,
        selectedDate: {
          gte: earliestStart,
          lte: requestedEnd,
        },
        status: {
          notIn: ["CANCELLED"],
        },
      },
      select: {
        participantCount: true,
        selectedDate: true,
      },
    });

    // Untuk setiap hari yang overlap, hitung max peserta di hari tersebut
    // Karena durationDays bisa > 1, kita cek occupancy di setiap hari dalam range requestedDate..requestedEnd
    const dailyOccupancy: Record<string, number> = {};

    for (const booking of overlappingBookings) {
      if (!booking.selectedDate) continue;
      const bStart = new Date(booking.selectedDate);
      const bEnd = new Date(bStart);
      bEnd.setUTCDate(bEnd.getUTCDate() + durationDays - 1);

      // Hari-hari yang di-occupy booking ini
      const cur = new Date(bStart);
      while (cur <= bEnd) {
        const key = cur.toISOString().substring(0, 10);
        dailyOccupancy[key] = (dailyOccupancy[key] || 0) + booking.participantCount;
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    // Cari occupancy tertinggi dalam range yang diminta customer
    let maxOccupancy = 0;
    const cur = new Date(requestedDate);
    while (cur <= requestedEnd) {
      const key = cur.toISOString().substring(0, 10);
      const occ = dailyOccupancy[key] || 0;
      if (occ > maxOccupancy) maxOccupancy = occ;
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const remaining = pkg.dailyQuota - maxOccupancy;
    const requestedPax = paxStr ? parseInt(paxStr) : 0;
    const available = remaining > 0;
    const canFit = requestedPax > 0 ? remaining >= requestedPax : available;

    // Buat info per-hari untuk tampilan kalender
    const dailyInfo: Record<string, { booked: number; remaining: number }> = {};
    const rangeStart = new Date(requestedDate);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - 60);
    const rangeEnd = new Date(requestedDate);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 90);

    return NextResponse.json({
      available,
      canFit,
      dailyQuota: pkg.dailyQuota,
      booked: maxOccupancy,
      remaining,
      requestedDate: dateStr,
      durationDays,
      coveredDates: Array.from({ length: durationDays }, (_, i) => {
        const d = new Date(requestedDate);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().substring(0, 10);
      }),
    });
  } catch (error) {
    console.error("Availability check error:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa ketersediaan tanggal." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/packages/availability
 * Body: { packageId, startDate, endDate }
 * Kembalikan occupancy per hari dalam rentang untuk render kalender.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { packageId, startDate, endDate } = body;

    if (!packageId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "packageId, startDate, dan endDate wajib diisi." },
        { status: 400 }
      );
    }

    const pkg: any = await prisma.package.findUnique({
      where: { id: packageId },
      select: { tripType: true, durationDays: true, dailyQuota: true, availableDays: true },
    });

    if (!pkg || pkg.tripType !== "PRIVATE" || !pkg.dailyQuota) {
      return NextResponse.json({ occupancy: {}, availableDays: "ALL_DAYS" });
    }

    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T23:59:59.999Z");
    const durationDays = pkg.durationDays || 1;

    // Booking yang mulainya lebih awal tapi masih overlap dengan range yang ditampilkan
    const earliestStart = new Date(start);
    earliestStart.setUTCDate(earliestStart.getUTCDate() - (durationDays - 1));

    const bookings = await prisma.booking.findMany({
      where: {
        packageId,
        selectedDate: { gte: earliestStart, lte: end },
        status: { notIn: ["CANCELLED"] },
      },
      select: { participantCount: true, selectedDate: true },
    });

    // Hitung occupancy per hari
    const occupancy: Record<string, number> = {};

    for (const booking of bookings) {
      if (!booking.selectedDate) continue;
      const bStart = new Date(booking.selectedDate);
      const bEnd = new Date(bStart);
      bEnd.setUTCDate(bEnd.getUTCDate() + durationDays - 1);

      const cur = new Date(bStart);
      while (cur <= bEnd) {
        const key = cur.toISOString().substring(0, 10);
        occupancy[key] = (occupancy[key] || 0) + booking.participantCount;
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    return NextResponse.json({
      occupancy,
      dailyQuota: pkg.dailyQuota,
      durationDays,
      availableDays: pkg.availableDays || "ALL_DAYS",
    });
  } catch (error) {
    console.error("Calendar occupancy error:", error);
    return NextResponse.json({ error: "Gagal memuat data kalender." }, { status: 500 });
  }
}
