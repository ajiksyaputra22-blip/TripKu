const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Clearing existing database records...');
  try {
    await prisma.tripCheckpoint.deleteMany();
    await prisma.review.deleteMany();
    await prisma.tripUpdate.deleteMany();
    await prisma.tripRoom.deleteMany();
    await prisma.fee.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.trip.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.package.deleteMany();
    await prisma.workerProfile.deleteMany();
    await prisma.travel.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Skip clean tables if empty');
  }

  console.log('🔐 Hashing default passwords...');
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  console.log('👤 Creating Users & Roles...');
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin Sistem Wisata Terpadu',
      email: 'admin@wisataterpadu.com',
      passwordHash: defaultPasswordHash,
      phone: '081100001111',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const travelUser1 = await prisma.user.create({
    data: {
      name: 'PT Jelajah Nusantara Mandiri',
      email: 'travel@nusantara.com',
      passwordHash: defaultPasswordHash,
      phone: '081299887766',
      role: 'TRAVEL',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
  });

  const travelProfile1 = await prisma.travel.create({
    data: {
      userId: travelUser1.id,
      businessName: 'Nusantara Tour & Travel',
      description: 'Spesialis open trip dan private tour pulau eksotis Indonesia dengan pengalaman lebih dari 10 tahun.',
      address: 'Jl. Sudirman No. 88, Jakarta Pusat',
      phone: '021-5558899',
      logoUrl: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=150&auto=format&fit=crop&q=80',
      verificationStatus: 'APPROVED',
      verificationDocument: 'NIB_0192837491029.pdf',
      bankName: 'Bank BCA',
      bankAccount: '8820192834',
      bankHolder: 'PT Jelajah Nusantara Mandiri',
    },
  });

  const travelUser2 = await prisma.user.create({
    data: {
      name: 'Flores Komodo Expeditions',
      email: 'travel@komodo.com',
      passwordHash: defaultPasswordHash,
      phone: '081388776655',
      role: 'TRAVEL',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const travelProfile2 = await prisma.travel.create({
    data: {
      userId: travelUser2.id,
      businessName: 'Flores Komodo Expeditions',
      description: 'Operator resmi Phinisi Liveaboard dan trekking Taman Nasional Komodo dengan kru bersertifikat internasional.',
      address: 'Jl. Soekarno Hatta No. 12, Labuan Bajo, NTT',
      phone: '0385-41239',
      logoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&auto=format&fit=crop&q=80',
      verificationStatus: 'APPROVED',
      verificationDocument: 'NIB_8829103948192.pdf',
      bankName: 'Bank Mandiri',
      bankAccount: '1410099887766',
      bankHolder: 'Flores Komodo Expeditions',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      name: 'Budi Pratama',
      email: 'customer@example.com',
      passwordHash: defaultPasswordHash,
      phone: '081234567890',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      name: 'Siti Rahma',
      email: 'customer2@example.com',
      passwordHash: defaultPasswordHash,
      phone: '081987654321',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const guideUser = await prisma.user.create({
    data: {
      name: 'Rian Hidayat (Licensed Guide)',
      email: 'guide@example.com',
      passwordHash: defaultPasswordHash,
      phone: '082155556666',
      role: 'GUIDE',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.workerProfile.create({
    data: {
      userId: guideUser.id,
      workerType: 'GUIDE',
      licenseNumber: 'HPI-NTT-2024-0912',
      experienceYears: 6,
      bio: 'Pemandu wisata bersertifikasi HPI spesialis fauna Komodo, snorkeling, dan fotografi alam liar.',
      bankName: 'Bank Mandiri',
      bankAccount: '1420098765432',
      bankHolder: 'Rian Hidayat',
      isAvailable: true,
      rating: 4.9,
    },
  });

  const driverUser = await prisma.user.create({
    data: {
      name: 'Pak Joko Susanto (Driver Wisata)',
      email: 'driver@example.com',
      passwordHash: defaultPasswordHash,
      phone: '081377778888',
      role: 'DRIVER',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.workerProfile.create({
    data: {
      userId: driverUser.id,
      workerType: 'DRIVER',
      licenseNumber: 'SIM-B1-UMUM-291039',
      experienceYears: 8,
      bio: 'Driver profesional rute Jawa Timur - Bali - NTT dengan pemahaman mendalam standar keamanan berkendara pariwisata.',
      bankName: 'Bank BCA',
      bankAccount: '8820394812',
      bankHolder: 'Joko Susanto',
      isAvailable: true,
      rating: 4.8,
    },
  });

  // 2. Create Packages
  console.log('🏝️ Creating Packages...');
  const pkg1 = await prisma.package.create({
    data: {
      travelId: travelProfile2.id,
      name: 'Labuan Bajo Komodo Liveaboard 3D2N - Phinisi Sailing & Manta Point',
      slug: 'labuan-bajo-komodo-liveaboard-3d2n',
      destination: 'Labuan Bajo, Nusa Tenggara Timur',
      province: 'Nusa Tenggara Timur',
      price: 3850000,
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      durationDays: 3,
      vehicle: 'Kapal Phinisi Deluxe AC Cabin',
      facilities: JSON.stringify([
        'Kabin AC di Kapal Phinisi',
        'Makan 3x sehari selama pelayaran + snack & kopi',
        'Tiket Masuk TN Komodo & Ranger',
        'Alat Snorkeling Lengkap',
        'Dokumentasi Drone & Underwater (GoPro)',
        'Pemandu Wisata Resmi HPI'
      ]),
      accommodation: 'Kabin AC Kapal Phinisi (2 malam di laut)',
      capacity: 12,
      quotaLeft: 8,
      description: 'Rasakan petualangan tak terlupakan mengarungi perairan surga Labuan Bajo. Menginap di kapal Phinisi ber-AC, trekking Pulau Padar saat sunrise, melihat satwa purba Komodo di habitat aslinya, berenang di Pink Beach, hingga snorkeling bersama Manta Ray raksasa di Manta Point.',
      coverImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80'
      ]),
      status: 'PUBLISHED',
    },
  });

  const pkg2 = await prisma.package.create({
    data: {
      travelId: travelProfile1.id,
      name: 'Bromo Golden Sunrise & Kawah Ijen Blue Fire Adventure 2D1N',
      slug: 'bromo-sunrise-ijen-blue-fire-2d1n',
      destination: 'Tengger & Banyuwangi, Jawa Timur',
      province: 'Jawa Timur',
      price: 1450000,
      departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      durationDays: 2,
      vehicle: 'Toyota HiAce Commuter + Jeep 4x4 Bromo',
      facilities: JSON.stringify([
        'Transportasi AC PP Surabaya/Malang',
        'Jeep 4x4 Bromo Sunrise',
        'Masker Gas & Senter Kawah Ijen',
        'Homestay di Banyuwangi 1 malam',
        'Tiket Masuk Bromo & Ijen',
        'Driver & Local Guide'
      ]),
      accommodation: 'Homestay Nyaman ber-AC di Banyuwangi',
      capacity: 14,
      quotaLeft: 6,
      description: 'Dua keajaiban alam vulkanik terbaik dunia dalam satu paket! Menyaksikan golden sunrise berlatar Gunung Bromo & Semeru dari Penanjakan, berfoto di Pasir Berbisik dan Bukit Teletubbies, lalu berburu fenomena langka Api Biru (Blue Fire) di kawah belerang Ijen.',
      coverImage: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&auto=format&fit=crop&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'
      ]),
      status: 'PUBLISHED',
    },
  });

  const pkg3 = await prisma.package.create({
    data: {
      travelId: travelProfile1.id,
      name: 'Raja Ampat Ultimate Paradise 4D3N - Wayag & Piaynemo Lagoon',
      slug: 'raja-ampat-paradise-4d3n',
      destination: 'Raja Ampat, Papua Barat Daya',
      province: 'Papua Barat Daya',
      price: 7900000,
      departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      durationDays: 4,
      vehicle: 'Speedboat Khusus Island Hopping + Antar Jemput Bandara',
      facilities: JSON.stringify([
        'Resort Terapung di atas air (Overwater Resort)',
        'Speedboat privat 4 hari',
        'Makan 3x sehari seafood segar',
        'Tiket Masuk Kawasan Konservasi Perairan',
        'Alat Snorkeling & Pelampung',
        'Pemandu Ahli Lokal'
      ]),
      accommodation: 'Overwater Eco Resort Raja Ampat (3 malam)',
      capacity: 10,
      quotaLeft: 4,
      description: 'Kepingan surga terakhir di bumi. Menyaksikan gugusan bukit karst ikonik di Wayag dan Piaynemo, berenang bersama hiu karang jinak di Yenbuba, menyelami keanekaragaman terumbu karang terbaik dunia di Teluk Kabui.',
      coverImage: 'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=800&auto=format&fit=crop&q=80',
      gallery: JSON.stringify([
        'https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=800&auto=format&fit=crop&q=80'
      ]),
      status: 'PUBLISHED',
    },
  });

  const pkg4 = await prisma.package.create({
    data: {
      travelId: travelProfile1.id,
      name: 'Exotic Nusa Penida Island Tour & Snorkeling Manta Bay 1D',
      slug: 'exotic-nusa-penida-tour-1d',
      destination: 'Nusa Penida, Bali',
      province: 'Bali',
      price: 650000,
      departureDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      durationDays: 1,
      vehicle: 'Fast Boat Sanur PP + Mobil APV/Avanza AC di Nusa Penida',
      facilities: JSON.stringify([
        'Tiket Fastboat Sanur - Nusa Penida PP',
        'Mobil Ber-AC & Driver di Nusa Penida',
        'Makan Siang Resto Lokal',
        'Tiket Masuk Kelingking & Broken Beach',
        'Snorkeling Boat & Alat di Manta Bay'
      ]),
      accommodation: 'Tidak Menginap (One Day Tour)',
      capacity: 20,
      quotaLeft: 14,
      description: 'Jelajahi keindahan spektakuler Nusa Penida Barat dalam satu hari penuh. Kunjungi tebing T-Rex di Kelingking Beach, jembatan alami Broken Beach, kolam bidadari Angel’s Billabong, serta snorkeling di Crystal Bay & Manta Bay.',
      coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
      gallery: JSON.stringify([]),
      status: 'PUBLISHED',
    },
  });

  const pkg5 = await prisma.package.create({
    data: {
      travelId: travelProfile1.id,
      name: 'Heritage Jogja - Borobudur, Prambanan & Merapi Lava Tour 2D1N',
      slug: 'heritage-jogja-borobudur-merapi-2d1n',
      destination: 'DI Yogyakarta & Magelang',
      province: 'DI Yogyakarta',
      price: 1200000,
      departureDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      durationDays: 2,
      vehicle: 'Toyota HiAce Premio + Jeep Offroad Merapi',
      facilities: JSON.stringify([
        'Transport HiAce AC sepanjang tour',
        'Tiket Masuk Borobudur & Candi Prambanan',
        'Jeep Lava Tour Merapi',
        'Hotel Bintang 4 di Malioboro 1 malam',
        'Makan Tradisional Khas Gudeg & Mangut Leha'
      ]),
      accommodation: 'Hotel Bintang 4 Kawasan Malioboro',
      capacity: 16,
      quotaLeft: 10,
      description: 'Menelusuri warisan agung budaya Jawa dari kemegahan candi Buddha terbesar di dunia Borobudur hingga candi Hindu Prambanan, dilengkapi petualangan seru offroad Jeep Lava Tour Merapi.',
      coverImage: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&auto=format&fit=crop&q=80',
      gallery: JSON.stringify([]),
      status: 'PUBLISHED',
    },
  });

  // 3. Create Sample Bookings & Flow
  console.log('📑 Creating Sample Bookings & Flow...');
  const booking1 = await prisma.booking.create({
    data: {
      bookingCode: 'WST-2026-001',
      customerId: customerUser.id,
      packageId: pkg1.id,
      bookingDate: new Date(),
      participantCount: 2,
      totalPrice: 7700000,
      notes: 'Mohon kabin depan jika masih ada, terima kasih!',
      status: 'CONFIRMED',
    },
  });

  await prisma.participant.createMany({
    data: [
      {
        bookingId: booking1.id,
        name: 'Budi Pratama',
        identityNumber: '3271029102930001',
        birthDate: new Date('1992-05-14'),
        emergencyContact: '081299990000 (Ayah)',
      },
      {
        bookingId: booking1.id,
        name: 'Dinda Ayunda',
        identityNumber: '3271029102930002',
        birthDate: new Date('1994-08-22'),
        emergencyContact: '081299990000 (Ibu)',
      },
    ],
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      paymentDate: new Date(),
      method: 'BANK_TRANSFER',
      amount: 7700000,
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      status: 'VERIFIED',
      verificationNote: 'Dana telah diterima di rekening BCA PT Jelajah Nusantara. Pembayaran valid.',
    },
  });

  // Create Trip for booking1
  const trip1 = await prisma.trip.create({
    data: {
      packageId: pkg1.id,
      bookingId: booking1.id,
      scheduleDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      destination: 'Labuan Bajo, Taman Nasional Komodo',
      vehicle: 'Phinisi KM Manta Raya Deluxe',
      operationalNotes: 'Semua peserta berkumpul di Pelabuhan Marina Labuan Bajo pukul 08:30 WITA.',
      currentLocation: 'Dermaga Marina Labuan Bajo',
      status: 'ONGOING',
    },
  });

  // Assign Guide & Driver to trip1
  const assignGuide = await prisma.assignment.create({
    data: {
      tripId: trip1.id,
      travelId: travelProfile2.id,
      workerId: guideUser.id,
      role: 'GUIDE',
      status: 'ACCEPTED',
      agreement: 'Memandu selama 3 hari 2 malam di kapal Phinisi TN Komodo.',
      feeAmount: 1500000,
    },
  });

  await prisma.fee.create({
    data: {
      assignmentId: assignGuide.id,
      amount: 1500000,
      paymentStatus: 'PAID',
      paymentDate: new Date(),
    },
  });

  const assignDriver = await prisma.assignment.create({
    data: {
      tripId: trip1.id,
      travelId: travelProfile2.id,
      workerId: driverUser.id,
      role: 'DRIVER',
      status: 'ACCEPTED',
      agreement: 'Antar jemput Bandara Komodo ke Pelabuhan Marina PP.',
      feeAmount: 600000,
    },
  });

  await prisma.fee.create({
    data: {
      assignmentId: assignDriver.id,
      amount: 600000,
      paymentStatus: 'UNPAID',
    },
  });

  // Create Trip Room
  const tripRoom1 = await prisma.tripRoom.create({
    data: {
      tripId: trip1.id,
      title: 'Ruang Koordinasi Labuan Bajo Phinisi Trip #001',
    },
  });

  await prisma.tripUpdate.createMany({
    data: [
      {
        tripRoomId: tripRoom1.id,
        userId: travelUser2.id,
        category: 'GATHERING_POINT',
        content: 'Halo teman-teman peserta! Titik kumpul keberangkatan adalah di Lobby Dermaga Marina Labuan Bajo pintu gate 2 pada hari H pukul 08.30 WITA. Driver Pak Joko bersiap standby di bandara mulai pukul 07.30.',
      },
      {
        tripRoomId: tripRoom1.id,
        userId: guideUser.id,
        category: 'PREPARATION',
        content: 'Jangan lupa membawa dry bag, sunblock ramah lingkungan (reef-safe), sepatu trekking untuk Pulau Padar, serta jaket penahan angin malam di atas kapal.',
      },
    ],
  });

  // Sample Checkpoints for Trip 1
  await prisma.tripCheckpoint.createMany({
    data: [
      {
        tripId: trip1.id,
        userId: driverUser.id,
        location: 'Bandara Internasional Komodo (Arrival Hall)',
        note: 'Penjemputan seluruh peserta telah selesai dengan armada HiAce. Menuju dermaga pelabuhan.',
        status: 'DEPARTED',
        reportedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        tripId: trip1.id,
        userId: guideUser.id,
        location: 'Dermaga Marina Labuan Bajo (Gate 2)',
        note: 'Seluruh peserta telah berkumpul lengkap, pengarahan keselamatan (safety briefing) dan persiapan boarding Phinisi.',
        status: 'REACHED',
        reportedAt: new Date(),
      },
    ],
  });

  // Sample Pending Booking for verification test
  const bookingPending = await prisma.booking.create({
    data: {
      bookingCode: 'WST-2026-002',
      customerId: customerUser2.id,
      packageId: pkg2.id,
      bookingDate: new Date(),
      participantCount: 1,
      totalPrice: 1450000,
      status: 'WAITING_VERIFICATION',
      notes: 'Penjemputan di Stasiun Malang Kota Baru jam 23:00.',
    },
  });

  await prisma.participant.create({
    data: {
      bookingId: bookingPending.id,
      name: 'Siti Rahma',
      identityNumber: '3578019283010002',
      birthDate: new Date('1996-11-19'),
      emergencyContact: '081233445566 (Kakak)',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: bookingPending.id,
      method: 'BANK_TRANSFER',
      amount: 1450000,
      proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      status: 'PENDING',
    },
  });

  // Review
  await prisma.review.create({
    data: {
      tripId: trip1.id,
      customerId: customerUser.id,
      travelId: travelProfile2.id,
      rating: 5,
      comment: 'Pelayanan sangat memuaskan! Kapal phinisi bersih dan makanannya mewah. Guide Mas Rian sangat sabar dan fotonya bagus-bagus!',
    },
  });

  console.log('✅ Database seeded successfully with demo accounts for all 5 roles!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
