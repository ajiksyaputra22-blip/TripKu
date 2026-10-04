"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  Briefcase,
  Users,
  CreditCard,
  Compass,
  ArrowRight,
  Plus,
  TrendingUp,
  Download,
  Package,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  MessageCircle,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import UnifiedAssignCrewModal from "@/components/UnifiedAssignCrewModal";
import TravelPackageDetailPage from "./detail";

function TravelDashboardContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Package expansion / detail view state
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [selectedPackageDetailId, setSelectedPackageDetailId] = useState<string | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<string | undefined>(undefined);

  // Read URL search params to auto-open package detail (e.g., from notification link)
  const searchParams = useSearchParams();
  useEffect(() => {
    const pkgId = searchParams.get("packageId");
    const tab = searchParams.get("tab") ?? undefined;
    if (pkgId) {
      setInitialDetailTab(tab);
      setSelectedPackageDetailId(pkgId);
    }
  }, [searchParams]);

  // Crew Assignment Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTripForAssign, setSelectedTripForAssign] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Fetch analytics error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Render Full Detail Page from detail.tsx when a package is selected
  if (selectedPackageDetailId) {
    return (
      <TravelPackageDetailPage
        packageId={selectedPackageDetailId}
        initialTab={initialDetailTab}
        onBack={() => {
          setSelectedPackageDetailId(null);
          setInitialDetailTab(undefined);
          fetchAnalytics();
        }}
      />
    );
  }

  const kpi = data?.kpi || {
    totalBookings: 0,
    confirmedBookingsCount: 0,
    totalRevenue: 0,
    totalParticipants: 0,
    activeTripsCount: 0,
    totalPackages: 0,
  };

  const handleOpenAssignModal = (trip: any) => {
    setSelectedTripForAssign(trip);
    setAssignModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Profile Incomplete Overlay */}
        {data?.verificationStatus !== "APPROVED" ? (
          <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Perusahaan Travel Belum Terverifikasi</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Untuk dapat menggunakan seluruh fitur agen travel (tambah paket, kelola booking), Anda wajib melengkapi profil perusahaan, rekening bank, dan mengunggah dokumen Surat Izin Usaha untuk diverifikasi oleh Admin Sistem.
            </p>
            <Link href="/travel/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md">
              <Briefcase className="w-4 h-4" />
              Lengkapi Profil Perusahaan
            </Link>
          </div>
        ) : (
          <>
            {/* ─── Page Heading ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-3">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Travel Provider Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Pusat Kendali Operasional
                </h1>
                <p className="text-sm text-slate-500 mt-1 max-w-lg">
                  Pantau omset bisnis, kelola rombongan wisatawan paket destinasi, serta koordinasi kru perjalanan.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap sm:shrink-0">
                <Link
                  href="/travel/reports"
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tarik Laporan</span>
                </Link>
                <Link
                  href="/travel/payments"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Verifikasi Bayar</span>
                </Link>
                <Link
                  href="/travel/packages"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Paket</span>
                </Link>
              </div>
            </div>

            {/* ─── KPI Section — asymmetric hierarchy ───────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-8">

              {/* Revenue — dominant card */}
              <div className="sm:col-span-5 bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden min-h-[150px]">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">
                    Total Omset Terkonfirmasi
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md text-emerald-300 flex items-center justify-center border border-white/10 shadow-inner">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none text-white">
                    {formatRupiah(kpi.totalRevenue)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-200 font-medium">
                      {kpi.confirmedBookingsCount} pesanan terverifikasi lunas / DP
                    </span>
                  </div>
                </div>
              </div>

              {/* Right — 3 compact KPIs */}
              <div className="sm:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Pemesanan</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{kpi.totalBookings}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Total pesanan masuk</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Wisatawan Terdaftar</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{kpi.totalParticipants}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Total pax peserta</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Paket & Trip Aktif</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-slate-900">{kpi.activeTripsCount}</div>
                    <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Perjalanan berjalan / siap</span>
                  </div>
                </div>

              </div>
            </div>

            {/* ─── Paket Destinasi & Operasional Perjalanan ──────── */}
            <div className="mb-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <span>Konsolidasi</span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Paket Destinasi & Perjalanan Wisata Anda</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Setiap paket mengumpulkan seluruh wisatawan/pemesan yang mendaftar pada jadwal & destinasi yang sama beserta fitur koordinasi Trip Room dan penugasan kru.
                  </p>
                </div>

                <Link
                  href="/travel/packages"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
                >
                  <span>Kelola Katalog Paket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6">
                {data?.packages && data.packages.length > 0 ? (
                  <div className="space-y-6">
                    {[...data.packages]
                      .sort((a: any, b: any) => {
                        const getRank = (pkg: any) => {
                          // Gunakan status dari database sebagai sumber kebenaran utama
                          if (pkg.status === "COMPLETED") return 3; // SELESAI (paling bawah)
                          if (pkg.status === "INACTIVE") return 2; // INACTIVE (tengah)
                          return 1; // PUBLISHED / ACTIVE (paling atas)
                        };
                        const rankA = getRank(a);
                        const rankB = getRank(b);
                        if (rankA !== rankB) return rankA - rankB;
                        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                      })
                      .map((pkg: any) => {
                      const isExpanded = expandedPackageId === pkg.id;

                      // Gunakan status dari database sebagai sumber kebenaran utama
                      // Paket yang di-reactivate dari COMPLETED ke PUBLISHED harus tampil sebagai AKTIF
                      const isCompleted = pkg.status === "COMPLETED";
                      const isInactive = pkg.status === "INACTIVE";

                      const badge = isCompleted
                        ? { label: "SELESAI", cls: "bg-slate-100 text-slate-600 border border-slate-200" }
                        : isInactive
                          ? { label: "NONAKTIF", cls: "bg-rose-50 text-rose-600 border border-rose-200" }
                          : { label: "AKTIF", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };

                      // Hitung penumpang dari capacity - quotaLeft (sudah di-reset ke capacity saat reactivate)
                      const paxFilled = Math.max(0, pkg.capacity - (pkg.quotaLeft !== undefined && pkg.quotaLeft !== null ? pkg.quotaLeft : pkg.capacity));
                      const fillPercent = Math.min(100, Math.round((paxFilled / pkg.capacity) * 100));

                      const primaryTrip = pkg.trips?.[0];
                      const guide = primaryTrip?.assignments
                        ?.filter((a: any) => a.role === "GUIDE")
                        ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
                      const driver = primaryTrip?.assignments
                        ?.filter((a: any) => a.role === "DRIVER")
                        ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
                      const guideAccepted = guide?.status === "ACCEPTED";
                      const driverAccepted = driver?.status === "ACCEPTED";

                      return (
                        <div
                          key={pkg.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${isExpanded
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-white"
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs"
                            }`}
                        >
                          {/* Package Summary Header Card */}
                          <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <img
                                src={pkg.coverImage || "/placeholder-travel.jpg"}
                                alt={pkg.name}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-slate-100 shadow-xs"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                    {pkg.destination}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                </div>

                                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight line-clamp-1">
                                  {pkg.name}
                                </h3>

                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                                  <span>Keberangkatan: <strong className="text-slate-700 font-bold">{formatDate(pkg.departureDate)}</strong></span>
                                  <span>{pkg.durationDays} Hari</span>
                                  <span>{pkg.vehicle}</span>
                                  <span className="font-extrabold text-emerald-700">{formatRupiah(pkg.price)} / pax</span>
                                </div>

                                {/* Quota Progress */}
                                <div className="mt-3 max-w-md">
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-semibold text-slate-600">Wisatawan Terkumpul dalam Rombongan:</span>
                                    <span className="font-bold text-emerald-800 font-mono">{paxFilled} / {pkg.capacity} Pax ({fillPercent}%)</span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${fillPercent >= 100 ? "bg-emerald-600" : "bg-emerald-500"
                                        }`}
                                      style={{ width: `${fillPercent}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons on right */}
                            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-center gap-2.5 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                              <button
                                onClick={() => setExpandedPackageId(isExpanded ? null : pkg.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${isExpanded
                                  ? "bg-emerald-700 text-white shadow-emerald-700/20"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  }`}
                              >
                                <Users className="w-4 h-4" />
                                <span>{isExpanded ? "Tutup Data Pemesan" : `Lihat (${pkg.bookings?.length || 0}) Pemesan & Operasional`}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              <button
                                onClick={() => setSelectedPackageDetailId(pkg.id)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                <span>Buka Detail Lengkap</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Section Rombongan Wisatawan & Operasional */}
                          {isExpanded && (
                            <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-6 animate-in fade-in zoom-in-98 duration-200">

                              {/* Grid 2 Column: Left = Customer List, Right = Operational & Crew */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                {/* Left Column (Lg: 7): Customer & Booking List */}
                                <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                                  {(() => {
                                    // Relasi: Trip memiliki bookingId (bukan Booking memiliki tripId)
                                    // Ambil bookingId dari trip yang sedang aktif (SCHEDULED/ONGOING)
                                    const activeBookingIds = new Set(
                                      (pkg.trips || [])
                                        .filter((t: any) => t.status === "SCHEDULED" || t.status === "ONGOING")
                                        .map((t: any) => t.bookingId)
                                        .filter(Boolean)
                                    );

                                    // Jika paket PUBLISHED (termasuk yg baru direaktivasi), hanya tampilkan
                                    // booking yang terhubung ke trip aktif. Jika tidak ada trip aktif dengan booking,
                                    // berarti paket baru saja direaktivasi dan belum ada pemesan baru → list kosong.
                                    const relevantBookings = pkg.status === "PUBLISHED"
                                      ? (pkg.bookings || []).filter((b: any) => activeBookingIds.has(b.id))
                                      : (pkg.bookings || []);

                                    // Flatten all participants from relevant bookings for this package
                                    const allParticipants: Array<{
                                      id: string;
                                      name: string;
                                      nik?: string;
                                      bookingCode: string;
                                      bookingStatus: string;
                                      customerName: string;
                                      customerPhone?: string;
                                    }> = [];

                                    relevantBookings.forEach((b: any) => {
                                      if (b.participants && b.participants.length > 0) {
                                        b.participants.forEach((p: any) => {
                                          allParticipants.push({
                                            id: p.id,
                                            name: p.name,
                                            nik: p.nik,
                                            bookingCode: b.bookingCode,
                                            bookingStatus: b.status,
                                            customerName: b.customer?.name || "—",
                                            customerPhone: b.customer?.phone,
                                          });
                                        });
                                      } else {
                                        // Fallback: booking has no participants listed — show pemesan itself
                                        allParticipants.push({
                                          id: b.id,
                                          name: b.customer?.name || "Pemesan",
                                          nik: undefined,
                                          bookingCode: b.bookingCode,
                                          bookingStatus: b.status,
                                          customerName: b.customer?.name || "—",
                                          customerPhone: b.customer?.phone,
                                        });
                                      }
                                    });

                                    return (
                                      <>
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                          <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                              <Users className="w-4 h-4 text-emerald-600" />
                                              <span>Daftar Wisatawan ({allParticipants.length} Orang)</span>
                                            </h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                              {pkg.status === "PUBLISHED"
                                                ? "Wisatawan yang terdaftar pada perjalanan aktif saat ini."
                                                : "Semua wisatawan dari seluruh booking pada paket ini."}
                                            </p>
                                          </div>
                                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                            {relevantBookings.length} Booking
                                          </span>
                                        </div>

                                        {allParticipants.length > 0 ? (
                                          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                                            {allParticipants.map((p, idx) => {
                                              const badge = getStatusBadge(p.bookingStatus);
                                              const waUrl = formatWhatsAppUrl(
                                                p.customerPhone,
                                                `Halo ${p.customerName}, saya dari Admin Travel mengenai pemesanan paket ${pkg.name} (Kode: ${p.bookingCode}).`
                                              );
                                              return (
                                                <div
                                                  key={`${p.id}-${idx}`}
                                                  className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex items-center justify-between gap-3"
                                                >
                                                  <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                                                      {idx + 1}
                                                    </div>
                                                    <div className="min-w-0 space-y-0.5">
                                                      <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                                                      <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                                          {p.bookingCode}
                                                        </span>
                                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${badge.className}`}>
                                                          {badge.label}
                                                        </span>
                                                        {p.nik && (
                                                          <span className="text-[10px] text-slate-400">NIK: {p.nik}</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {p.customerPhone ? (
                                                    <a
                                                      href={waUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-xs transition-all shrink-0"
                                                      title="Hubungi via WhatsApp"
                                                    >
                                                      <MessageCircle className="w-3 h-3" />
                                                      <span className="hidden sm:inline">WA</span>
                                                    </a>
                                                  ) : (
                                                    <span className="text-[10px] text-slate-300 italic shrink-0">—</span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            Belum ada wisatawan terdaftar untuk paket ini.
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Right Column (Lg: 5): Operational Controls & Kru */}
                                <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                      <Compass className="w-4 h-4 text-purple-600" />
                                      <span>Operasional & Penugasan Kru</span>
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${primaryTrip?.status === "ONGOING"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                      }`}>
                                      {primaryTrip?.status === "ONGOING" ? "Sedang Berjalan" : primaryTrip?.status || "Terjadwal"}
                                    </span>
                                  </div>

                                  {/* Location tracking status if ongoing */}
                                  {primaryTrip && (
                                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                                      <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Lokasi Terkini Perjalanan:</span>
                                        </span>
                                      </div>
                                      <p className="font-semibold text-emerald-950 truncate">
                                        {primaryTrip.currentLocation || "Belum ada pembaruan lokasi dari kru."}
                                      </p>
                                    </div>
                                  )}

                                  {/* Crew Status List */}
                                  <div className="space-y-2 text-xs">
                                    {/* Tour Guide */}
                                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${guideAccepted
                                      ? "border-emerald-200 bg-emerald-50/60"
                                      : guide
                                        ? "border-amber-200 bg-amber-50/60"
                                        : "border-slate-100 bg-slate-50"
                                      }`}>
                                      <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Tour Guide</span>
                                        {guideAccepted ? (
                                          <span className="font-bold text-emerald-800">🧑‍💼 {guide.worker?.name}</span>
                                        ) : guide ? (
                                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                            Menunggu Konfirmasi Kru
                                          </span>
                                        ) : (
                                          <span className="font-semibold text-slate-500">Belum Ditugaskan</span>
                                        )}
                                      </div>
                                      {guide && (
                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${guideAccepted
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                          : guide.status === "NEGOTIATING"
                                            ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                                            : guide.status === "REJECTED"
                                              ? "bg-rose-100 text-rose-700 border-rose-200"
                                              : "bg-slate-100 text-slate-600 border-slate-200"
                                          }`}>
                                          {guideAccepted ? "Diterima" : guide.status === "NEGOTIATING" ? "💬 Negosiasi" : guide.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                                        </span>
                                      )}
                                    </div>

                                    {/* Driver */}
                                    <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${driverAccepted
                                      ? "border-emerald-200 bg-emerald-50/60"
                                      : driver
                                        ? "border-amber-200 bg-amber-50/60"
                                        : "border-slate-100 bg-slate-50"
                                      }`}>
                                      <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Driver Wisata</span>
                                        {driverAccepted ? (
                                          <span className="font-bold text-emerald-800">🚘 {driver.worker?.name}</span>
                                        ) : driver ? (
                                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                            Menunggu Konfirmasi Kru
                                          </span>
                                        ) : (
                                          <span className="font-semibold text-slate-500">Belum Ditugaskan</span>
                                        )}
                                      </div>
                                      {driver && (
                                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${driverAccepted
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                          : driver.status === "NEGOTIATING"
                                            ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse"
                                            : driver.status === "REJECTED"
                                              ? "bg-rose-100 text-rose-700 border-rose-200"
                                              : "bg-slate-100 text-slate-600 border-slate-200"
                                          }`}>
                                          {driverAccepted ? "Diterima" : driver.status === "NEGOTIATING" ? "💬 Negosiasi" : driver.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Operational Action Buttons */}
                                  <div className="grid grid-cols-2 gap-2 pt-2">
                                    {primaryTrip ? (
                                      <>
                                        <Link
                                          href={`/customer/trip-room/${primaryTrip.id}`}
                                          className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          <span>Trip Room</span>
                                        </Link>

                                        {/* Smart Tugaskan Kru Button */}
                                        {(() => {
                                          const allAccepted = guideAccepted && driverAccepted;
                                          const bothRejected = guide?.status === "REJECTED" && driver?.status === "REJECTED";
                                          const anyRejected = guide?.status === "REJECTED" || driver?.status === "REJECTED";

                                          let buttonLabel = "Tugaskan Kru";
                                          let buttonTitle = "Tugaskan kru untuk perjalanan ini";

                                          if (allAccepted) {
                                            buttonLabel = "Penugasan Selesai";
                                            buttonTitle = "Semua kru telah menerima penugasan perjalanan";
                                          } else if (bothRejected) {
                                            buttonLabel = "Ulangi Cari Kru";
                                            buttonTitle = "Kedua calon kru menolak penawaran, wajib mengulang mencari kru kembali";
                                          } else if (guide?.status === "REJECTED") {
                                            buttonLabel = "Cari Tour Guide";
                                            buttonTitle = "Tour Guide menolak penawaran, cari 1 Tour Guide pengganti";
                                          } else if (driver?.status === "REJECTED") {
                                            buttonLabel = "Cari Driver";
                                            buttonTitle = "Driver menolak penawaran, cari 1 Driver pengganti";
                                          }

                                          return (
                                            <button
                                              onClick={() => !allAccepted && handleOpenAssignModal(primaryTrip)}
                                              disabled={allAccepted}
                                              title={buttonTitle}
                                              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${allAccepted
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60"
                                                : anyRejected
                                                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                                                  : "bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
                                                }`}
                                            >
                                              {allAccepted ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5" /><span>{buttonLabel}</span></>
                                              ) : anyRejected ? (
                                                <><UserCheck className="w-3.5 h-3.5" /><span>{buttonLabel}</span></>
                                              ) : (
                                                <><UserCheck className="w-3.5 h-3.5 text-emerald-400" /><span>{buttonLabel}</span></>
                                              )}
                                            </button>
                                          );
                                        })()}
                                      </>
                                    ) : (
                                      <Link
                                        href="/travel/trips"
                                        className="col-span-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                                      >
                                        <Compass className="w-3.5 h-3.5" />
                                        <span>Buka Manajemen Trip & Kru</span>
                                      </Link>
                                    )}
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-xs">
                      <Package className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500">Belum ada paket wisata aktif</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      Buat paket destinasi baru .
                    </p>
                    <Link
                      href="/travel/packages"
                      className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Paket Wisata Baru</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Operational Overview — asymmetric 2-column ───────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left (wider) — Pemesanan Terbaru */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">Pemesanan Terbaru</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Daftar booking masuk yang terikat ke akun agensi Anda</p>
                  </div>
                  <Link href="/travel/payments" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    <span>Kelola Pembayaran</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-6">
                  {data?.recentBookings && data.recentBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3">Kode / Pemesan</th>
                            <th className="pb-3">Paket Wisata</th>
                            <th className="pb-3">Total</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {data.recentBookings.map((b: any) => {
                            const badge = getStatusBadge(b.status);
                            return (
                              <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3">
                                  <div className="font-mono font-bold text-slate-900">{b.bookingCode}</div>
                                  <div className="text-[11px] text-slate-500 font-medium">{b.customer?.name}</div>
                                  {b.customer?.phone && (
                                    <a
                                      href={formatWhatsAppUrl(b.customer.phone, `Halo ${b.customer.name}, saya dari admin travel TripKu.`)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline mt-0.5"
                                      title="Chat WhatsApp Customer"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{b.customer.phone}</span>
                                    </a>
                                  )}
                                </td>
                                <td className="py-3 font-medium text-slate-700 max-w-[180px] truncate">
                                  {b.package.name}
                                </td>
                                <td className="py-3 font-extrabold text-slate-900">
                                  {formatRupiah(b.totalPrice)}
                                </td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <Link href="/travel/payments" className="text-emerald-700 font-bold hover:underline">
                                    Tinjau
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <CalendarDays className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-400">Belum ada pemesanan masuk</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Booking customer milik akun travel Anda akan dipopulasikan di sini.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right — Paket Terpopuler */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Paket Terpopuler
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Berdasarkan pemesan terdaftar</p>
                  </div>
                  <Link href="/travel/packages" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                    <span>Kelola</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-6">
                  {data?.popularPackages && data.popularPackages.length > 0 ? (
                    <div className="space-y-1">
                      {data.popularPackages.map((p: any, idx: number) => (
                        <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${idx === 0 ? "bg-emerald-600 text-white" :
                              idx === 1 ? "bg-slate-200 text-slate-700" :
                                "bg-slate-100 text-slate-500"
                              }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</div>
                              <span className="text-[10px] text-slate-400">{formatRupiah(p.price)}</span>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg shrink-0">
                            {p.bookingCount}×
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400">Belum ada data paket populer</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Statistik akan muncul setelah ada booking masuk.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>



            {/* Modal Penugasan Kru */}
            {selectedTripForAssign && (
              <UnifiedAssignCrewModal
                isOpen={assignModalOpen}
                onClose={() => {
                  setAssignModalOpen(false);
                  setSelectedTripForAssign(null);
                }}
                trip={selectedTripForAssign}
                onSuccess={() => {
                  fetchAnalytics();
                }}
              />
            )}

          </>
        )}
      </div>
    </div>
  );
}

export default function TravelDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-sm text-slate-400">Memuat dashboard...</div></div>}>
      <TravelDashboardContent />
    </Suspense>
  );
}
