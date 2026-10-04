const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DUMMY = [
  { name: 'Budi Santoso', email: 'budi.santoso.dummy@tripku.app' },
  { name: 'Sari Dewi', email: 'sari.dewi.dummy@tripku.app' },
  { name: 'Ahmad Fauzi', email: 'ahmad.fauzi.dummy@tripku.app' },
  { name: 'Rina Wulandari', email: 'rina.wulan.dummy@tripku.app' },
  { name: 'Dendi Pratama', email: 'dendi.pratama.dummy@tripku.app' },
  { name: 'Hendra Wijaya', email: 'hendra.wijaya.dummy@tripku.app' },
];
const TMPL = [
  { rating: 5, comment: 'Luar biasa! Pelayanan travel sangat profesional dan pemandangannya memukau. Pasti balik lagi!' },
  { rating: 5, comment: 'Mantap banget! Fasilitas sesuai deskripsi, guide ramah dan informatif. Anak-anak sangat senang.' },
  { rating: 5, comment: 'Sangat memuaskan! Transportasi nyaman, penginapan bersih, makanan enak. Recommended!' },
  { rating: 4, comment: 'Perjalanan yang menyenangkan. Pemandu berpengalaman dan sabar. Overall bagus!' },
  { rating: 4, comment: 'Trip yang oke! Destinasinya indah, servis bagus. Semoga next trip lebih on time.' },
  { rating: 5, comment: 'Tidak menyesal pilih paket ini. Worth it banget, fasilitas komplit, tim sangat helpful.' },
  { rating: 4, comment: 'Pengalaman wisata berkesan. Koordinasi dari travel sangat baik. Recommended!' },
  { rating: 5, comment: 'Perjalanan terbaik! Tempat wisatanya keren, pemandangannya indah. Terima kasih tim travel!' },
];
async function main() {
  console.log('=== Seed Dummy Reviews ===');
  const pkgs = await prisma.package.findMany({
    where: { trips: { some: {} } },
    include: { trips: { take: 3, orderBy: { createdAt: 'asc' } }, travel: { select: { id: true } } },
    orderBy: { createdAt: 'asc' }
  });
  if (!pkgs.length) { console.log('Tidak ada paket dengan trip.'); return; }
  console.log('Paket dengan trip: ' + pkgs.length);
  const users = [];
  for (const c of DUMMY) {
    let u = await prisma.user.findFirst({ where: { email: c.email } });
    if (!u) {
      u = await prisma.user.create({ data: { email: c.email, name: c.name, password: 'dummy_not_for_login', role: 'CUSTOMER', isVerified: false } });
      console.log('Buat customer dummy: ' + u.name);
    }
    users.push(u);
  }
  let total = 0, off = 0;
  for (const pkg of pkgs) {
    const cnt = await prisma.review.count({ where: { trip: { packageId: pkg.id } } });
    if (cnt >= 2) { console.log('Skip - sudah ada ' + cnt + ' review: ' + pkg.name); continue; }
    const n = Math.min(pkg.trips.length, 3);
    console.log('');
    console.log('Paket: ' + pkg.name);
    for (let i = 0; i < n; i++) {
      const trip = pkg.trips[i];
      const u = users[(off + i) % users.length];
      const t = TMPL[(off + i) % TMPL.length];
      const dup = await prisma.review.findFirst({ where: { tripId: trip.id, customerId: u.id } });
      if (dup) { console.log('  skip dup: ' + u.name); continue; }
      const d = Math.floor(Math.random() * 60) + 5;
      await prisma.review.create({
        data: { tripId: trip.id, customerId: u.id, travelId: pkg.travel.id, rating: t.rating, comment: t.comment, createdAt: new Date(Date.now() - d * 86400000) }
      });
      total++;
      console.log('  + ' + u.name + ' (bintang ' + t.rating + ')');
    }
    off += n;
  }
  console.log('');
  console.log('=== Selesai! ' + total + ' review ditambahkan ===');
  console.log('');
  console.log('Ringkasan per paket:');
  for (const pkg of pkgs) {
    const rs = await prisma.review.findMany({ where: { trip: { packageId: pkg.id } }, select: { rating: true } });
    const avg = rs.length ? (rs.reduce((s, r) => s + r.rating, 0) / rs.length).toFixed(1) : '-';
    console.log('  ' + pkg.name.substring(0, 40) + ' -> ' + rs.length + ' ulasan, avg=' + avg);
  }
}
main().catch(function(e) { console.error(e); process.exit(1); }).finally(async function() { await prisma.$disconnect(); });
