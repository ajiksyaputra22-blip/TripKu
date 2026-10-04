"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Package,
  Users,
  CreditCard,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Bus,
  Star,
  TrendingUp,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { formatRupiah, formatDate, formatDateTime } from "@/lib/utils";

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    CONFIRMED: { label: "Terkonfirmasi", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    COMPLETED: { label: "Selesai", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Star className="w-3 h-3" /> },
    PENDING: { label: "Menunggu", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3" /> },
    CANCELLED: { label: "Dibatalkan", cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  };
  const b = map[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.cls}`}>
      {b.icon}{b.label}
    </span>
  );
}

function TripStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Terjadwal", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    ONGOING: { label: "Berlangsung", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    COMPLETED: { label: "Selesai", cls: "bg-slate-100 text-slate-600 border-slate-200" },
    CANCELLED: { label: "Dibatalkan", cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const b = map[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.cls}`}>
      {b.label}
    </span>
  );
}

function PkgStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PUBLISHED: { label: "AKTIF", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    INACTIVE: { label: "NONAKTIF", cls: "bg-rose-50 text-rose-600 border-rose-200" },
    COMPLETED: { label: "SELESAI", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const b = map[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 border-slate-200" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${b.cls}`}>
      {b.label}
    </span>
  );
}

export default function TravelBookingHistoryPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expandedPkgId, setExpandedPkgId] = useState<string | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/travel/booking-history")
      .then((r) => r.json())
      .then((d) => { setPackages(d.packages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = packages.filter((pkg) => {
    const matchSearch = !searchQuery ||
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === "ALL" || pkg.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    const rank = (s: string) => s === "COMPLETED" ? 0 : s === "PUBLISHED" ? 1 : 2;
    if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
    return new Date(b.departureDate || 0).getTime() - new Date(a.departureDate || 0).getTime();
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <Link href="/travel/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Riwayat Pemesanan</h1>
              <p className="text-sm text-slate-500 mt-1 max-w-xl">
                Arsip lengkap semua pemesanan paket wisata
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              {[
                { label: "Paket", value: packages.length },
                { label: "Total Booking", value: packages.reduce((a, p) => a + p.stats.totalBookings, 0), color: "emerald" },
                { label: "Total Pax", value: packages.reduce((a, p) => a + p.stats.totalPax, 0) },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-xs">
                  <div className={`text-xl font-extrabold ${s.color ? "text-emerald-700" : "text-slate-900"}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama paket atau destinasi…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            >
              <option value="ALL">Semua Status</option>
              <option value="PUBLISHED">Aktif</option>
              <option value="COMPLETED">Selesai</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Package List */}
        {sorted.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-700 mb-1">Belum Ada Riwayat</h3>
            <p className="text-sm text-slate-400">Belum ada paket wisata atau pemesanan yang tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((pkg) => {
              const isExpanded = expandedPkgId === pkg.id;
              return (
                <div key={pkg.id} className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${isExpanded ? "border-emerald-400 ring-2 ring-emerald-400/15" : "border-slate-200 hover:border-emerald-200"}`}>

                  {/* Package Header */}
                  <button
                    onClick={() => { setExpandedPkgId(isExpanded ? null : pkg.id); setExpandedCycleId(null); }}
                    className="w-full text-left p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <img
                        src={pkg.coverImage || "/placeholder-travel.jpg"}
                        alt={pkg.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-slate-100"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            {pkg.destination}
                          </span>
                          <PkgStatusBadge status={pkg.status} />
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight truncate">{pkg.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(pkg.departureDate)}</span>
                          <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5" />{pkg.vehicle}</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(pkg.price)}/pax</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap md:flex-nowrap">
                      {[
                        { label: "Booking", value: pkg.stats.totalBookings },
                        { label: "Pax", value: pkg.stats.totalPax },
                        { label: "Omset Lunas", value: formatRupiah(pkg.stats.totalRevenue), wide: true, green: true },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-0">
                          {i > 0 && <div className="w-px h-8 bg-slate-100 mx-3 hidden md:block" />}
                          <div className="text-center">
                            <div className={`text-lg font-extrabold ${s.green ? "text-emerald-700" : "text-slate-900"} ${s.wide ? "whitespace-nowrap" : ""}`}>{s.value}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{s.label}</div>
                          </div>
                        </div>
                      ))}
                      <div className="w-px h-8 bg-slate-100 mx-1 hidden md:block" />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 sm:p-6 space-y-5 bg-slate-50/40">

                      {/* Mini stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: "Total Booking", value: pkg.stats.totalBookings, icon: <Package className="w-4 h-4" />, bg: "bg-blue-50 text-blue-600" },
                          { label: "Terkonfirmasi", value: pkg.stats.confirmedBookings, icon: <CheckCircle2 className="w-4 h-4" />, bg: "bg-emerald-50 text-emerald-600" },
                          { label: "Total Pax", value: pkg.stats.totalPax, icon: <Users className="w-4 h-4" />, bg: "bg-amber-50 text-amber-600" },
                          { label: "Siklus Trip", value: pkg.tripCycles.length, icon: <TrendingUp className="w-4 h-4" />, bg: "bg-purple-50 text-purple-600" },
                        ].map((s) => (
                          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>{s.icon}</div>
                            <div>
                              <div className="text-base font-extrabold text-slate-900">{s.value}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{s.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Trip cycles */}
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                          <History className="w-3.5 h-3.5" />
                          Siklus Perjalanan ({pkg.tripCycles.length})
                        </h4>

                        {pkg.tripCycles.length === 0 ? (
                          <div className="text-center py-8 text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
                            Belum ada siklus perjalanan untuk paket ini.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {pkg.tripCycles.map((cycle: any) => {
                              const isCycleOpen = expandedCycleId === cycle.tripId;
                              const booking = cycle.booking;
                              return (
                                <div key={cycle.tripId} className={`bg-white rounded-xl border transition-all overflow-hidden ${isCycleOpen ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200 hover:border-slate-300"}`}>
                                  <button
                                    onClick={() => setExpandedCycleId(isCycleOpen ? null : cycle.tripId)}
                                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-emerald-700" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm font-extrabold text-slate-900">{formatDate(cycle.scheduleDate)}</span>
                                          <TripStatusBadge status={cycle.tripStatus} />
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          {cycle.destination} · {cycle.vehicle || pkg.vehicle}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="text-right">
                                        <div className="text-sm font-extrabold text-slate-900">
                                          {booking ? `${booking.participantCount} Pax` : "—"}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-semibold">
                                          {booking ? formatRupiah(booking.totalPrice) : "Belum ada booking"}
                                        </div>
                                      </div>
                                      {isCycleOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                  </button>

                                  {isCycleOpen && (
                                    <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                                      {!booking ? (
                                        <div className="text-center py-6 text-sm text-slate-400">Tidak ada booking yang terhubung ke siklus perjalanan ini.</div>
                                      ) : (
                                        <>
                                          {/* Booking meta */}
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-700 font-bold">{booking.bookingCode}</span>
                                            <BookingStatusBadge status={booking.status} />
                                            <span className="text-xs text-slate-500">Dipesan {formatDateTime(booking.createdAt)}</span>
                                          </div>

                                          {/* Pemesan */}
                                          <div className="bg-white rounded-xl border border-slate-200 p-4">
                                            <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                              <User className="w-3.5 h-3.5" /> Pemesan
                                            </h5>
                                            <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                                              <span className="text-sm font-bold text-slate-900">{booking.customer?.name}</span>
                                              {booking.customer?.email && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{booking.customer.email}</span>
                                              )}
                                              {booking.customer?.phone && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{booking.customer.phone}</span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Wisatawan */}
                                          {booking.participants?.length > 0 && (
                                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" /> Daftar Wisatawan ({booking.participants.length} Orang)
                                              </h5>
                                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {booking.participants.map((p: any, idx: number) => (
                                                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                                                    <div className="min-w-0 flex-1">
                                                      <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                                                      {p.identityNumber && (
                                                        <div className="text-[10px] text-slate-400">NIK: {p.identityNumber}</div>
                                                      )}
                                                    </div>
                                                    {p.phone && (
                                                      <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                                                        <Phone className="w-3 h-3" />{p.phone}
                                                      </span>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {/* Pembayaran */}
                                          {booking.payments?.length > 0 && (
                                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                                <CreditCard className="w-3.5 h-3.5" /> Riwayat Pembayaran
                                              </h5>
                                              <div className="space-y-2">
                                                {booking.payments.map((pay: any) => (
                                                  <div key={pay.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                                                    <div>
                                                      <div className="text-xs font-bold text-slate-900">{formatRupiah(pay.amount)}</div>
                                                      <div className="text-[10px] text-slate-400">
                                                        {pay.paymentType === "DP" ? "Uang Muka (DP)" : "Pelunasan"} · {pay.method}
                                                      </div>
                                                    </div>
                                                    <div className="text-right">
                                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pay.status === "VERIFIED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                                        {pay.status === "VERIFIED" ? "Terverifikasi" : "Menunggu"}
                                                      </span>
                                                      <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(pay.paymentDate)}</div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Standalone bookings */}
                      {pkg.standaloneBookings?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                            <Package className="w-3.5 h-3.5" /> Booking Lainnya ({pkg.standaloneBookings.length})
                          </h4>
                          <div className="space-y-2">
                            {pkg.standaloneBookings.map((b: any) => (
                              <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-mono text-xs text-slate-700 font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">{b.bookingCode}</span>
                                    <BookingStatusBadge status={b.status} />
                                  </div>
                                  <div className="text-xs text-slate-600 font-semibold">{b.customer?.name}</div>
                                  <div className="text-[10px] text-slate-400">{formatDateTime(b.createdAt)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-extrabold text-slate-900">{b.participantCount} Pax</div>
                                  <div className="text-xs text-emerald-700 font-bold">{formatRupiah(b.totalPrice)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
