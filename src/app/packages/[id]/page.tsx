import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  Calendar,
  Car,
  Hotel,
  Check,
  Star,
  ArrowRight,
  Phone,
  CreditCard,
  MessageSquareQuote
} from "lucide-react";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { id } = await params;

  const pkg = await prisma.package.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      travel: true,
    },
  });

  if (!pkg) {
    notFound();
  }

  // Reviews hanya untuk paket ini (via trip.packageId) — TIDAK ada fallback ke travel
  const reviews = await prisma.review.findMany({
    where: {
      trip: { packageId: pkg.id },
    },
    include: {
      customer: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  // REQ-3.3: Rating Agensi — agregasi rating seluruh paket milik travel ini
  const agencyReviews = await prisma.review.findMany({
    where: { travelId: pkg.travelId },
    select: { rating: true },
  });
  const agencyAvgRating = agencyReviews.length > 0
    ? (agencyReviews.reduce((acc, r) => acc + r.rating, 0) / agencyReviews.length)
    : 5.0;
  const agencyTotalBookings = await prisma.booking.count({
    where: { package: { travelId: pkg.travelId } },
  });

  // Total keseluruhan orang yang memesan trip ini (kumulatif seluruh batch/riwayat)
  const packageBookings = await prisma.booking.findMany({
    where: {
      packageId: pkg.id,
      status: { not: "CANCELLED" },
    },
    select: {
      participantCount: true,
    },
  });
  const totalBookedPax = packageBookings.reduce((acc, b) => acc + (b.participantCount || 1), 0);

  let facilities: string[] = [];
  try {
    facilities = Array.isArray(pkg.facilities)
      ? pkg.facilities
      : JSON.parse(pkg.facilities);
  } catch {
    facilities = typeof pkg.facilities === "string" ? (pkg.facilities as string).split(",") : [];
  }

  // Parse Checkpoint Route
  let checkpointStops: string[] = [];
  if (pkg.checkpointRoute) {
    try {
      const parsed = JSON.parse(pkg.checkpointRoute);
      checkpointStops = Array.isArray(parsed) ? parsed : [];
    } catch {
      checkpointStops = typeof pkg.checkpointRoute === "string"
        ? (pkg.checkpointRoute as string).split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }
  }

  // DP calculation
  const hasDP = (pkg.dpPercentage || 0) > 0;
  const dpAmount = hasDP ? Math.ceil((pkg.price * pkg.dpPercentage) / 100) : 0;
  const pelunasanAmount = hasDP ? pkg.price - dpAmount : 0;

  const categoryLabels: Record<string, string> = {
    WISATA_ALAM: "🌿 Wisata Alam",
    PANTAI: "🏖️ Wisata Pantai & Bahari",
    GUNUNG: "⛰️ Wisata Pegunungan",
    KOTA: "🏙️ Wisata Kota & Urban",
    MUSEUM_BUDAYA: "🏛️ Budaya & Museum",
    RELIGI: "🕌 Religi & Sejarah",
    KULINER: "🍜 Kuliner Nusantara",
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-900">Beranda</Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-slate-900">Katalog</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">{pkg.name}</span>
        </div>

        {/* Hero Gallery & Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Main Cover Image */}
          <div className="lg:col-span-2 relative h-80 sm:h-96 rounded-3xl overflow-hidden shadow-lg bg-slate-200">
            <img
              src={pkg.coverImage}
              alt={pkg.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-xs font-bold shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pkg.durationDays} Hari Perjalanan</span>
                </div>
                {pkg.category && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-white/20 text-xs font-bold text-white shadow-sm">
                    {categoryLabels[pkg.category] || pkg.category}
                  </div>
                )}
                {avgRating ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-xs font-bold text-white shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>{avgRating} {reviews.length > 0 ? `(${reviews.length} Ulasan)` : ""}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-xs font-bold text-white shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>5.0</span>
                  </div>
                )}
                {totalBookedPax > 0 && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-700/90 text-xs font-bold text-white shadow-sm backdrop-blur-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>{totalBookedPax} Terpesan</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {pkg.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-200 mt-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{pkg.destination}</span>
                {pkg.originCity && (
                  <span className="text-xs text-slate-300">• Keberangkatan dari {pkg.originCity}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Booking Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Harga Resmi
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Tersedia
                </span>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                  {formatRupiah(pkg.price)}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ peserta</span>
              </div>

              {/* Status Kuota */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Sisa Kuota Tersedia:</span>
                <span className={`font-bold ${pkg.quotaLeft <= 5 ? "text-rose-600" : "text-emerald-700"}`}>
                  {pkg.quotaLeft} dari {pkg.capacity} Pax
                </span>
              </div>

              {/* Total Pemesan Kumulatif */}
              {totalBookedPax > 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Total Pemesan:
                  </span>
                  <span className="font-bold text-emerald-900">
                    {totalBookedPax} Terpesan (Semua Batch)
                  </span>
                </div>
              )}

              {/* Departure Date */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Jadwal Keberangkatan:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(pkg.departureDate)}
                </span>
              </div>

              {/* Travel Provider Pill */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {pkg.travel.logoUrl ? (
                    <img src={pkg.travel.logoUrl} alt={pkg.travel.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      {pkg.travel.businessName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>{pkg.travel.businessName}</span>
                    {pkg.travel.verificationStatus === "APPROVED" && (
                      <span title="Terverifikasi Resmi">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Mitra Travel Resmi</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-6">
              {(() => {
                const isPastH3 = new Date(pkg.departureDate).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000;
                const isInactive = pkg.status !== "PUBLISHED" || isPastH3;

                if (isInactive) {
                  return (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed text-center"
                    >
                      Pemesanan Ditutup (Batas Waktu H-3)
                    </button>
                  );
                }

                if (pkg.quotaLeft <= 0) {
                  return (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed text-center"
                    >
                      Kuota Habis
                    </button>
                  );
                }

                return (
                  <Link
                    href={`/packages/${pkg.slug || pkg.id}/book`}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Pesan Sekarang (Book Now)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                );
              })()}
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Pemesanan diproses instan dengan data peserta lengkap.
              </p>
            </div>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Information */}
          <div className="lg:col-span-2 space-y-8">

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Deskripsi Paket Wisata</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {pkg.description}
              </p>
            </div>

            {/* Facilities Included */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Fasilitas Termasuk</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {facilities.map((fac, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transport & Accommodation Specs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Akomodasi & Transportasi</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <Car className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Armada Transportasi
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {pkg.vehicle || "Armada Standar Pariwisata"}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <Hotel className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Akomodasi / Penginapan
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {pkg.accommodation || "Hotel / Penginapan Terpilih"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rute Titik Checkpoint (Itinerary Rute Perjalanan) */}
            {checkpointStops.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    Destinasi Perjalanan
                  </h2>
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
                    {checkpointStops.length} Titik Kunjungan
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Destinasi perjalanan resmi yang akan dikunjungi rombongan dan dilaporkan secara berkala oleh kru pendamping.
                </p>

                <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {checkpointStops.map((stop, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </div>
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex-1">
                        <span className="text-xs font-bold text-slate-900 block">{stop}</span>
                        <span className="text-[11px] text-slate-400">Titik Perjalanan Ke-{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Reviews */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Ulasan Wisatawan</h2>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{avgRating ? `${avgRating}${reviews.length > 0 ? ` (${reviews.length} Ulasan)` : ""}` : "5.0"}</span>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                            {rev.customer.name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-900">{rev.customer.name}</span>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic">
                        "{rev.comment}"
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-2">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Belum ada ulasan untuk paket ini.</p>
              )}
            </div>

          </div>

          {/* Sidebar Travel Details */}
          <div className="space-y-6">

            {/* Travel Info Card*/}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Tentang Agensi Penyelenggara
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                  {pkg.travel.logoUrl ? (
                    <img src={pkg.travel.logoUrl} alt={pkg.travel.businessName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                      {pkg.travel.businessName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{pkg.travel.businessName}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Terverifikasi Admin Sistem</span>
                  </div>
                </div>
              </div>

              {/* REQ-3.3: Agregasi rating agensi + total pemesan */}
              <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${agencyAvgRating && s <= Math.round(agencyAvgRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                      }`} />
                  ))}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-amber-700">
                    {agencyAvgRating ? agencyAvgRating.toFixed(1) : "—"}
                    <span className="text-[11px] font-normal text-slate-500 ml-1">/ 5.0</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {agencyReviews.length} ulasan • {agencyTotalBookings} pemesan
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {pkg.travel.description?.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, "").trim() || "Agensi perjalanan wisata resmi berpengalaman melayani rute domestik."}
              </p>

              {pkg.travel.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-700 font-medium py-2 border-t border-slate-100">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Kontak: {pkg.travel.phone}</span>
                </div>
              )}
            </div>

            {/* Payment Method Notice */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-5 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Metode Pembayaran Resmi</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed mb-2">
                Pembayaran dilakukan dengan transfer bank manual ke rekening resmi Travel:
              </p>
              <div className="bg-white/80 p-3 rounded-xl text-xs space-y-1">
                <div>Bank: <span className="font-bold">{pkg.travel.bankName || "BCA"}</span></div>
                <div>No. Rekening: <span className="font-mono font-bold">{pkg.travel.bankAccount || "8820192834"}</span></div>
                <div>Atas Nama: <span className="font-bold">{pkg.travel.bankHolder || pkg.travel.businessName}</span></div>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                *Bukti transfer diunggah setelah pemesanan dan diverifikasi langsung oleh pihak Travel.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
