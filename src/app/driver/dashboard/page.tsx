"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  MapPin, Check, MessageSquare,
  X, AlertCircle, Clock,
  ClipboardList, Navigation, ExternalLink,
} from "lucide-react";
import NegotiationChatModal from "@/components/NegotiationChatModal";
import WorkerJobVacancies from "@/components/WorkerJobVacancies";
import { useToast } from "@/components/Toast";

export default function DriverDashboardPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Tab state
  const [driverTab, setDriverTab] = useState<"ASSIGNMENTS" | "VACANCIES">("ASSIGNMENTS");

  // Titik Lokasi Rute Modal State (Khusus Akun Driver)
  const [selectedRouteAssignment, setSelectedRouteAssignment] = useState<any | null>(null);
  const [submittingNextPoint, setSubmittingNextPoint] = useState(false);
  const [submittingCompleteTrip, setSubmittingCompleteTrip] = useState(false);

  // Live Chat Negosiasi Fee State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatAssignmentId, setSelectedChatAssignmentId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        fetch("/api/assignments"),
        fetch("/api/profile/worker"),
      ]);
      const aData = await aRes.json();
      const pData = await pRes.json();
      setAssignments(aData.assignments || []);
      setProfile(pData.user);
    } catch {
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const isTripDay = (dateStr?: string | Date) => {
    if (!dateStr) return true;
    let tripDate: Date;
    if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const [y, m, d] = dateStr.trim().split("-").map(Number);
      tripDate = new Date(y, m - 1, d);
    } else {
      tripDate = new Date(dateStr);
    }
    if (isNaN(tripDate.getTime())) return true;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tripStart = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate()).getTime();

    return todayStart >= tripStart;
  };

  useEffect(() => { fetchAssignments(); }, []);

  // REQ-5.3: Negosiasi Fee Modal State
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);
  const [negotiatingAssignment, setNegotiatingAssignment] = useState<any>(null);
  const [counterFee, setCounterFee] = useState("");
  const [negotiateNote, setNegotiateNote] = useState("");
  const [submittingNegotiation, setSubmittingNegotiation] = useState(false);

  const openNegotiateModal = (assignment: any) => {
    setNegotiatingAssignment(assignment);
    setCounterFee(String(assignment.feeAmount || 350000));
    setNegotiateNote("");
    setNegotiateModalOpen(true);
  };

  const handleNegotiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!negotiatingAssignment) return;
    setSubmittingNegotiation(true);
    try {
      const res = await fetch(`/api/assignments/${negotiatingAssignment.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "NEGOTIATE",
          counterFee: parseFloat(counterFee),
          note: negotiateNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Tawaran fee berhasil diajukan!");
        setNegotiateModalOpen(false);
        fetchAssignments();
      } else {
        toast.error(data.error || "Gagal mengajukan tawaran fee.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat mengajukan fee.");
    } finally {
      setSubmittingNegotiation(false);
    }
  };

  const handleRespond = async (assignmentId: string, action: "ACCEPT" | "REJECT") => {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "ACCEPT") {
          toast.success(data.message || "Tugas perjalanan berhasil diterima!");
        } else {
          toast.info(data.message || "Tugas perjalanan telah ditolak.");
        }
        fetchAssignments();
      } else {
        toast.error(data.error || "Gagal memproses tugas.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    }
  };

  const handleUpdateTripStatus = async (tripId: string, status: "ONGOING" | "COMPLETED") => {
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Status perjalanan berhasil diperbarui!");
        fetchAssignments();
      } else {
        toast.error(data.error || "Gagal memperbarui status perjalanan.");
      }
    } catch {
      toast.error("Gagal memperbarui status perjalanan.");
    }
  };

  // Helper rute titik lokasi khusus driver (100% sinkron persis dengan paket)
  const getTripPoints = (trip: any): string[] => {
    const pkg = trip?.package;
    if (!pkg) return [];

    let stops: string[] = [];
    if (pkg.checkpointRoute) {
      if (Array.isArray(pkg.checkpointRoute)) {
        stops = pkg.checkpointRoute;
      } else if (typeof pkg.checkpointRoute === "string") {
        try {
          const parsed = JSON.parse(pkg.checkpointRoute);
          if (Array.isArray(parsed)) {
            stops = parsed;
          } else if (typeof parsed === "string") {
            stops = parsed.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        } catch {
          stops = pkg.checkpointRoute.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
    }

    // Bersihkan spasi dan filter item kosong
    stops = stops
      .map((s: any) => (typeof s === "string" ? s.trim() : String(s || "")).trim())
      .filter((s: string) => s.length > 0);

    // Jika paket memang sudah memiliki daftar rute, gunakan PERSIS rute tersebut (SINKRON!)
    if (stops.length > 0) {
      return stops;
    }

    // Fallback HANYA jika paket sama sekali tidak mengisi rute checkpoint
    const fallbackOrigin = pkg.originCity?.trim();
    const fallbackDest = (pkg.destination || trip.destination)?.trim();

    const fallbackList: string[] = [];
    if (fallbackOrigin) fallbackList.push(fallbackOrigin);
    if (fallbackDest && (!fallbackOrigin || fallbackOrigin.toLowerCase() !== fallbackDest.toLowerCase())) {
      fallbackList.push(fallbackDest);
    }

    return fallbackList.length > 0 ? fallbackList : ["Titik Kumpul / Keberangkatan", "Destinasi Wisata"];
  };

  const getCurrentPointIndex = (trip: any, points: string[]): number => {
    if (!trip || points.length === 0) return 0;
    if (trip.status === "COMPLETED") return points.length - 1;

    // 1. Cek currentLocation jika ada
    if (trip.currentLocation) {
      const target = trip.currentLocation.toLowerCase().trim();
      const exactIdx = points.findIndex(p => p.toLowerCase().trim() === target);
      if (exactIdx >= 0) return exactIdx;
    }

    // 2. Cek histori checkpoints dari yang paling baru
    if (trip.checkpoints && trip.checkpoints.length > 0) {
      for (const cp of trip.checkpoints) {
        if (!cp.location) continue;
        const target = cp.location.toLowerCase().trim();
        const exactIdx = points.findIndex(p => p.toLowerCase().trim() === target);
        if (exactIdx >= 0) return exactIdx;
      }
    }

    // 3. Fallback partial match jika penamaan sedikit berbeda
    if (trip.currentLocation) {
      const target = trip.currentLocation.toLowerCase().trim();
      const partialIdx = points.findIndex(p =>
        p.toLowerCase().trim().includes(target) || target.includes(p.toLowerCase().trim())
      );
      if (partialIdx >= 0) return partialIdx;
    }

    return 0;
  };

  const handleAdvanceToNextPoint = async (tripId: string, nextLocation: string) => {
    setSubmittingNextPoint(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: nextLocation,
          note: `Driver melaju menuju titik: ${nextLocation}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Berhasil lanjut ke titik berikutnya: "${nextLocation}"!`);
        setSelectedRouteAssignment((prev: any) => {
          if (!prev || prev.trip?.id !== tripId) return prev;
          return {
            ...prev,
            trip: {
              ...prev.trip,
              currentLocation: nextLocation,
              status: prev.trip.status === "SCHEDULED" ? "ONGOING" : prev.trip.status,
              checkpoints: [data.checkpoint, ...(prev.trip.checkpoints || [])],
            },
          };
        });
        await fetchAssignments();
      } else {
        toast.error(data.error || "Gagal melanjutkan ke titik berikutnya.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi saat memperbarui titik lokasi.");
    } finally {
      setSubmittingNextPoint(false);
    }
  };

  const handleCompleteTripFromModal = async (tripId: string) => {
    setSubmittingCompleteTrip(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Perjalanan berhasil diselesaikan!");
        setSelectedRouteAssignment((prev: any) => {
          if (!prev || prev.trip?.id !== tripId) return prev;
          return {
            ...prev,
            trip: {
              ...prev.trip,
              status: "COMPLETED",
            },
          };
        });
        await fetchAssignments();
      } else {
        toast.error(data.error || "Gagal menyelesaikan perjalanan.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi saat menyelesaikan perjalanan.");
    } finally {
      setSubmittingCompleteTrip(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const isProfileComplete = profile?.workerProfile?.profileCompleted;
  const totalEarnings = assignments.filter(a => a.fee?.paymentStatus === "PAID").reduce((acc, a) => acc + (a.fee?.amount || 0), 0);
  const pendingEarnings = assignments.filter(a => a.fee?.paymentStatus === "UNPAID" && a.status === "ACCEPTED").reduce((acc, a) => acc + (a.fee?.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile Incomplete Overlay */}
        {!isProfileComplete ? (
          <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xl text-center max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Silahkan Lengkapi Profile Terlebih Dahulu</h2>
            <p className="text-slate-500 mb-6 text-sm">
              Untuk dapat menerima penugasan dari agen travel dan mengakses fitur utama dashboard, Anda harus melengkapi profil (KTP, SIM/dokumen pendukung) dan menungggu persetujuan dari Admin.
            </p>
            <Link href="/driver/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md">
              Lengkapi Profil Sekarang
            </Link>
          </div>
        ) : (
          <>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard Penugasan & Fee Driver
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pantau tawaran penugasan, lapor titik lokasi sekali klik, dan pantau histori fee.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fee Lunas</span>
                <span className="text-2xl font-extrabold text-emerald-600">{formatRupiah(totalEarnings)}</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fee Proses</span>
                <span className="text-2xl font-extrabold text-amber-600">{formatRupiah(pendingEarnings)}</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Penugasan</span>
                <span className="text-2xl font-extrabold text-slate-900">{assignments.length} Tugas</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Rating Saya</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  ⭐ {(profile?.workerProfile?.rating ?? profile?.rating ?? 5.0).toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {profile?.workerProfile?.reviewCount ?? profile?.totalReviews ?? 0} wisatawan
                </span>
              </div>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setDriverTab("ASSIGNMENTS")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${driverTab === "ASSIGNMENTS"
                  ? "bg-blue-700 text-white shadow-md shadow-blue-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>Tugas Pengemudi Saya</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${driverTab === "ASSIGNMENTS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                  {assignments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDriverTab("VACANCIES")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${driverTab === "VACANCIES"
                  ? "bg-blue-700 text-white shadow-md shadow-blue-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>Bursa Lowongan Kerja &amp; Lamar</span>
              </button>
            </div>

            {driverTab === "VACANCIES" ? (
              <WorkerJobVacancies role="DRIVER" onApplicationSubmitted={fetchAssignments} />
            ) : (
              /* Assignments */
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Daftar Penugasan Driver</h2>

                {assignments.length > 0 ? (
                  assignments.map((a) => {
                    const badge = getStatusBadge(a.status);
                    const tripBadge = getStatusBadge(a.trip.status);
                    const isProposed = a.status === "PROPOSED";
                    const isAccepted = a.status === "ACCEPTED";
                    const isPaid = a.fee?.paymentStatus === "PAID";

                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <img src={a.trip.package.coverImage} alt={a.trip.package.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                                Tugas: {badge.label}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tripBadge.className}`}>
                                Trip: {tripBadge.label}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm sm:text-base text-slate-900">{a.trip.package.name}</h3>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{a.trip.package.destination}</span>
                              <span>•</span>
                              <span>Jadwal: {formatDate(a.trip.scheduleDate)}</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Agensi: <span className="font-semibold text-slate-700">{a.travel.businessName}</span>
                            </div>
                            {/*Data customer + WA */}
                            {a.trip?.booking?.customer && (
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[11px] text-slate-600">
                                  {a.trip.booking.customer.name} ({a.trip.booking.participantCount || 1} pax)
                                </span>
                              </div>
                            )}
                            {a.trip.currentLocation && (
                              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 flex-wrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>Posisi: <strong>{a.trip.currentLocation}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-2">
                          <div>
                            <span className="text-xs text-slate-400">Nominal Fee</span>
                            <div className="text-lg font-extrabold text-blue-700">{formatRupiah(a.feeAmount)}</div>
                            {a.dpFeeAmount > 0 && (
                              <div className="text-[10px] text-blue-700 font-semibold">
                                DP: {formatRupiah(a.dpFeeAmount)} {a.dpFeePaid ? "✓ Lunas" : "(Belum)"}
                              </div>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isPaid ? "bg-emerald-100 text-emerald-800" :
                              a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "bg-amber-100 text-amber-800" :
                                "bg-rose-100 text-rose-800"
                              }`}>
                              {isPaid ? "Fee Sudah Cair" :
                                a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "Menunggu Konfirmasi" :
                                  "Fee Belum Cair"}
                            </span>

                            {/* REQ-5.3: Driver konfirmasi penerimaan fee */}
                            {a.fee?.paymentStatus === "WAITING_CONFIRMATION" && (
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/fees/${a.fee.id}/confirm`, { method: "POST" });
                                    const data = await res.json();
                                    if (res.ok) {
                                      toast.success("Fee berhasil dikonfirmasi! Status: LUNAS.");
                                      fetchAssignments();
                                    } else {
                                      toast.error(data.error || "Gagal mengonfirmasi fee.");
                                    }
                                  } catch {
                                    toast.error("Terjadi kesalahan koneksi.");
                                  }
                                }}
                                className="mt-1.5 w-full px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Konfirmasi Terima Fee</span>
                              </button>
                            )}
                            {a.fee?.proofUrl && a.fee.paymentStatus !== "PAID" && (
                              <a href={a.fee.proofUrl} target="_blank" className="block text-[10px] text-blue-600 hover:underline mt-1">Lihat Bukti Bayar</a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Tombol Live Chat Negosiasi Fee - Hanya muncul saat belum fix / masih negosiasi */}
                            {!isAccepted && a.status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChatAssignmentId(a.id);
                                  setChatModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Buka live chat negosiasi fee"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>💬 Live Chat Negosiasi Fee</span>
                              </button>
                            )}

                            {isProposed && (
                              <>
                                <button onClick={() => handleRespond(a.id, "REJECT")}
                                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold">
                                  Tolak
                                </button>
                                <button onClick={() => handleRespond(a.id, "ACCEPT")}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /><span>Terima</span>
                                </button>
                              </>
                            )}
                            {a.status === "NEGOTIATING" && (
                              <div className="flex flex-col sm:items-end gap-1">
                                <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1">
                                  <span>⏳ Sedang Negosiasi Fee</span>
                                </span>
                                <span className="text-[10px] text-slate-500">Tawaran diajukan: {formatRupiah(a.fee?.negotiatedAmount || a.feeAmount)}</span>
                              </div>
                            )}

                            {isAccepted && (
                              <>
                                {/* 1. Trip Room */}
                                <Link href={`/customer/trip-room/${a.trip.id}`}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 text-xs font-bold flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" /><span>Trip Room</span>
                                </Link>

                                {/* 2. Tombol Titik Lokasi Perjalanan (Khusus Driver) */}
                                {!isTripDay(a.trip.scheduleDate) ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRouteAssignment(a)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                                    title={`Jadwal keberangkatan: ${formatDate(a.trip.scheduleDate)}. Klik untuk melihat rute titik lokasi`}
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Titik Lokasi</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRouteAssignment(a)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${a.trip.status === "COMPLETED"
                                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200"
                                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
                                      }`}
                                    title="Lihat rute lokasi perjalanan"
                                  >
                                    <MapPin className={`w-3.5 h-3.5 ${a.trip.status === "COMPLETED" ? "text-slate-400" : "text-emerald-600"}`} />
                                    <span>Titik Lokasi</span>
                                  </button>
                                )}

                                {/* 3. Status Perjalanan Selesai */}
                                {a.trip.status === "COMPLETED" && (
                                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Perjalanan Selesai</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Belum ada penugasan saat ini.
                  </div>
                )}
              </div>
            )}

            {/* REQ-5.3: Negosiasi Fee Modal */}
            {negotiateModalOpen && negotiatingAssignment && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                      <span>Ajukan Negosiasi Fee Driver</span>
                    </div>
                    <button onClick={() => setNegotiateModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">{negotiatingAssignment.trip.package?.name}</span>
                    <span className="text-[11px] text-slate-500">
                      Tawaran awal dari agensi travel: <strong>{formatRupiah(negotiatingAssignment.feeAmount)}</strong>
                    </span>
                  </div>

                  <form onSubmit={handleNegotiateSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nominal Fee yang Diajukan (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        min={100000}
                        step={25000}
                        value={counterFee}
                        onChange={(e) => setCounterFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                        placeholder="Contoh: 450000"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {counterFee && !isNaN(Number(counterFee)) ? formatRupiah(Number(counterFee)) : ""}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alasan / Catatan Penawaran (Opsional)
                      </label>
                      <textarea
                        rows={3}
                        value={negotiateNote}
                        onChange={(e) => setNegotiateNote(e.target.value)}
                        placeholder="Contoh: Lokasi penjemputan luar kota / waktu operasional malam hari..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setNegotiateModalOpen(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submittingNegotiation}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                      >
                        {submittingNegotiation ? "Mengirim..." : "Kirim Tawaran"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* LIVE CHAT NEGOSIASI FEE MODAL */}
            {chatModalOpen && selectedChatAssignmentId && (
              <NegotiationChatModal
                assignmentId={selectedChatAssignmentId}
                isOpen={chatModalOpen}
                onClose={() => {
                  setChatModalOpen(false);
                  setSelectedChatAssignmentId(null);
                }}
                currentUserRole="DRIVER"
                onFeeUpdated={fetchAssignments}
              />
            )}

            {/* MODAL TITIK LOKASI & ALUR RUTE PERJALANAN (KHUSUS AKUN DRIVER) */}
            {selectedRouteAssignment && (() => {
              const trip = selectedRouteAssignment.trip;
              const pkg = trip?.package;
              const vehicle = pkg?.vehicle || "HiAce Luxury / Bus Pariwisata";
              const customer = trip?.booking?.customer;
              const paxCount = trip?.booking?.participantCount || 1;

              const points = getTripPoints(trip);
              const isCompleted = trip?.status === "COMPLETED";
              const isOngoing = trip?.status === "ONGOING";
              const isTripDayReached = isTripDay(trip?.scheduleDate);
              const currentIdx = getCurrentPointIndex(trip, points);
              const nextPointName = currentIdx < points.length - 1 ? points[currentIdx + 1] : null;

              return (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
                    {/* Header Modal */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="leading-tight text-base font-extrabold text-slate-900">
                              Titik Lokasi Perjalanan
                            </h3>
                            {isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                (Selesai)
                              </span>
                            ) : !isTripDayReached ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
                                View Only
                              </span>
                            ) : isOngoing ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                On Going
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                Terjadwal
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-normal text-slate-500">
                            {isCompleted
                              ? "Riwayat rute perjalanan trip."
                              : !isTripDayReached
                                ? `Jadwal: ${formatDate(trip?.scheduleDate)}. Mode lihat saja rute perjalanan.`
                                : isOngoing
                                  ? "Klik titik lokasi untuk buka Google Maps & klik 'Titik Berikutnya' saat melaju."
                                  : "Menunggu Tour Guide memulai trip."}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRouteAssignment(null)}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Tutup"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Banner Status jika trip selesai */}
                    {isCompleted && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2.5 shrink-0">
                        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Perjalanan Telah Selesai</span>
                          <span className="text-[11px] text-emerald-700">Seluruh titik lokasi telah tuntas dilalui.</span>
                        </div>
                      </div>
                    )}

                    {/* Banner jika belum hari keberangkatan */}
                    {!isTripDayReached && !isCompleted && (
                      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center gap-2.5 shrink-0">
                        <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                        <div>
                          <span className="text-[11px] text-slate-600">
                            Jadwal keberangkatan adalah <strong>{formatDate(trip?.scheduleDate)}</strong>. Anda dapat melihat daftar rute dan membuka titik di Google Maps. Navigasi interaktif dapat diakses saat hari keberangkatan tiba.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Banner jika sudah hari keberangkatan namun trip belum dimulai oleh guide */}
                    {isTripDayReached && trip?.status === "SCHEDULED" && !isCompleted && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5 shrink-0">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Menunggu Tour Guide Memulai Trip</span>
                          <span className="text-[11px] text-amber-700">
                            Tour guide perlu melakukan absensi keberangkatan dan menekan Mulai Trip untuk mengaktifkan navigasi rute perjalanan.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Daftar Titik Lokasi Interaktif */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Urutan Titik Perjalanan ({points.length} Titik)</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {isCompleted ? "Riwayat Rute" : "Klik titik untuk buka Google Maps"}
                        </span>
                      </div>

                      <div className="relative pl-7 space-y-3.5 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                        {points.map((pt: string, idx: number) => {
                          const isPassed = !isCompleted && idx < currentIdx;
                          const isCurrent = !isCompleted && idx === currentIdx;
                          const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pt)}`;

                          // Mode Selesai (isCompleted) -> SEMUA ABU-ABU & VIEW ONLY
                          if (isCompleted) {
                            return (
                              <div key={idx} className="relative">
                                <div className="absolute -left-7 top-2 w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold shadow-xs">
                                  ✓
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 pointer-events-none select-none">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                      ✓ Titik #{idx + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Selesai</span>
                                  </div>
                                  <div className="font-bold text-sm text-slate-600 mt-1">{pt}</div>
                                </div>
                              </div>
                            );
                          }

                          // 1. Titik Sebelumnya (Sudah dilewati) -> ABU-ABU & TIDAK BISA DIKLIK
                          if (isPassed) {
                            return (
                              <div key={idx} className="relative group">
                                <div className="absolute -left-7 top-2 w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-xs font-bold shadow-xs">
                                  ✓
                                </div>
                                <div
                                  className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none select-none transition-all"
                                  title="Titik ini sudah dilewati dan tidak dapat diklik lagi"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                                      ✓ Sudah Dilewati #{idx + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-400">Tidak dapat diklik</span>
                                  </div>
                                  <div className="font-semibold text-sm text-slate-500 mt-1">
                                    {pt}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // 2. Titik Saat Ini (Aktif) -> HANYA SPAN "Buka Google Maps" YANG BISA DIKLIK
                          if (isCurrent) {
                            return (
                              <div key={idx} className="relative">
                                <div className="absolute -left-7 top-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-4 ring-emerald-100 animate-pulse">
                                  📍
                                </div>
                                <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-sm text-slate-900 transition-all">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-200/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                      <span>Titik Saat Ini (#{idx + 1})</span>
                                    </span>
                                    <a
                                      href={mapSearchUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 hover:underline cursor-pointer"
                                      title="Buka navigasi di Google Maps"
                                    >
                                      <span>Buka Google Maps</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="font-extrabold text-sm sm:text-base text-slate-900 mt-1.5">
                                    {pt}
                                  </div>
                                  <p className="text-[11px] text-emerald-700/90 mt-0.5">
                                    Titik perjalanan yang sedang dituju.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          // 3. Titik Selanjutnya / Mendatang (isUpcoming) -> ABU-ABU & TIDAK BISA DIKLIK
                          return (
                            <div key={idx} className="relative">
                              <div className="absolute -left-7 top-2 w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold shadow-2xs">
                                {idx + 1}
                              </div>
                              <div
                                className="p-3 rounded-2xl bg-slate-100/70 border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed pointer-events-none select-none"
                                title="Titik ini belum aktif dan tidak dapat diklik"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-md">
                                    Titik #{idx + 1}
                                  </span>
                                  <span className="text-[10px] text-slate-400">Tidak dapat diklik</span>
                                </div>
                                <div className="font-semibold text-sm text-slate-400 mt-1">{pt}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Tekan tombol &quot;Titik Berikutnya&quot; untuk melaju ke titik ini
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar Bawah: Khusus Driver */}
                    <div className="pt-3 border-t border-slate-100 mt-3 flex flex-col sm:flex-row gap-2 shrink-0">
                      {/* Tombol aksi hanya aktif jika sudah hari keberangkatan DAN trip sedang berjalan */}
                      {isTripDayReached && isOngoing ? (
                        <>
                          {/* Tombol Titik Berikutnya ATAU Info Semua Titik Telah Dilalui */}
                          {nextPointName ? (
                            <button
                              type="button"
                              disabled={submittingNextPoint}
                              onClick={() => handleAdvanceToNextPoint(trip.id, nextPointName)}
                              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                              title={`Melaju ke titik berikutnya: ${nextPointName}`}
                            >
                              <Navigation className="w-4 h-4" />
                              <span>
                                {submittingNextPoint ? "Memproses Titik..." : `Titik Berikutnya: ${nextPointName} ➔`}
                              </span>
                            </button>
                          ) : (
                            <div className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Semua titik telah dilalui (Menunggu Tour Guide Menyelesaikan Trip)</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRouteAssignment(null)}
                            className="py-3 px-5 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                          >
                            Tutup
                          </button>
                        </>
                      ) : (
                        /* Belum hari keberangkatan ATAU trip belum dimulai guide → hanya tombol Tutup */
                        <button
                          type="button"
                          onClick={() => setSelectedRouteAssignment(null)}
                          className="w-full py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          Tutup
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

      </div>
    </div>
  );
}
