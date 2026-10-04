import Link from "next/link";
import prisma from "@/lib/prisma";
import PackageCard, { PackageData } from "@/components/PackageCard";
import {
  Search,
  ShieldCheck,
  Compass,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Navigation
} from "lucide-react";

export const revalidate = 0; // Dynamic rendering for fresh package data

async function getFeaturedPackages(): Promise<PackageData[]> {
  try {
    // REQ-3.2: Order by booking count descending (most popular first)
    const packages = await prisma.package.findMany({
      where: { status: "PUBLISHED" },
      take: 6,
      include: {
        travel: {
          select: {
            id: true,
            businessName: true,
            verificationStatus: true,
            logoUrl: true,
          },
        },
        trips: {
          select: {
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
        bookings: {
          where: {
            status: { not: "CANCELLED" },
          },
          select: {
            participantCount: true,
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: [
        { bookings: { _count: "desc" } },
        { createdAt: "desc" },
      ],
    });

    const enriched = packages.map((pkg) => {
      const allReviews = pkg.trips?.flatMap((t) => t.reviews) || [];
      const reviewCount = allReviews.length;
      const avgRating = reviewCount > 0
        ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
        : 5.0;

      // Total keseluruhan orang yang memesan trip ini (kumulatif seluruh batch/riwayat)
      const totalBookedPax = pkg.bookings.reduce((sum, b) => sum + (b.participantCount || 1), 0);

      const { trips, bookings, ...rest } = pkg;
      return {
        ...rest,
        rating: avgRating,
        reviewCount,
        totalBookedPax,
        totalBookings: totalBookedPax,
      };
    });

    // Urutkan dari yang paling banyak dipesan ke yang paling sedikit
    enriched.sort((a: any, b: any) => {
      const bPax = (b.totalBookedPax || 0) - (a.totalBookedPax || 0);
      if (bPax !== 0) return bPax;
      const bBookings = (b._count?.bookings || 0) - (a._count?.bookings || 0);
      if (bBookings !== 0) return bBookings;
      const bReviews = (b.reviewCount || 0) - (a.reviewCount || 0);
      if (bReviews !== 0) return bReviews;
      const bRating = (b.rating || 0) - (a.rating || 0);
      if (bRating !== 0) return bRating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return enriched as unknown as PackageData[];
  } catch (error) {
    console.error("Error fetching featured packages:", error);
    return [];
  }
}

export default async function HomePage() {
  const packages = await getFeaturedPackages();

  const destinations = [
    { name: "Labuan Bajo", desc: "Taman Nasional Komodo & Pink Beach", image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600" },
    { name: "Bromo & Ijen", desc: "Sunrise Vulkanik & Api Biru", image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=600" },
    { name: "Raja Ampat", desc: "Surga Karst & Laut Dunia", image: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=600" },
    { name: "Nusa Penida", desc: "Tebing Ikonik & Manta Ray Bali", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600" },
    { name: "Yogyakarta", desc: "Candi Agung & Offroad Merapi", image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600" },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-bg.png"
            alt="Wisata Terpadu Indonesia"
            className="w-full h-full object-cover animate-in fade-in duration-1000 opacity-90"
          />
          {/* Subtle overlay agar teks tetap terbaca */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-md mb-6 shadow-lg shadow-emerald-900/20">
            <span>TripKu — Platform Wisata Terpadu Multi-Vendor</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Jelajahi Dunia Bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-300">TripKu</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            Temukan dan bandingkan paket perjalanan dari agen travel resmi. Didukung Tour Guide berlisensi, armada transportasi terverifikasi, dan koordinasi Trip Room terpadu.
          </p>

          {/* Quick Search Card */}
          <div className="mt-8 sm:mt-10 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl max-w-4xl text-slate-800">
            <form action="/explore" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2 relative">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Cari Destinasi atau Paket
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Contoh: Labuan Bajo, Bromo, Raja Ampat..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100/80 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Durasi Perjalanan
                </label>
                <select
                  name="duration"
                  className="w-full py-2 px-3 bg-slate-100/80 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="ALL">Semua Durasi</option>
                  <option value="1">1 Hari (One Day Tour)</option>
                  <option value="2">2 Hari 1 Malam</option>
                  <option value="3">3 Hari 2 Malam</option>
                  <option value="4">4+ Hari</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 hover:gap-3"
                >
                  <span>Cari Paket</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Key Value Props Pill */}
          <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-10 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-Vendor Resmi Terverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Trip Room Koordinasi Langsung</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pemandu & Driver Khusus Perjalanan</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Popular Destinations */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Destinasi Favorit
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Jelajahi Lokasi Wisata Populer
              </h2>
            </div>
            <Link
              href="/explore"
              className="mt-2 sm:mt-0 text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
            >
              <span>Lihat Semua Destinasi</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {destinations.map((dest) => (
              <Link
                key={dest.name}
                href={`/explore?search=${encodeURIComponent(dest.name)}`}
                className="group relative h-56 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 block"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-sm sm:text-base leading-tight group-hover:text-emerald-300 transition-colors">
                    {dest.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {dest.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Packages Grid */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Pilihan Terbaik
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Paket Wisata Terpadu Unggulan
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Pesan langsung dengan alur booking transparan, data peserta terlindungi, dan verifikasi bukti bayar.
              </p>
            </div>
            <Link
              href="/explore"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-emerald-500 transition-colors shadow-2xs"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </Link>
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Paket wisata sedang dipersiapkan.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Core Features & Ecosystem Walkthrough */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
              Mengapa Sistem Informasi Layanan Wisata Terpadu?
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Menyatukan seluruh pihak yang terlibat dalam perjalanan pariwisata agar koordinasi berjalan mulus dari awal hingga akhir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Multi-Vendor Terverifikasi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap agensi travel melalui proses verifikasi dokumen izin usaha resmi oleh Admin Sistem sebelum dapat mempublikasikan paket wisata.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Penugasan Guide & Driver
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Agensi travel menugaskan Tour Guide berlisensi dan Driver pariwisata secara digital dengan transparansi nominal fee dan konfirmasi tugas instan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Trip Room Terintegrasi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ruang informasi khusus peserta perjalanan untuk memantau titik kumpul, instruksi persiapan barang bawaan, dan update penting tanpa distraksi obrolan bebas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Join as Partner */}
      <section className="py-14 sm:py-20 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Apakah Anda Pengelola Travel, Tour Guide, atau Driver Wisata?
            </h2>
            <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
              Bergabunglah ke ekosistem terpadu kami untuk memperluas jangkauan pasar wisatawan dan mengelola penugasan perjalanan secara profesional.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register?role=TRAVEL"
              className="px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-lg transition-all"
            >
              Daftar Sebagai Travel
            </Link>
            <Link
              href="/register?role=GUIDE"
              className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-500 transition-all"
            >
              Gabung Tour Guide / Driver
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
