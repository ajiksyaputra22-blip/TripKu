import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DUMMY_CUSTOMERS = [
  { name: 'Budi Santoso', email: 'budi.santoso.dummy@tripku.app' },
  { name: 'Sari Dewi', email: 'sari.dewi.dummy@tripku.app' },
  { name: 'Ahmad Fauzi', email: 'ahmad.fauzi.dummy@tripku.app' },
  { name: 'Rina Wulandari', email: 'rina.wulan.dummy@tripku.app' },
  { name: 'Dendi Pratama', email: 'dendi.pratama.dummy@tripku.app' },
  { name: 'Hendra Wijaya', email: 'hendra.wijaya.dummy@tripku.app' },
];

const TEMPLATES = [
  { rating: 5, comment: 'Luar biasa! Pelayanan travel sangat profesional dan pemandangannya memukau. Pasti balik lagi!' },
  { rating: 5, comment: 'Mantap banget! Fasilitas sesuai deskripsi, guide ramah dan informatif. Anak-anak sangat senang.' },
  { rating: 5, comment: 'Sangat memuaskan! Transportasi nyaman, penginapan bersih, makanan enak. Recommended!' },
  { rating: 4, comment: 'Perjalanan menyenangkan. Pemandu berpengalaman dan sabar. Hanya sedikit kendala jadwal, tapi overall bagus!' },
  { rating: 4, comment: 'Trip oke! Destinasinya indah, servis bagus. Semoga next trip lebih on time.' },
  { rating: 5, comment: 'Tidak menyesal pilih paket ini. Worth it banget, fasilitas komplit, tim sangat helpful.' },
  { rating: 4, comment: 'Pengalaman wisata berkesan. Koordinasi dari travel sangat baik, peserta lain asik. Recommended!' },
  { rating: 5, comment: 'Perjalanan terbaik yang pernah saya ikuti! Tempat wisatanya keren, tim travel profesional.' },
];

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'seed-reviews-2026') {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
  }

  try {
    const pkgs = await prisma.package.findMany({
      where: { trips: { some: {} } },
      include: {
        trips: { take: 3, orderBy: { createdAt: 'asc' } },
        travel: { select: { id: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!pkgs.length) {
      return NextResponse.json({ message: 'Tidak ada paket dengan trip.', added: 0 });
    }

    const users = [];
    for (const c of DUMMY_CUSTOMERS) {
      let u = await prisma.user.findFirst({ where: { email: c.email } });
      if (!u) {
        u = await prisma.user.create({
          data: { email: c.email, name: c.name, passwordHash: 'dummy_seed_no_login', role: 'CUSTOMER' },
        });
      }
      users.push(u);
    }

    let total = 0;
    let offset = 0;
    const log: string[] = [];

    for (const pkg of pkgs) {
      const cnt = await prisma.review.count({ where: { trip: { packageId: pkg.id } } });
      if (cnt >= 2) {
        log.push('Skip (' + cnt + ' review): ' + pkg.name);
        continue;
      }
      const n = Math.min(pkg.trips.length, 3);
      log.push('Paket: ' + pkg.name + ' -> ' + n + ' review');

      for (let i = 0; i < n; i++) {
        const trip = pkg.trips[i];
        const u = users[(offset + i) % users.length];
        const tpl = TEMPLATES[(offset + i) % TEMPLATES.length];
        const dup = await prisma.review.findFirst({ where: { tripId: trip.id, customerId: u.id } });
        if (dup) continue;
        const daysAgo = Math.floor(Math.random() * 60) + 5;
        await prisma.review.create({
          data: {
            tripId: trip.id,
            customerId: u.id,
            travelId: pkg.travel.id,
            rating: tpl.rating,
            comment: tpl.comment,
            createdAt: new Date(Date.now() - daysAgo * 86400000),
          },
        });
        total++;
        log.push('  + ' + u.name + ' bintang=' + tpl.rating);
      }
      offset += n;
    }

    const summary = [];
    for (const pkg of pkgs) {
      const rs = await prisma.review.findMany({ where: { trip: { packageId: pkg.id } }, select: { rating: true } });
      const avg = rs.length ? (rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1) : '-';
      summary.push({ name: pkg.name, count: rs.length, avg });
    }

    return NextResponse.json({ success: true, added: total, log, summary });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
