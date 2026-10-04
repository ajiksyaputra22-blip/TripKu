"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  MapPin, MessageSquare,
  Clock, Check, Navigation, X, Users, UserCheck,
  ChevronRight, AlertCircle, ClipboardList, Phone, Fingerprint, MessageCircle,
  Briefcase
} from "lucide-react";
import NegotiationChatModal from "@/components/NegotiationChatModal";
import WorkerJobVacancies from "@/components/WorkerJobVacancies";
import { useToast } from "@/components/Toast";

export default function GuideDashboardPage() {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Tab state
  const [guideTab, setGuideTab] = useState<"ASSIGNMENTS" | "VACANCIES">("ASSIGNMENTS");

  // Live Chat Negosiasi Fee State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatAssignmentId, setSelectedChatAssignmentId] = useState<string | null>(null);

  // Checkpoint modal state
  const [checkpointModalOpen, setCheckpointModalOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);
  const [routeStops, setRouteStops] = useState<string[]>([]);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

  // Customer biodata modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Attendance modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"DEPARTURE" | "RETURN">("DEPARTURE");
  const [attendanceData, setAttendanceData] = useState<{ customerId: string; isPresent: boolean; note: string }[]>([]);
  const [existingAttendances, setExistingAttendances] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceViewOnly, setAttendanceViewOnly] = useState(false);

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

  useEffect(() => { fetchAssignments(); }, []);

  // REQ-5.3: Negosiasi Fee Modal State
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);
  const [negotiatingAssignment, setNegotiatingAssignment] = useState<any>(null);
  const [counterFee, setCounterFee] = useState("");
  const [negotiateNote, setNegotiateNote] = useState("");
  const [submittingNegotiation, setSubmittingNegotiation] = useState(false);

  const openNegotiateModal = (assignment: any) => {
    setNegotiatingAssignment(assignment);
    setCounterFee(String(assignment.feeAmount || 500000));
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

  const openCheckpointModal = (trip: any) => {
    setActiveTrip(trip);
    // Parse route from package
    let stops: string[] = [];
    try {
      const raw = trip.package?.checkpointRoute;
      stops = raw ? (Array.isArray(raw) ? raw : JSON.parse(raw)) : [];
    } catch { stops = []; }

    if (stops.length === 0) {
      // Fallback generic stops
      stops = ["Titik Kumpul / Keberangkatan", "Perjalanan Menuju Destinasi", "Tiba di Lokasi Utama", "Aktivitas Wisata", "Perjalanan Pulang"];
    }
    setRouteStops(stops);

    // Determine current stop based on latest checkpoint
    const lastLoc = trip.currentLocation;
    const foundIdx = stops.indexOf(lastLoc);
    setCurrentStopIdx(foundIdx >= 0 ? (foundIdx + 1) % stops.length : 0);
    setCheckpointModalOpen(true);
  };

  const handleClickStop = async (stop: string, idx: number) => {
    if (!activeTrip) return;
    setSubmittingCheckpoint(true);
    try {
      const res = await fetch(`/api/trips/${activeTrip.id}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: stop, note: `Rombongan tiba di ${stop}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTrip((prev: any) => {
          if (!prev) return prev;
          const currentCps = prev.checkpoints || [];
          return {
            ...prev,
            currentLocation: stop,
            checkpoints: [data.checkpoint, ...currentCps],
          };
        });
        setCurrentStopIdx((idx + 1) % routeStops.length);
        setCheckpointModalOpen(false);
        await fetchAssignments();
        toast.success(`Titik "${stop}" berhasil dilaporkan ke monitoring travel dan Trip Room!`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal melaporkan titik perjalanan.");
      }
    } catch {
      toast.error("Gagal melaporkan titik perjalanan.");
    } finally {
      setSubmittingCheckpoint(false);
    }
  };

  const openCustomerModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setCustomerModalOpen(true);
  };

  const openAttendanceModal = async (assignment: any, type: "DEPARTURE" | "RETURN", viewOnly = false) => {
    setSelectedAssignment(assignment);
    setAttendanceType(type);
    setAttendanceViewOnly(viewOnly);
    // Prepare attendance rows from booking participants
    const participants = assignment.trip?.booking?.participants || [];
    const customer = assignment.trip?.booking?.customer;
    // Include all participants; for customer themselves, use their phone
    const defaultData = participants.map((p: any) => ({
      customerId: assignment.trip?.booking?.customerId || "",
      participantName: p.name,
      identityNumber: p.identityNumber,
      phone: p.phone || customer?.phone || "", // REQ-7.3: nomor WA
      isPresent: true,
      note: "",
    }));
    setAttendanceData(defaultData);

    // Fetch existing attendances
    try {
      const res = await fetch(`/api/trips/${assignment.trip.id}/attendance?type=${type}`);
      const data = await res.json();
      setExistingAttendances(data.attendances || []);
      if (data.attendances && data.attendances.length > 0) {
        setAttendanceData(defaultData.map((row: any) => {
          const match = data.attendances.find((att: any) => att.participantName === row.participantName || att.customerId === row.customerId);
          return match ? { ...row, isPresent: match.isPresent, note: match.note || "" } : row;
        }));
      }
    } catch { setExistingAttendances([]); }
    setAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedAssignment) return;
    setSavingAttendance(true);
    try {
      const res = await fetch(`/api/trips/${selectedAssignment.trip.id}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendances: attendanceData, type: attendanceType }),
      });
      if (res.ok) {
        toast.success("Absensi berhasil disimpan!");
        setAttendanceModalOpen(false);
        await fetchAssignments();
      } else {
        toast.error("Gagal menyimpan absensi.");
      }
    } catch { toast.error("Gagal menyimpan absensi."); }
    finally { setSavingAttendance(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
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
            <Link href="/guide/profile" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md">
              Lengkapi Profil Sekarang
            </Link>
          </div>
        ) : (
          <>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dashboard Penugasan & Fee Tour Guide
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pantau tawaran penugasan, lapor titik lokasi sekali klik, kelola absensi customer, dan pantau histori fee.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fee Lunas</span>
                <span className="text-2xl font-extrabold text-emerald-600">{formatRupiah(totalEarnings)}</span>
                <span className="text-[11px] text-slate-400 block mt-1">Masuk ke rekening Anda</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Fee Proses</span>
                <span className="text-2xl font-extrabold text-amber-600">{formatRupiah(pendingEarnings)}</span>
                <span className="text-[11px] text-slate-400 block mt-1">Dari tugas terkonfirmasi</span>
              </div>
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Penugasan</span>
                <span className="text-2xl font-extrabold text-slate-900">{assignments.length} Tugas</span>
                <span className="text-[11px] text-teal-700 font-medium block mt-1">Status: Siap Tugas</span>
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
                onClick={() => setGuideTab("ASSIGNMENTS")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${guideTab === "ASSIGNMENTS"
                  ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>Tugas Wisata Saya</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${guideTab === "ASSIGNMENTS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}>
                  {assignments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGuideTab("VACANCIES")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${guideTab === "VACANCIES"
                  ? "bg-teal-700 text-white shadow-md shadow-teal-700/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <span>Bursa Lowongan Kerja &amp; Lamar</span>
              </button>
            </div>

            {guideTab === "VACANCIES" ? (
              <WorkerJobVacancies role="GUIDE" onApplicationSubmitted={fetchAssignments} />
            ) : (
              /* Assignments */
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">Daftar Penugasan Wisata</h2>

                {assignments.length > 0 ? (
                  assignments.map((a) => {
                    const badge = getStatusBadge(a.status);
                    const tripBadge = getStatusBadge(a.trip.status);
                    const isProposed = a.status === "PROPOSED";
                    const isAccepted = a.status === "ACCEPTED";
                    const isPaid = a.fee?.paymentStatus === "PAID";
                    const participants = a.trip?.booking?.participants || [];

                    return (
                      <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="flex gap-4">
                            <img src={a.trip.package.coverImage} alt={a.trip.package.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                                  Tugas: {badge.label}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${tripBadge.className}`}>
                                  Trip: {tripBadge.label}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm sm:text-base text-slate-900">{a.trip.package.name}</h3>
                              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                                <span>{a.trip.package.destination}</span>
                                {a.trip.package.originCity && (
                                  <><span>•</span><span className="text-blue-600 font-medium">Dari: {a.trip.package.originCity}</span></>
                                )}
                                <span>Jadwal: {formatDate(a.trip.scheduleDate)}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Agensi: <span className="font-semibold text-slate-700">{a.travel.businessName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 gap-2">
                            <div>
                              <span className="text-xs text-slate-400">Nominal Fee</span>
                              <div className="text-lg font-extrabold text-teal-700">{formatRupiah(a.feeAmount)}</div>
                              {a.dpFeeAmount > 0 && (
                                <div className="text-[10px] text-blue-700 font-semibold">
                                  DP: {formatRupiah(a.dpFeeAmount)} {a.dpFeePaid ? "✓ Lunas" : "(Belum)"}
                                </div>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaid ? "bg-emerald-100 text-emerald-800" :
                                a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "bg-amber-100 text-amber-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                {isPaid ? "Fee Sudah Cair" :
                                  a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "Menunggu Konfirmasi" :
                                    "Fee Belum Cair"}
                              </span>
                              {/* REQ-5.3: Tombol konfirmasi fee untuk worker */}
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
                                        toast.error(data.error || "Gagal mengkonfirmasi fee.");
                                      }
                                    } catch {
                                      toast.error("Terjadi kesalahan koneksi.");
                                    }
                                  }}
                                  className="mt-1.5 w-full px-2 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Konfirmasi Terima Fee</span>
                                </button>
                              )}
                              {a.fee?.proofUrl && a.fee.paymentStatus !== "PAID" && (
                                <a href={a.fee.proofUrl} target="_blank" className="block text-[10px] text-blue-600 hover:underline mt-1">Lihat Bukti Bayar</a>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Tombol Live Chat Negosiasi Fee - Hanya muncul saat status masih dalam proses negosiasi/penugasan */}
                              {!isAccepted && a.status !== "REJECTED" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedChatAssignmentId(a.id);
                                    setChatModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                                  title="Buka live chat negosiasi fee"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Live Chat Negosiasi Fee</span>
                                </button>
                              )}

                              {isProposed && (
                                <>
                                  <button onClick={() => handleRespond(a.id, "REJECT")}
                                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold">
                                    Tolak
                                  </button>
                                  <button onClick={() => handleRespond(a.id, "ACCEPT")}
                                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Terima Tugas</span>
                                  </button>
                                </>
                              )}

                              {a.status === "NEGOTIATING" && (
                                <div className="flex flex-col sm:items-end gap-1">
                                  <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1">
                                    <span>Sedang Negosiasi Fee</span>
                                  </span>
                                  <span className="text-[10px] text-slate-500">Tawaran diajukan: {formatRupiah(a.fee?.negotiatedAmount || a.feeAmount)}</span>
                                </div>
                              )}

                              {isAccepted && (
                                <>
                                  {/* 1. Customer Biodata */}
                                  <button onClick={() => openCustomerModal(a)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer">
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    <span>Data Customer</span>
                                  </button>

                                  {/* 2. Trip Room */}
                                  <Link href={`/customer/trip-room/${a.trip.id}`}
                                    className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 text-xs font-bold flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                                    <span>Trip Room</span>
                                  </Link>

                                  {/* Status Flow Buttons */}
                                  {(() => {
                                    const isFeePaid = a.fee?.paymentStatus === "PAID" || a.fee?.paymentStatus === "DP_PAID" || a.fee?.dpPaid || a.dpFeePaid;
                                    const isDepartureDone = a.trip?.departureAttendanceDone || (a.trip?.attendances && a.trip.attendances.some((att: any) => att.type === "DEPARTURE"));
                                    const isReturnDone = a.trip?.returnAttendanceDone || (a.trip?.attendances && a.trip.attendances.some((att: any) => att.type === "RETURN"));

                                    let stops: string[] = [];
                                    try {
                                      const raw = a.trip.package?.checkpointRoute;
                                      stops = raw ? JSON.parse(raw) : [];
                                    } catch { stops = []; }
                                    if (stops.length === 0) {
                                      stops = ["Titik Kumpul / Keberangkatan", "Perjalanan Menuju Destinasi", "Tiba di Lokasi Utama", "Aktivitas Wisata", "Perjalanan Pulang"];
                                    }
                                    const lastStop = stops[stops.length - 1];
                                    const allStopsReported = (a.trip.checkpoints && a.trip.checkpoints.length >= stops.length) || a.trip.currentLocation === lastStop;

                                    if (a.trip.status === "COMPLETED") {
                                      return (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Perjalanan Selesai</span>
                                          </span>
                                          {isDepartureDone && (
                                            <button
                                              onClick={() => openAttendanceModal(a, "DEPARTURE", true)}
                                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                              title="Lihat data absensi keberangkatan"
                                            >
                                              <Check className="w-3.5 h-3.5 text-blue-600" />
                                              <span>Absen Berangkat</span>
                                            </button>
                                          )}
                                          {isReturnDone && (
                                            <button
                                              onClick={() => openAttendanceModal(a, "RETURN", true)}
                                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                              title="Lihat data absensi kepulangan"
                                            >
                                              <Check className="w-3.5 h-3.5 text-purple-600" />
                                              <span>Absen Pulang</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    }

                                    if (a.trip.status === "SCHEDULED") {
                                      return (
                                        <>
                                          {/* Absen Berangkat */}
                                          {!isDepartureDone ? (
                                            <button
                                              onClick={() => openAttendanceModal(a, "DEPARTURE")}
                                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                              title="Wajib absen berangkat sebelum mulai trip"
                                            >
                                              <UserCheck className="w-3.5 h-3.5" />
                                              <span>Absen Berangkat</span>
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => openAttendanceModal(a, "DEPARTURE", true)}
                                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 opacity-80 hover:opacity-100 hover:bg-slate-200 transition-opacity cursor-pointer"
                                              title="Klik untuk melihat data absensi keberangkatan"
                                            >
                                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                                              <span> Absen Berangkat Selesai</span>
                                            </button>
                                          )}

                                          {/* Mulai Trip */}
                                          {!isFeePaid ? (
                                            <button
                                              disabled
                                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-not-allowed"
                                              title="Menunggu pembayaran fee (DP/Lunas) oleh Admin Travel"
                                            >
                                              <Clock className="w-3.5 h-3.5" />
                                              <span>Mulai Trip (Tunggu Fee)</span>
                                            </button>
                                          ) : !isDepartureDone ? (
                                            <button
                                              disabled
                                              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-not-allowed"
                                              title="Lakukan Absen Berangkat terlebih dahulu sebelum memulai trip"
                                            >
                                              <Clock className="w-3.5 h-3.5" />
                                              <span>Mulai Trip</span>
                                            </button>
                                          ) : a.trip.guideStarted && !a.trip.driverStarted ? (
                                            <span
                                              className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse"
                                              title="Guide telah siap! Menunggu Driver menekan Mulai Trip"
                                            >
                                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                                              <span>Menunggu Driver Mulai Trip</span>
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handleUpdateTripStatus(a.trip.id, "ONGOING")}
                                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                                            >
                                              <Navigation className="w-3.5 h-3.5" />
                                              <span>Mulai Trip</span>
                                            </button>
                                          )}
                                        </>
                                      );
                                    }

                                    // ONGOING status
                                    return (
                                      <>
                                        {/* Absen Berangkat - selalu tampil di ONGOING, abu-abu tapi bisa diklik untuk lihat data */}
                                        <button
                                          onClick={() => openAttendanceModal(a, "DEPARTURE", true)}
                                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 opacity-80 hover:opacity-100 hover:bg-slate-200 transition-opacity cursor-pointer"
                                          title="Klik untuk melihat data absensi keberangkatan"
                                        >
                                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                                          <span> Absen Berangkat Selesai</span>
                                        </button>

                                        {/* Lapor Titik */}
                                        <button
                                          onClick={() => openCheckpointModal(a.trip)}
                                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                                        >
                                          <Navigation className="w-3.5 h-3.5" />
                                          <span>Lapor Titik ({a.trip.checkpoints?.length || 0}/{stops.length})</span>
                                        </button>

                                        {/* Absen Pulang */}
                                        {!allStopsReported ? (
                                          <button
                                            disabled
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-not-allowed opacity-75"
                                            title={`Absen Pulang hanya dapat dilakukan setelah rombongan tiba di titik rute terakhir (${lastStop})`}
                                          >
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Absen Pulang (Belum di Titik Akhir)</span>
                                          </button>
                                        ) : !isReturnDone ? (
                                          <button
                                            onClick={() => openAttendanceModal(a, "RETURN")}
                                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                                            title="Klik untuk melakukan absensi kepulangan wisatawan di titik akhir"
                                          >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            <span>Absen Pulang</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => openAttendanceModal(a, "RETURN", true)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Absen Pulang telah selesai. Klik untuk melihat data absensi"
                                          >
                                            <Check className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Absen Pulang Selesai</span>
                                          </button>
                                        )}

                                        {/* Selesaikan Trip */}
                                        {!allStopsReported ? (
                                          <button
                                            disabled
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-not-allowed opacity-75"
                                            title="Selesaikan seluruh laporan titik rute pada tombol 'Lapor Titik' untuk menyelesaikan perjalanan"
                                          >
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Selesaikan Trip (Lapor Titik Dulu)</span>
                                          </button>
                                        ) : !isReturnDone ? (
                                          <button
                                            disabled
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-not-allowed opacity-75"
                                            title="Lakukan Absen Pulang terlebih dahulu di titik akhir sebelum menyelesaikan perjalanan"
                                          >
                                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                                            <span>Selesaikan Trip</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleUpdateTripStatus(a.trip.id, "COMPLETED")}
                                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                                          >
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Selesaikan Trip</span>
                                          </button>
                                        )}
                                      </>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Belum ada penugasan dari agensi travel saat ini.
                  </div>
                )}
              </div>
            )}

            {/* ===== CHECKPOINT MODAL (Route List Click) ===== */}
            {checkpointModalOpen && activeTrip && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                      <Navigation className="w-5 h-5 text-emerald-600" />
                      <span>Lapor Titik Perjalanan</span>
                    </div>
                    <button onClick={() => setCheckpointModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                    <span className="font-bold block text-slate-900 mb-0.5">{activeTrip.package?.name}</span>
                    <span className="text-[11px] text-slate-500">Klik titik rute yang sudah dicapai rombongan</span>
                    {activeTrip.currentLocation && (
                      <div className="mt-2 flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Posisi terakhir: {activeTrip.currentLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Route Stop List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {routeStops.map((stop, idx) => {
                      const reportedLocs = (activeTrip.checkpoints || []).map((cp: any) => cp.location);
                      const isPast = reportedLocs.includes(stop) || (activeTrip.currentLocation && routeStops.indexOf(activeTrip.currentLocation) > idx);
                      const isCurrent = activeTrip.currentLocation === stop;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !submittingCheckpoint && handleClickStop(stop, idx)}
                          disabled={submittingCheckpoint}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border cursor-pointer ${isCurrent
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-sm"
                            : isPast
                              ? "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              : "bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800"
                            }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${isCurrent ? "bg-emerald-500 text-white" :
                            isPast ? "bg-emerald-100 text-emerald-700 border border-emerald-300" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                            {isPast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold truncate block">{stop}</span>
                            {isCurrent ? (
                              <span className="text-[10px] text-emerald-600 font-bold">Posisi saat ini</span>
                            ) : isPast ? (
                              <span className="text-[10px] text-emerald-600 font-medium">✓ Titik tercapai (klik untuk lapor ulang)</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Klik untuk laporkan titik ini</span>
                            )}
                          </div>
                          {!isCurrent && (
                            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 text-center">
                      * Laporan otomatis dikirim ke <strong>Trip Room</strong> & monitoring Travel
                    </p>
                    <button onClick={() => setCheckpointModalOpen(false)}
                      className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== CUSTOMER BIODATA MODAL ===== */}
            {customerModalOpen && selectedAssignment && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
                      <ClipboardList className="w-5 h-5 text-teal-600" />
                      <span>Biodata & Manifest Customer</span>
                    </div>
                    <button onClick={() => setCustomerModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Booking Info */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-1">
                    <div className="font-bold text-slate-900">{selectedAssignment.trip?.package?.name}</div>
                    <div className="text-slate-500">Jadwal: <span className="text-slate-800 font-medium">{formatDate(selectedAssignment.trip?.scheduleDate)}</span></div>
                    <div className="text-slate-500">Kode Booking: <span className="font-mono font-bold text-slate-800">{selectedAssignment.trip?.booking?.bookingCode || "—"}</span></div>
                  </div>

                  {/* Customer Info */}
                  {selectedAssignment.trip?.booking?.customer && (
                    <div className="mb-4 p-4 rounded-xl bg-teal-50 border border-teal-200">
                      <div className="text-xs font-bold text-teal-900 mb-2 flex items-center justify-between">
                        <span>Data Pemesan Utama</span>
                        <span className="text-[10px] text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full font-bold">Koordinator Rombongan</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                        <div><span className="text-slate-500 block">Nama</span><span className="font-semibold">{selectedAssignment.trip.booking.customer.name}</span></div>
                        <div><span className="text-slate-500 block">No. HP / WhatsApp</span><span className="font-semibold">{selectedAssignment.trip.booking.customer.phone || "—"}</span></div>
                        <div className="col-span-2"><span className="text-slate-500 block">NIK</span><span className="font-mono font-bold">{selectedAssignment.trip.booking.customer.nik || "—"}</span></div>
                      </div>

                      {selectedAssignment.trip.booking.customer.phone && (
                        <a
                          href={formatWhatsAppUrl(
                            selectedAssignment.trip.booking.customer.phone,
                            `Halo ${selectedAssignment.trip.booking.customer.name}, saya Tour Guide TripKu untuk perjalanan paket ${selectedAssignment.trip?.package?.name}. Saya ingin berkoordinasi mengenai jadwal dan titik kumpul rombongan.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Hubungi via WhatsApp ({selectedAssignment.trip.booking.customer.phone})</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Participants */}
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      Manifest Peserta ({(selectedAssignment.trip?.booking?.participants || []).length} Orang)
                    </div>
                    <div className="divide-y divide-slate-100">
                      {(selectedAssignment.trip?.booking?.participants || []).map((p: any, i: number) => (
                        <div key={p.id} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-slate-900">{i + 1}. {p.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="font-mono">{p.identityNumber}</span>
                              </div>
                            </div>
                            {p.emergencyContact && (
                              <div className="text-[11px] text-slate-500 text-right">
                                <Phone className="w-3 h-3 inline mr-0.5" />
                                {p.emergencyContact}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(selectedAssignment.trip?.booking?.participants || []).length === 0 && (
                        <p className="text-xs text-slate-400 py-2">Belum ada data peserta tersedia.</p>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setCustomerModalOpen(false)}
                    className="mt-5 w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors">
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* ===== ATTENDANCE MODAL ===== */}
            {attendanceModalOpen && selectedAssignment && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-base">
                      <UserCheck className={`w-5 h-5 ${attendanceType === "DEPARTURE" ? "text-blue-600" : "text-purple-600"}`} />
                      <span>Absensi {attendanceType === "DEPARTURE" ? "Keberangkatan" : "Kepulangan"}</span>
                    </div>
                    <button onClick={() => setAttendanceModalOpen(false)}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <div className="font-bold text-slate-900">{selectedAssignment.trip?.package?.name}</div>
                    {attendanceViewOnly ? (
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Data absensi {attendanceType === "DEPARTURE" ? "keberangkatan" : "kepulangan"}</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 mt-0.5">Centang ✓ peserta yang {attendanceType === "DEPARTURE" ? "hadir saat berangkat" : "hadir saat kembali"}.</div>
                    )}
                  </div>

                  {attendanceData.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p>Tidak ada data peserta untuk dihadiri.</p>
                      <p className="text-[11px] mt-1">Data absensi dibuat berdasarkan manifest booking.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* REQ-7.3: Tampilkan nomor WA customer di header absensi */}
                      {attendanceData.map((att: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-900">{att.participantName}</div>
                            <div className="text-[11px] font-mono text-slate-500">{att.identityNumber}</div>
                            {/* REQ-7.3: Nomor WA per peserta */}
                            {att.phone && (
                              <a
                                href={formatWhatsAppUrl(att.phone, `Halo ${att.participantName}, konfirmasi kehadiran untuk trip ${selectedAssignment.trip?.package?.name}.`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-0.5 hover:underline"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>{att.phone}</span>
                              </a>
                            )}
                          </div>
                          <label className={`flex items-center gap-2 ${attendanceViewOnly ? "cursor-default" : "cursor-pointer"}`}>
                            <span className="text-[11px] text-slate-600 font-medium">{att.isPresent ? "Hadir" : "Tidak Hadir"}</span>
                            <div className="relative">
                              <input type="checkbox" checked={att.isPresent}
                                onChange={(e) => {
                                  if (attendanceViewOnly) return;
                                  const updated = [...attendanceData];
                                  updated[idx] = { ...updated[idx], isPresent: e.target.checked };
                                  setAttendanceData(updated);
                                }}
                                disabled={attendanceViewOnly}
                                className="sr-only"
                              />
                              <div className={`w-10 h-6 rounded-full transition-colors ${att.isPresent ? "bg-emerald-500" : "bg-slate-300"} ${attendanceViewOnly ? "opacity-70" : ""}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all ${att.isPresent ? "left-5" : "left-1"}`} />
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                    <button onClick={() => setAttendanceModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">
                      {attendanceViewOnly ? "Tutup" : "Batal"}
                    </button>
                    {!attendanceViewOnly && (
                      <button onClick={handleSaveAttendance} disabled={savingAttendance || attendanceData.length === 0}
                        className={`flex-1 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all disabled:bg-slate-300 ${attendanceType === "DEPARTURE" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}>
                        {savingAttendance ? "Menyimpan..." : "Simpan Absensi"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REQ-5.3: Negosiasi Fee Modal */}
            {negotiateModalOpen && negotiatingAssignment && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                      <span>Ajukan Negosiasi Fee Tour Guide</span>
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 font-bold text-slate-900"
                        placeholder="Contoh: 600000"
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
                        placeholder="Contoh: Jumlah peserta rombongan lebih dari 20 orang / butuh persiapan khusus..."
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
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
                        className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
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
                currentUserRole="GUIDE"
                onFeeUpdated={fetchAssignments}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
