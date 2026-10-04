"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  Users,
  MapPin,
  Calendar,
  UserPlus,
  MessageSquare,
  CreditCard,
  Check,
  ArrowLeft,
  X,
  Car,
  Navigation,
  ChevronDown,
  ChevronUp,
  Radio,
  MessageCircle,
  Clock,
  Upload,
  FileText
} from "lucide-react";

import UnifiedAssignCrewModal from "@/components/UnifiedAssignCrewModal";
import { useToast } from "@/components/Toast";

export default function TravelTripsPage() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTripCheckpoints, setExpandedTripCheckpoints] = useState<Record<string, boolean>>({});

  // Unified Assignment modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");


  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      const data = await res.json();
      setTrips(data.trips || []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const toggleCheckpoints = (tripId: string) => {
    setExpandedTripCheckpoints((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  const openAssignModal = (trip: any) => {
    setSelectedTrip(trip);
    setAssignModalOpen(true);
  };

  // REQ-5.3: Upload bukti bayar fee dulu, baru status jadi WAITING_CONFIRMATION
  const [payFeeModalOpen, setPayFeeModalOpen] = useState(false);
  const [activeFeeId, setActiveFeeId] = useState<string | null>(null);
  const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
  const [payingFee, setPayingFee] = useState(false);

  const openPayFeeModal = (feeId: string) => {
    setActiveFeeId(feeId);
    setFeeProofFile(null);
    setPayFeeModalOpen(true);
  };

  const handlePayFee = async () => {
    if (!activeFeeId || !feeProofFile) {
      toast.warning("Wajib upload bukti transfer terlebih dahulu.");
      return;
    }
    setPayingFee(true);
    try {
      // Upload bukti bayar
      const formData = new FormData();
      formData.append("file", feeProofFile);
      formData.append("folder", "fee-proofs");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload bukti bayar.");

      const res = await fetch(`/api/fees/${activeFeeId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: uploadData.url }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Bukti bayar berhasil diupload! Status fee: Menunggu Konfirmasi Kru.");
        setPayFeeModalOpen(false);
        fetchTrips();
      } else {
        toast.error(data.error || "Gagal memproses fee.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses fee.");
    } finally {
      setPayingFee(false);
    }
  };

  // REQ-5.3: Travel Admin merespons negosiasi fee kru
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const handleTravelRespond = async (assignmentId: string, action: "TRAVEL_ACCEPT_NEGOTIATION" | "TRAVEL_REJECT") => {
    setRespondingId(assignmentId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "TRAVEL_REJECT") {
          toast.info(data.message || "Tawaran kru telah ditolak.");
        } else {
          toast.success(data.message || "Tawaran fee kru berhasil disetujui!");
        }
        fetchTrips();
      } else {
        toast.error(data.error || "Gagal merespons negosiasi.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat merespons negosiasi.");
    } finally {
      setRespondingId(null);
    }
  };

  // REQ-6.2: Group trips by packageId for per-package display
  const filteredTrips = trips.filter((trip) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const customerName = trip.booking?.customer?.name?.toLowerCase() || "";
      const bookingCode = trip.booking?.bookingCode?.toLowerCase() || "";
      const packageName = trip.package?.name?.toLowerCase() || "";
      return customerName.includes(q) || bookingCode.includes(q) || packageName.includes(q);
    }
    return true;
  });

  // REQ-6.2: Group trips by packageId for per-package display
  const tripsByPackage = filteredTrips.reduce((acc: Record<string, { packageInfo: any; trips: any[] }>, trip) => {
    const pkgId = trip.package?.id || "unknown";
    if (!acc[pkgId]) {
      acc[pkgId] = { packageInfo: trip.package, trips: [] };
    }
    acc[pkgId].trips.push(trip);
    return acc;
  }, {});

  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  const togglePackage = (pkgId: string) => setExpandedPackages(p => ({ ...p, [pkgId]: !p[pkgId] }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <Link
          href="/travel/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Monitoring Perjalanan & Penugasan Kru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau dan monitor perjalanan per paket destinasi, tugaskan kru, dan respons negosiasi fee.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-full">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cari Customer / Paket / Kode Booking
              </label>
              <input
                type="text"
                placeholder="Ketik nama customer, paket, atau kode booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="self-end md:self-center px-3 py-2 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Trips List — REQ-6.2: Grouped per Paket */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-40 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(tripsByPackage).map(([pkgId, { packageInfo, trips: pkgTrips }]) => {
              const isExpanded = expandedPackages[pkgId] !== false; // default expanded
              const totalPax = pkgTrips.reduce((s, t) => s + (t.booking?.participantCount || 0), 0);
              const activeTrips = pkgTrips.filter(t => t.status === "ONGOING").length;

              return (
                <div key={pkgId} className="rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                  {/* Package Header */}
                  <button
                    onClick={() => togglePackage(pkgId)}
                    className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {packageInfo?.coverImage && (
                        <img src={packageInfo.coverImage} alt={packageInfo.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border-2 border-white/30" />
                      )}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-0.5">
                          {packageInfo?.destination} • {pkgTrips.length} Perjalanan
                        </div>
                        <div className="font-extrabold text-base sm:text-lg leading-tight">{packageInfo?.name}</div>
                        <div className="text-[11px] text-emerald-100 mt-0.5 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalPax} Pax Total</span>
                          {activeTrips > 0 && (
                            <span className="flex items-center gap-1 text-amber-200 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping inline-block" />
                              {activeTrips} Sedang Berlangsung
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-emerald-200 shrink-0" /> : <ChevronDown className="w-5 h-5 text-emerald-200 shrink-0" />}
                  </button>

                  {/* Per-Customer Trips inside this package */}
                  {isExpanded && (
                    <div className="bg-slate-50 divide-y divide-slate-100">
                      {pkgTrips.map((trip) => {
                        const badge = getStatusBadge(trip.status);

                        return (
                          <div
                            key={trip.id}
                            className="bg-white p-5 sm:p-6 hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                  {trip.booking && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-900">
                                        <span>👤 Customer: {trip.booking.customer?.name || "Customer"}</span>
                                        <span className="text-emerald-700 font-mono font-medium">({trip.booking.bookingCode} • {trip.booking.participantCount} Pax)</span>
                                      </div>
                                      {trip.booking.customer?.phone && (
                                        <a
                                          href={formatWhatsAppUrl(trip.booking.customer.phone, `Halo ${trip.booking.customer.name}, saya dari admin travel TripKu untuk perjalanan paket ${trip.package?.name}. Bagaimana kabar Anda?`)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-105"
                                          title="Hubungi langsung nomor WhatsApp Customer"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          <span>WA: {trip.booking.customer.phone}</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">{trip.package.name}</h2>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    {trip.destination}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    Keberangkatan: {formatDate(trip.scheduleDate)}
                                  </span>
                                  {trip.vehicle && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Car className="w-3.5 h-3.5 text-slate-400" />
                                        {trip.vehicle}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <Link
                                  href={`/customer/trip-room/${trip.id}`}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Buka Trip Room</span>
                                </Link>
                                <button
                                  onClick={() => openAssignModal(trip)}
                                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>Tugaskan Kru</span>
                                </button>
                              </div>
                            </div>

                            {/* Live Location Monitoring Banner — REQ-6.4 */}
                            {trip.status === "SCHEDULED" ? (
                              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5 flex items-center gap-3">
                                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-amber-800 block">Menunggu Keberangkatan</span>
                                  <span className="text-[11px] text-amber-700">Monitoring posisi hanya aktif setelah perjalanan dimulai oleh Tour Guide.</span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 mb-5 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-3.5 w-3.5 relative shrink-0">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
                                    </span>
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                                        Monitoring Posisi Wisatawan Terkini (Live Tracking)
                                      </span>
                                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                                        {trip.currentLocation || "Menunggu update titik lokasi pertama dari Tour Guide"}
                                      </span>
                                      {trip.checkpoints?.[0] && (
                                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                                          Update terakhir: {formatDateTime(trip.checkpoints[0].reportedAt)} oleh {trip.checkpoints[0].user?.name} ({trip.checkpoints[0].user?.role})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {trip.checkpoints && trip.checkpoints.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleCheckpoints(trip.id)}
                                      className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-50 flex items-center gap-1.5 self-start sm:self-center shrink-0 shadow-2xs transition-colors"
                                    >
                                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>{trip.checkpoints.length} Titik Terlapor</span>
                                      {expandedTripCheckpoints[trip.id] ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                {/* Checkpoints Timeline */}
                                {expandedTripCheckpoints[trip.id] && trip.checkpoints && trip.checkpoints.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-emerald-200/70 space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                      Linimasa Titik Perjalanan Dilaporkan Kru:
                                    </span>
                                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                      {trip.checkpoints.map((cp: any) => (
                                        <div key={cp.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between gap-3 shadow-2xs">
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-bold text-slate-900">{cp.location}</span>
                                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-100 text-slate-700">
                                                {cp.user?.role === "GUIDE" ? "Guide" : cp.user?.role === "DRIVER" ? "Driver" : "Kru"}
                                              </span>
                                              <span className="text-[10px] text-slate-400">oleh {cp.user?.name}</span>
                                            </div>
                                            {cp.note && (
                                              <p className="text-[11px] text-slate-600 italic">"{cp.note}"</p>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-slate-500 font-medium shrink-0 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                            {formatDateTime(cp.reportedAt)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Operational Crew Manifest */}
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Kru yang Ditugaskan ({trip.assignments?.length || 0})
                              </h3>

                              {trip.assignments && trip.assignments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {trip.assignments.map((a: any) => {
                                    const assignBadge = getStatusBadge(a.status);
                                    const isPaid = a.fee?.paymentStatus === "PAID";

                                    return (
                                      <div
                                        key={a.id}
                                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between text-xs gap-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{a.worker.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-200 text-slate-700">
                                              {a.role}
                                            </span>
                                          </div>
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isPaid
                                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                              : "bg-amber-100 text-amber-800 border-amber-200"
                                              }`}
                                          >
                                            {isPaid ? "Fee Lunas" : "Fee Belum Dibayar"}
                                          </span>
                                        </div>

                                        <div className="text-[11px] text-slate-500">
                                          Fee: <span className="font-semibold text-emerald-700">{formatRupiah(a.feeAmount)}</span>
                                          {" • "}
                                          Status Tugas: <span className="font-bold">{a.status}</span>
                                        </div>

                                        {/* Worker Bank Account Details for Fee Transfer */}
                                        {a.worker.workerProfile?.bankAccount ? (
                                          <div className="mt-1 pt-2 border-t border-slate-200/70 text-[11px] bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                                            <div className="flex items-center gap-1 font-bold text-slate-800">
                                              <CreditCard className="w-3 h-3 text-emerald-600 shrink-0" />
                                              <span>Rekening: {a.worker.workerProfile.bankName || "Bank BCA"}</span>
                                            </div>
                                            <div className="text-[11px] font-mono text-emerald-900 font-bold mt-0.5">
                                              No. Rek: {a.worker.workerProfile.bankAccount}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                              a/n: <span className="font-semibold text-slate-700">{a.worker.workerProfile.bankHolder || a.worker.name}</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-slate-400 italic mt-1 bg-white p-1.5 rounded-lg border border-slate-200/50">
                                            *Kru belum menginput data nomor rekening bank
                                          </div>
                                        )}

                                        {/* REQ-5.3: Travel Admin respons negosiasi kru */}
                                        {a.status === "NEGOTIATING" && (
                                          <div className="pt-2 space-y-1.5">
                                            <div className="text-[10px] font-bold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                              💬 {a.agreement?.split("\n").slice(-1)[0] || "Kru mengajukan tawaran fee"}
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => handleTravelRespond(a.id, "TRAVEL_ACCEPT_NEGOTIATION")}
                                                disabled={respondingId === a.id}
                                                className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                              >
                                                <Check className="w-3 h-3" />
                                                Setujui Tawaran
                                              </button>
                                              <button
                                                onClick={() => handleTravelRespond(a.id, "TRAVEL_REJECT")}
                                                disabled={respondingId === a.id}
                                                className="py-1.5 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* REQ-5.3: Fee Payment Flow */}
                                        {a.fee && a.fee.paymentStatus !== "PAID" && a.status === "ACCEPTED" && (
                                          <div className="pt-2">
                                            {a.fee.paymentStatus === "WAITING_CONFIRMATION" ? (
                                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                <span className="font-bold">Menunggu Konfirmasi Kru</span>
                                                {a.fee.proofUrl && (
                                                  <a href={a.fee.proofUrl} target="_blank" className="ml-auto text-amber-700 underline text-[11px]">Lihat Bukti</a>
                                                )}
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => openPayFeeModal(a.fee.id)}
                                                className="w-full px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                                              >
                                                <Upload className="w-3 h-3" />
                                                <span>Upload Bukti Bayar Fee</span>
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">
                                  Belum ada Guide atau Driver yang ditugaskan untuk jadwal trip ini.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            Belum ada jadwal perjalanan aktif. Perjalanan otomatis terbentuk setelah pembayaran booking diverifikasi.
          </div>
        )}

      </div>

      {/* Pay Fee Modal — REQ-5.3 */}
      {payFeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Upload Bukti Pembayaran Fee</h3>
              <button onClick={() => setPayFeeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Upload bukti transfer pembayaran fee kru. Setelah diupload, status fee akan berubah menjadi <strong>"Menunggu Konfirmasi"</strong> dan kru akan dikonfirmasi.
            </p>
            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${feeProofFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 bg-slate-50"
              }`}>
              {feeProofFile ? (
                <>
                  <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-900 truncate">{feeProofFile.name}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Klik untuk pilih bukti transfer</span>
                    <span className="text-[11px] text-slate-400">JPG, PNG, PDF — maks 5 MB</span>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFeeProofFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPayFeeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handlePayFee}
                disabled={!feeProofFile || payingFee}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                {payingFee ? "Mengupload..." : "Kirim Bukti Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Assign Crew Modal (Guide & Driver simultaneously) */}
      {selectedTrip && (
        <UnifiedAssignCrewModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          trip={selectedTrip}
          onSuccess={() => fetchTrips()}
        />
      )}

    </div>
  );
}
