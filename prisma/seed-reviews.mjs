/**
 * Seed dummy reviews untuk paket wisata yang SUDAH ADA (sudah punya trip).
 * Script ini AMAN: tidak akan menyentuh paket baru (tanpa trip).
 * Jalankan: node prisma/seed-reviews.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY_CUSTOMERS = [
  { name: "Budi Santoso", email: "budi.santoso.dummy@tripku.app" },
  { name: "Sari Dewi", email: "sari.dewi.dummy@tripku.app" },
  { name: "Ahmad Fauzi", email: "ahmad.fauzi.dummy@tripku.app" },
  { name: "Rina Wulandari", email: "rina.wulan.dummy@tripku.app" },
  { name: "Dendi Pratama", email: "dendi.pratama.dummy@tripku.app" },
  { name: "Fitria Nuraini", email: "fitria.nuraini.dummy@tripku.app" },
  { name: "Hendra Wijaya", email: "hendra.wijaya.dummy@tripku.app" },
  { name: "Laila Maharani", email: "laila.maharani.dummy@tripku.app" },
];

const REVIEW_TEMPLATES = [
  { rating: 5, comment: "Luar biasa! Pelayanan travel sangat profesional, pemandangan di lokasi wisata benar-benar memukau. Pasti akan trip lagi bersama mereka!" },
  { rating: 5, comment: "Mantap banget! Semua fasilitas sesuai deskripsi, guide nya ramah dan informatif. Anak-anak sangat senang." },
  { rating: 5, comment: "Sangat memuaskan! Transportasi nyaman, penginapan bersih dan strategis, makanan enak. Recommended banget!" },
  { rating: 4, comment: "Perjalanan yang menyenangkan. Pemandu wisata sangat berpengalaman dan sabar. Hanya sedikit kendala di jadwal keberangkatan, tapi overall bagus." },
  { rating: 4, comment: "Trip yang oke! Destinasinya indah, servis bagus. Semoga next trip bisa lebih on time lagi." },
  { rating: 5, comment: "Tidak menyesal pilih paket ini. Harganya worth it banget, fasilitas komplit, dan tim nya sangat helpful." },
  { rating: 4, comment: "Pengalaman wisata yang berkesan. Koordinasi dari travel sangat baik, peserta lain juga asik-asik. Recommended!" },
  { rating: 5, comment: "Perjalanan terbaik yang pernah saya ikuti. Tempat wisatanya keren, foto-fotonya bagus semua. Terima kasih tim travel!" },
  { rating: 4, comment: "Puas dengan layanannya! Mulai dari penjemputan, perjalanan, sampai hotel semua berjalan lancar. Akan direkomendasikan ke teman-teman." },
  { rating: 5, comment: "Wow, luar biasa! Pemandangannya indah banget. Petugasnya ramah dan selalu siap membantu. Paket ini sangat value for money!" },
];

async function main() {
  console.log("Memulai seed dummy reviews...");

  const packagesWithTrips = await prisma.package.findMany({
    where: { trips: { some: {} } },
    include: {
      trips: { take: 3, orderBy: { createdAt: "asc" } },
      travel: { select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (packagesWithTrips.length === 0) {
    console.log("Tidak ada paket dengan trip yang ditemukan.");
    return;
  }

  console.log("Ditemukan " + packagesWithTrips.length + " paket dengan trip.");

  const customerUsers = [];
  for (const c of DUMMY_CUSTOMERS) {
    let user = await prisma.user.findFirst({ where: { email: c.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: c.email,
          name: c.name,
          password: "dummy_hashed_password_not_for_login",
          role: "CUSTOMER",
          isVerified: false,
        },
      });
      console.log("Buat customer dummy: " + user.name);
    }
    customerUsers.push(user);
  }

  let totalAdded = 0;
  let offset = 0;

  for (const pkg of packagesWithTrips) {
    const existingCount = await prisma.review.count({
      where: { trip: { packageId: pkg.id } },
    });

    if (existingCount >= 2) {
      console.log("Skip: " + pkg.name + " sudah punya " + existingCount + " review");
      continue;
    }

    const reviewsToAdd = Math.min(pkg.trips.length, 3);
    console.log("Paket: " + pkg.name + " — tambah " + reviewsToAdd + " review");

    for (let i = 0; i < reviewsToAdd; i++) {
      const trip = pkg.trips[i];
      const customer = customerUsers[(offset + i) % customerUsers.length];
      const tpl = REVIEW_TEMPLATES[(offset + i) % REVIEW_TEMPLATES.length];

      const already = await prisma.review.findFirst({
        where: { tripId: trip.id, customerId: customer.id },
      });
      if (already) continue;

      const daysAgo = Math.floor(Math.random() * 60) + 5;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          tripId: trip.id,
          customerId: customer.id,
          travelId: pkg.travel.id,
          rating: tpl.rating,
          comment: tpl.comment,
          createdAt,
        },
      });

      totalAdded++;
      console.log("  + Review by " + customer.name + " rating=" + tpl.rating);
    }
    offset += reviewsToAdd;
  }

  console.log("Selesai! Total " + totalAdded + " review dummy ditambahkan.");

  // Summary
  for (const pkg of packagesWithTrips) {
    const reviews = await prisma.review.findMany({
      where: { trip: { packageId: pkg.id } },
      select: { rating: true },
    });
    const avg = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "none";
    console.log("  " + pkg.name + " -> " + reviews.length + " review, avg=" + avg);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
