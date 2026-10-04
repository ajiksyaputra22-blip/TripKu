"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  MessageCircle,
  MessageSquare,
  UserPlus,
  Clock,
  Navigation,
  ChevronDown,
  ChevronUp,
  Upload,
  FileText,
  Check,
  X,
  CreditCard,
  Radio,
  Car,
  Compass,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bell,
  Coins,
  AlertCircle
} from "lucide-react";
import UnifiedAssignCrewModal from "@/components/UnifiedAssignCrewModal";
import { useToast } from "@/components/Toast";
import NegotiationChatModal from "@/components/NegotiationChatModal";

const TABS = [
  { id: "manifest", label: "Data Wisatawan & Pemesan", icon: Users },
  { id: "monitoring", label: "Monitoring Perjalanan (Live)", icon: Navigation },
  { id: "crew", label: "Penugasan Kru & Fee", icon: UserPlus },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface TravelPackageDetailProps {
  packageId?: string;
  onBack?: () => void;
  initialTab?: string;
}

export default function TravelPackageDetailPage({ packageId: propPackageId, onBack, initialTab }: TravelPackageDetailProps = {}) {
  const { toast } = useToast();
  const packageId = propPackageId || "";

  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>(
    (initialTab as TabId) && TABS.some(t => t.id === initialTab) ? (initialTab as TabId) : "manifest"
  );
  const [manifestView, setManifestView] = useState<"ALL_TOURISTS" | "BY_BOOKER">("ALL_TOURISTS");

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Live Chat Negosiasi Fee Modal
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatAssignmentId, setSelectedChatAssignmentId] = useState<string | null>(null);

  // Crew Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Checkpoint expand
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<Record<string, boolean>>({});

  // Pay fee modal (DP & Pelunasan)
  const [payFeeModalOpen, setPayFeeModalOpen] = useState(false);
  const [activeFeeId, setActiveFeeId] = useState<string | null>(null);
  const [payFeeTargetAssignment, setPayFeeTargetAssignment] = useState<any>(null);
  const [payFeeMode, setPayFeeMode] = useState<"DP" | "FULL" | "REMAINING">("DP");
  const [customDpAmount, setCustomDpAmount] = useState<string>("");
  const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
  const [payingFee, setPayingFee] = useState(false);

  // Negotiate respond (Travel Admin)
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [travelCounterFee, setTravelCounterFee] = useState("");
  const [travelCounterNote, setTravelCounterNote] = useState("");
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterAssignment, setCounterAssignment] = useState<any>(null);

  const fetchPackage = async () => {
    if (!packageId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/packages/${packageId}`);
      const data = await res.json();
      setPkg(data.package);
    } catch {
      setPkg(null);
      toast.error("Gagal memuat detail paket wisata.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!packageId) return;
    setLoadingApplications(true);
    try {
      const res = await fetch(`/api/apply?packageId=${packageId}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch {
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleApplicationAction = async (appId: string, action: "APPROVE" | "REJECT") => {
    setProcessingAppId(appId);
    try {
      const res = await fetch(`/api/apply/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(action === "APPROVE" ? "Kru berhasil disetujui & ditugaskan! Silakan buka Live Chat Negosiasi Fee." : "Lamaran kru ditolak.");
        await Promise.all([fetchPackage(), fetchApplications()]);
      } else {
        toast.error(data.error || "Gagal memproses lamaran kru.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setProcessingAppId(null);
    }
  };

  useEffect(() => {
    fetchPackage();
    if (activeTab === "crew") {
      fetchApplications();
    }
  }, [packageId, activeTab]);

  const toggleCheckpoints = (tripId: string) => {
    setExpandedCheckpoints((prev) => ({ ...prev, [tripId]: !prev[tripId] }));
  };

  const openAssignModal = (trip: any) => {
    setSelectedTrip(trip);
    setAssignModalOpen(true);
  };

  const openPayFeeModal = (feeId: string, assignment?: any, forcedMode?: "DP" | "FULL" | "REMAINING") => {
    setActiveFeeId(feeId);
    setPayFeeTargetAssignment(assignment || null);
    setFeeProofFile(null);
    const totalFee = assignment?.fee?.negotiatedAmount || assignment?.feeAmount || 500000;

    if (forcedMode) {
      setPayFeeMode(forcedMode);
    } else if (assignment?.fee?.dpPaid || assignment?.dpFeePaid) {
      setPayFeeMode("REMAINING");
    } else {
      setPayFeeMode("DP");
    }

    const defaultDp = Math.round(totalFee / 2);
    setCustomDpAmount(String(defaultDp));
    setPayFeeModalOpen(true);
  };

  const handlePayFee = async () => {
    if (!activeFeeId || !feeProofFile) {
      toast.warning("Wajib upload bukti transfer terlebih dahulu.");
      return;
    }
    setPayingFee(true);
    try {
      const fd = new FormData();
      fd.append("file", feeProofFile);
      fd.append("folder", "fee-proofs");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload bukti bayar.");

      const payload: any = {
        proofUrl: uploadData.url,
        paymentType: payFeeMode,
      };

      if (payFeeMode === "DP") {
        payload.dpAmount = parseFloat(customDpAmount) || undefined;
      }

      const res = await fetch(`/api/fees/${activeFeeId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Bukti transfer fee berhasil dikirim! Menunggu konfirmasi kru.");
        setPayFeeModalOpen(false);
        fetchPackage();
      } else {
        toast.error(data.error || "Gagal memproses fee.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses fee.");
    } finally {
      setPayingFee(false);
    }
  };

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
        toast.success(data.message || "Tanggapan negosiasi berhasil dikirim.");
        fetchPackage();
      } else {
        toast.error(data.error || "Gagal merespons negosiasi.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setRespondingId(null);
    }
  };

  const openCounterModal = (assignment: any) => {
    setCounterAssignment(assignment);
    setTravelCounterFee(String(assignment.fee?.negotiatedAmount || assignment.feeAmount || ""));
    setTravelCounterNote("");
    setCounterModalOpen(true);
  };

  const handleTravelCounter = async () => {
    if (!counterAssignment) return;
    setRespondingId(counterAssignment.id);
    try {
      const res = await fetch(`/api/assignments/${counterAssignment.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TRAVEL_COUNTER",
          counterFee: parseFloat(travelCounterFee),
          note: travelCounterNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Tawaran balik fee berhasil dikirim ke kru.");
        setCounterModalOpen(false);
        fetchPackage();
      } else {
        toast.error(data.error || "Gagal mengirim tawaran balik.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleInitTrip = async () => {
    if (!pkg) return;
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          scheduleDate: pkg.departureDate || new Date().toISOString(),
          destination: pkg.destination,
          vehicle: pkg.vehicle,
          operationalNotes: `Perjalanan rombongan: ${pkg.name}.`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Jadwal perjalanan rombongan berhasil diinisialisasi!");
        fetchPackage();
      } else {
        toast.error(data.error || "Gagal menginisialisasi perjalanan.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menginisialisasi trip.");
    }
  };

  // Aggregate all bookings (confirmed) for this package
  const confirmedBookings: any[] = pkg?.bookings || [];
  // All trips for this package
  const allTrips: any[] = pkg?.trips || [];
  const primaryTrip = allTrips[0] || null;

  // DP Crew reminders calculation (Setengah perjalanan pelunasan fee)
  const dpReminders = useMemo(() => {
    if (!pkg || !allTrips.length) return [];
    const reminders: any[] = [];

    allTrips.forEach((trip: any) => {
      const guideAssignment = (trip.assignments || [])
        .filter((a: any) => a.role === "GUIDE")
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      const driverAssignment = (trip.assignments || [])
        .filter((a: any) => a.role === "DRIVER")
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

      const activeAssignments = [guideAssignment, driverAssignment].filter(Boolean);

      activeAssignments.forEach((a: any) => {
        const isAccepted = a.status === "ACCEPTED";
        const isDpPaid = (a.fee?.paymentType === "DP" || a.dpFeePaid || a.fee?.dpPaid) && a.fee?.paymentStatus !== "PAID";
        if (isAccepted && isDpPaid) {
          const totalFee = a.fee?.negotiatedAmount || a.feeAmount || 500000;
          const dpAmount = a.fee?.dpAmount || a.dpFeeAmount || Math.round(totalFee / 2);
          const remainingAmount = a.fee?.remainingAmount || Math.max(0, totalFee - dpAmount);

          const departure = pkg.departureDate ? new Date(pkg.departureDate) : new Date(trip.scheduleDate);
          const durationDays = pkg.durationDays || 1;
          const midwayDays = Math.max(1, Math.round(durationDays / 2));

          const midwayDate = new Date(departure);
          midwayDate.setDate(midwayDate.getDate() + midwayDays);

          const now = new Date();
          const isMidwayReached = trip.status === "ON_GOING" || trip.status === "COMPLETED" || (now >= midwayDate);

          reminders.push({
            assignment: a,
            trip,
            totalFee,
            dpAmount,
            remainingAmount,
            midwayDate,
            isMidwayReached,
            workerName: a.worker?.name || "Kru",
            role: a.role === "GUIDE" ? "Tour Guide" : "Driver",
          });
        }
      });
    });
    return reminders;
  }, [pkg, allTrips]);

  // Flatten and aggregate ALL individual tourists across all bookings for this destination package
  const allTourists = useMemo(() => {
    const list: any[] = [];
    confirmedBookings.forEach((b) => {
      if (b.participants && b.participants.length > 0) {
        b.participants.forEach((p: any, idx: number) => {
          list.push({
            id: p.id,
            name: p.name,
            identityNumber: p.identityNumber,
            phone: p.phone || (idx === 0 ? b.customer?.phone : null),
            birthDate: p.birthDate,
            emergencyContact: p.emergencyContact,
            isPrimaryBooker: idx === 0,
            bookerName: b.customer?.name,
            bookerPhone: b.customer?.phone,
            bookerEmail: b.customer?.email,
            bookingCode: b.bookingCode,
            bookingStatus: b.status,
            paymentStatus: b.dpPaid ? (b.status === "CONFIRMED" ? "LUNAS" : "DP DIVERIFIKASI") : b.status,
          });
        });
      } else if (b.customer) {
        list.push({
          id: b.id,
          name: b.customer.name,
          identityNumber: b.customer.nik || "—",
          phone: b.customer.phone,
          birthDate: null,
          emergencyContact: null,
          isPrimaryBooker: true,
          bookerName: b.customer.name,
          bookerPhone: b.customer.phone,
          bookerEmail: b.customer.email,
          bookingCode: b.bookingCode,
          bookingStatus: b.status,
          paymentStatus: b.dpPaid ? (b.status === "CONFIRMED" ? "LUNAS" : "DP DIVERIFIKASI") : b.status,
        });
      }
    });
    return list;
  }, [confirmedBookings]);

  const handleCopyAllPhoneNumbers = async () => {
    const phones = allTourists
      .map((t) => t.phone)
      .filter(Boolean)
      .map((p) => p.replace(/\D/g, ""));
    const uniquePhones = Array.from(new Set(phones));
    if (uniquePhones.length === 0) {
      toast.warning("Belum ada nomor WhatsApp yang terdaftar pada rombongan ini.");
      return;
    }
    try {
      await navigator.clipboard.writeText(uniquePhones.join(", "));
      toast.success(`${uniquePhones.length} nomor WhatsApp rombongan berhasil disalin ke clipboard!`);
    } catch {
      toast.error("Gagal menyalin ke clipboard. Coba klik pada halaman terlebih dahulu.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-500 text-sm">Paket wisata tidak ditemukan.</p>
        {onBack ? (
          <button onClick={onBack} className="text-emerald-600 underline text-sm font-bold cursor-pointer">
            Kembali ke Dashboard
          </button>
        ) : (
          <Link href="/travel/dashboard" className="text-emerald-600 underline text-sm font-bold">
            Kembali ke Dashboard
          </Link>
        )}
      </div>
    );
  }

  const paxFilled = Math.max(0, pkg.capacity - (pkg.quotaLeft || 0));
  const fillPercent = Math.min(100, Math.round((paxFilled / pkg.capacity) * 100));

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </button>
        ) : (
          <Link
            href="/travel/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        )}

        {/* ================= HEADER KETERANGAN PAKET DESTINASI (SATU PINTU) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden mb-6">
          <div className="relative h-48 sm:h-64 w-full bg-slate-200 overflow-hidden">
            {pkg.coverImage && (
              <img src={pkg.coverImage} alt={pkg.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white">
                    {pkg.category || "WISATA_ALAM"}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {pkg.destination}
                    {pkg.originCity && <span className="opacity-90">• Asal {pkg.originCity}</span>}
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-white">
                  {pkg.name}
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl line-clamp-1">
                  {pkg.description}
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0 self-start sm:self-auto">
                {(() => {
                  const isCompleted = pkg.status === "COMPLETED" || (pkg.quotaLeft !== undefined && pkg.quotaLeft <= 0) || (pkg.trips && pkg.trips.length > 0 && pkg.trips.every((t: any) => t.status === "COMPLETED"));
                  const isInactive = !isCompleted && pkg.status === "INACTIVE";

                  if (isCompleted) {
                    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-white shadow-xs">STATUS: SELESAI</span>;
                  }
                  if (isInactive) {
                    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">STATUS: NONAKTIF</span>;
                  }
                  return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">STATUS: AKTIF</span>;
                })()}
              </div>
            </div>
          </div>

          {/* Keterangan & Indikator Kuota Rombongan Satu Pintu */}
          <div className="p-5 bg-white border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Spesifikasi Paket */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{pkg.durationDays} Hari Perjalanan</span>
              </span>
              <span className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>{pkg.vehicle || "Armada Pariwisata AC"}</span>
              </span>
              <span className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900">{formatRupiah(pkg.price)}</span>
                <span className="text-slate-400">/orang</span>
              </span>
              {pkg.accommodation && (
                <span className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span>🏨 {pkg.accommodation}</span>
                </span>
              )}
            </div>

            {/* Visual Kuota Terkumpul Rombongan (Satu Pintu) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 min-w-[280px] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-950 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kapasitas Rombongan:</span>
                </span>
                <span className="text-emerald-800 font-extrabold font-mono">
                  {paxFilled} / {pkg.capacity} Pax ({fillPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-emerald-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                <span>Total Pemesan: <strong>{confirmedBookings.length} Customer</strong></span>
                <span>Sisa: <strong>{pkg.quotaLeft} Kursi</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 flex-wrap mb-6 border-b border-slate-200 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.id === "manifest" ? allTourists.length :
                tab.id === "crew" ? (primaryTrip?.assignments?.length || 0) : null;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: DATA WISATAWAN & PEMESAN (SATU PINTU) ================= */}
        {activeTab === "manifest" && (
          <div className="space-y-6">
            {/* Top Toolbar / Recap Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Daftar Wisatawan</span>
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Switcher */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setManifestView("ALL_TOURISTS")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${manifestView === "ALL_TOURISTS"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Semua Wisatawan ({allTourists.length})
                  </button>
                  <button
                    onClick={() => setManifestView("BY_BOOKER")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${manifestView === "BY_BOOKER"
                      ? "bg-white text-emerald-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Per Akun Pemesan ({confirmedBookings.length})
                  </button>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {allTourists.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Belum ada wisatawan yang mendaftar pada paket ini.</p>
                <p className="max-w-md mx-auto">
                  Customer yang melakukan booking dan menyelesaikan pembayaran DP / Lunas akan otomatis muncul terkumpul di sini.
                </p>
              </div>
            ) : manifestView === "ALL_TOURISTS" ? (
              /* VIEW: ALL TOURISTS TABLE*/
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Manifest Rombongan: Seluruh Data Wisatawan & No. WhatsApp
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Total {allTourists.length} dari kapasitas {pkg.capacity} orang
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4 w-12 text-center">#</th>
                        <th className="p-4">Nama Wisatawan</th>
                        <th className="p-4">NIK / No. Identitas</th>
                        <th className="p-4">Tgl Lahir / Usia</th>
                        <th className="p-4">Nomor WhatsApp (Klik Langsung)</th>
                        <th className="p-4">Pemesan Utama & Booking</th>
                        <th className="p-4">Kontak Darurat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allTourists.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 text-center font-mono text-slate-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {t.isPrimaryBooker ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                  Pemesan Utama
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  Peserta rombongan
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-medium text-slate-700">
                            {t.identityNumber || "—"}
                          </td>
                          <td className="p-4 text-slate-600">
                            {t.birthDate ? formatDate(new Date(t.birthDate)) : "—"}
                          </td>
                          <td className="p-4">
                            {t.phone ? (
                              <a
                                href={formatWhatsAppUrl(
                                  t.phone,
                                  `Halo Kak ${t.name}, kami dari Tim Agensi Travel terkait perjalanan paket ${pkg.name} (Kode: ${t.bookingCode}). Kami ingin mengonfirmasi persiapan keberangkatan Anda.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition-all shadow-2xs group"
                                title="Klik untuk membuka chat WhatsApp langsung"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>{t.phone}</span>
                                <span className="text-[10px] text-emerald-600 ml-1 font-normal underline">Chat WA</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No HP belum ada</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-800">{t.bookerName}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">#{t.bookingCode}</div>
                            <span className="inline-block px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 mt-0.5">
                              {t.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            {t.emergencyContact || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* VIEW: BY BOOKER CARDS */
              <div className="space-y-4">
                {confirmedBookings.map((booking: any) => (
                  <div key={booking.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Booking Header */}
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{booking.customer?.name || "Customer"}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">#{booking.bookingCode}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${booking.status === "CONFIRMED" || booking.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                            }`}>{booking.status}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {booking.participantCount} Orang Terdaftar • Total {formatRupiah(booking.totalPrice)}
                        </div>
                      </div>

                      {/* WhatsApp Button */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {booking.customer?.phone ? (
                          <a
                            href={formatWhatsAppUrl(
                              booking.customer.phone,
                              `Halo ${booking.customer.name}, kami dari Tim Agensi Travel terkait perjalanan paket ${pkg.name} (Booking: ${booking.bookingCode}). Kami ingin mengonfirmasi data rombongan.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat WA Pemesan ({booking.customer.phone})</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No HP belum tersedia</span>
                        )}
                      </div>
                    </div>

                    {/* Participants Table */}
                    {booking.participants && booking.participants.length > 0 && (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="text-left text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                              <th className="pb-2 pr-4">#</th>
                              <th className="pb-2 pr-4">Nama Peserta</th>
                              <th className="pb-2 pr-4">NIK (16 Digit)</th>
                              <th className="pb-2 pr-4">Tgl Lahir</th>
                              <th className="pb-2 pr-4">No. HP / WhatsApp</th>
                              <th className="pb-2">Kontak Darurat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {booking.participants.map((p: any, i: number) => (
                              <tr key={p.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 pr-4 text-slate-400 font-mono">{i + 1}</td>
                                <td className="py-2.5 pr-4 font-semibold text-slate-900">{p.name}</td>
                                <td className="py-2.5 pr-4 font-mono text-slate-600">{p.identityNumber || "—"}</td>
                                <td className="py-2.5 pr-4 text-slate-600">
                                  {p.birthDate ? formatDate(new Date(p.birthDate)) : "—"}
                                </td>
                                <td className="py-2.5 pr-4">
                                  {p.phone ? (
                                    <a
                                      href={formatWhatsAppUrl(p.phone, `Halo ${p.name}, konfirmasi perjalanan paket wisata ${pkg.name}.`)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      {p.phone}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 text-slate-500">{p.emergencyContact || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MONITORING PERJALANAN ================= */}
        {activeTab === "monitoring" && (
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-600" />
                  <span>Monitoring Perjalanan Rombongan</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Posisi dan checkpoint rombongan wisatawan paket ini yang dilaporkan secara langsung oleh Tour Guide dan Driver.
                </p>
              </div>

              {!primaryTrip && (
                <button
                  type="button"
                  onClick={handleInitTrip}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
                >
                  Inisialisasi Rombongan Perjalanan
                </button>
              )}
            </div>

            {!primaryTrip ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-3">
                <Navigation className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">Jadwal Perjalanan Rombongan Belum Diaktifkan</p>
                <p className="max-w-md mx-auto">
                  Klik tombol <strong>"Inisialisasi Rombongan Perjalanan"</strong> di atas atau tunggu konfirmasi pembayaran pertama untuk membuka sistem monitoring checkpoint.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Trip Live Card */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(primaryTrip.status).className}`}>
                          {getStatusBadge(primaryTrip.status).label}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Rombongan: {pkg.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Keberangkatan: {formatDate(primaryTrip.scheduleDate)}
                        </span>
                        <span>•</span>
                        <span>Total Rombongan: {allTourists.length} Wisatawan</span>
                      </div>
                    </div>

                    <Link
                      href={`/customer/trip-room/${primaryTrip.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Buka Trip Room Rombongan</span>
                    </Link>
                  </div>

                  {/* Live Checkpoint Box */}
                  <div className="p-5 space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-3.5 w-3.5 relative shrink-0">
                          {primaryTrip.status === "ONGOING" && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600" />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            Posisi Lokasi Rombongan Terkini:
                          </span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                            {primaryTrip.currentLocation || "Menunggu kru memulai pelaporan titik keberangkatan"}
                          </span>
                          {primaryTrip.checkpoints?.[0] && (
                            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                              Update terakhir: {formatDateTime(primaryTrip.checkpoints[0].reportedAt)} oleh {primaryTrip.checkpoints[0].user?.name} ({primaryTrip.checkpoints[0].user?.role})
                            </span>
                          )}
                        </div>
                      </div>

                      {primaryTrip.checkpoints && primaryTrip.checkpoints.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleCheckpoints(primaryTrip.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-50 flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors self-start sm:self-center cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{primaryTrip.checkpoints.length} Titik Dilaporkan</span>
                          {expandedCheckpoints[primaryTrip.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Timeline Checkpoints */}
                    {expandedCheckpoints[primaryTrip.id] && primaryTrip.checkpoints && primaryTrip.checkpoints.length > 0 && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Linimasa Checkpoint Perjalanan:
                        </span>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {primaryTrip.checkpoints.map((cp: any) => (
                            <div key={cp.id} className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-start justify-between gap-3 shadow-2xs">
                              <div>
                                <span className="font-bold text-slate-900">{cp.location}</span>
                                {cp.note && <p className="text-[11px] text-slate-600 italic mt-0.5">"{cp.note}"</p>}
                                <span className="text-[10px] text-slate-400 block mt-1">
                                  dilaporkan oleh {cp.user?.name} ({cp.user?.role})
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                {formatDateTime(cp.reportedAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Planned Route Checkpoints */}
                    {pkg.checkpointRoute && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                          Rencana Titik Destinasi Perjalanan:
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          {(Array.isArray(pkg.checkpointRoute)
                            ? pkg.checkpointRoute
                            : JSON.parse(pkg.checkpointRoute || "[]")
                          ).map((pt: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200"
                            >
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{idx + 1}. {pt}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PENUGASAN KRU & FEE ================= */}
        {activeTab === "crew" && (
          <div className="space-y-6">
            {/* DP & PELUNASAN FEE REMINDERS BANNER */}
            {dpReminders.length > 0 && (
              <div className="space-y-3">
                {dpReminders.map((rem: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-all ${rem.isMidwayReached
                      ? "bg-amber-500/10 border-amber-300 text-amber-950 ring-2 ring-amber-400/40 animate-pulse"
                      : "bg-blue-50/80 border-blue-200 text-blue-950"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${rem.isMidwayReached ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                        }`}>
                        {rem.isMidwayReached ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${rem.isMidwayReached ? "bg-amber-200 text-amber-900" : "bg-blue-200 text-blue-900"
                            }`}>
                            {rem.isMidwayReached ? "🚨 Waktunya Pelunasan Fee" : "ℹ️ Pengingat DP Fee Kru"}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {rem.workerName} ({rem.role})
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                          {rem.isMidwayReached ? (
                            <>
                              Perjalanan telah memasuki <strong>setengah jadwal/rute</strong>. Admin Travel wajib melakukan <strong>Pelunasan Sisa Fee sebesar {formatRupiah(rem.remainingAmount)}</strong> (DP {formatRupiah(rem.dpAmount)} telah diterima).
                            </>
                          ) : (
                            <>
                              DP Fee sebesar <strong>{formatRupiah(rem.dpAmount)}</strong> sudah dibayarkan. Sisa fee sebesar <strong>{formatRupiah(rem.remainingAmount)}</strong> wajib dilunasi saat perjalanan mencapai setengah rute (estimasi: {formatDate(rem.midwayDate)}).
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openPayFeeModal(rem.assignment.fee?.id || rem.assignment.id, rem.assignment, "REMAINING")}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0 self-stretch sm:self-auto justify-center cursor-pointer transition-transform hover:scale-[1.02] ${rem.isMidwayReached
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Bayar Pelunasan ({formatRupiah(rem.remainingAmount)})</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>Penugasan Kru Pendamping &amp; Manajemen Fee</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tugaskan Tour Guide dan Driver berpengalaman. Mendukung pembayaran DP awal dan pelunasan di setengah perjalanan.
                </p>
              </div>

              {primaryTrip && (
                <button
                  type="button"
                  onClick={() => openAssignModal(primaryTrip)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tugaskan Kru Baru</span>
                </button>
              )}
            </div>

            {!primaryTrip ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
                <UserPlus className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-600 text-sm">Trip Belum Diinisialisasi</p>
                <p className="max-w-md mx-auto">
                  Silakan inisialisasi perjalanan rombongan terlebih dahulu pada tab Monitoring untuk mulai menugaskan kru.
                </p>
              </div>
            ) : (() => {
              // Pastikan hanya tepat 1 Tour Guide dan 1 Driver terbaru/aktif yang ditampilkan
              const guideAssignment = (primaryTrip.assignments || [])
                .filter((a: any) => a.role === "GUIDE")
                .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

              const driverAssignment = (primaryTrip.assignments || [])
                .filter((a: any) => a.role === "DRIVER")
                .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

              if (!guideAssignment && !driverAssignment) {
                return (
                  <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-3">
                    <Users className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Belum Ada Kru yang Ditugaskan</p>
                    <p className="max-w-md mx-auto">
                      Klik tombol <strong>"Tugaskan Kru Baru"</strong> untuk memilih Tour Guide dan Driver terverifikasi di sistem.
                    </p>
                    <button
                      type="button"
                      onClick={() => openAssignModal(primaryTrip)}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Tugaskan Tour Guide &amp; Driver</span>
                    </button>
                  </div>
                );
              }

              const renderCrewCard = (role: "GUIDE" | "DRIVER", a: any) => {
                if (!a) {
                  return (
                    <div
                      key={role}
                      className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center gap-3"
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${role === "GUIDE" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                        {role === "GUIDE" ? <Compass className="w-6 h-6" /> : <Car className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {role === "GUIDE" ? "Tour Guide (Pemandu Wisata)" : "Driver Wisata (Armada)"}
                        </h4>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Belum Ditugaskan
                        </span>
                        <p className="text-xs text-slate-500 mt-2 max-w-xs">
                          {role === "GUIDE"
                            ? "Belum ada pemandu wisata yang ditugaskan untuk rombongan paket ini."
                            : "Belum ada pengemudi armada yang ditugaskan untuk rombongan paket ini."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAssignModal(primaryTrip)}
                        className="mt-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tugaskan {role === "GUIDE" ? "Tour Guide" : "Driver"}</span>
                      </button>
                    </div>
                  );
                }

                const isNegotiating = a.status === "NEGOTIATING";
                const isPaid = a.fee?.paymentStatus === "PAID";
                const isDpPaid = (a.fee?.paymentType === "DP" || a.dpFeePaid || a.fee?.dpPaid) && !isPaid;
                const totalFee = a.fee?.negotiatedAmount || a.feeAmount || 500000;
                const dpAmount = a.fee?.dpAmount || a.dpFeeAmount || Math.round(totalFee / 2);
                const remainingAmount = a.fee?.remainingAmount || Math.max(0, totalFee - dpAmount);

                return (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border flex flex-col gap-3 text-xs ${isNegotiating
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    {/* Worker Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${a.role === "GUIDE" ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"
                          }`}>
                          {a.role === "GUIDE" ? <Compass className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{a.worker?.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                            {a.role === "GUIDE" ? "Tour Guide" : "Driver"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${a.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          a.status === "NEGOTIATING" ? "bg-amber-100 text-amber-800 border-amber-200 animate-pulse" :
                            a.status === "REJECTED" ? "bg-rose-100 text-rose-700 border-rose-200" :
                              "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                          {a.status === "NEGOTIATING" ? "💬 Negosiasi Fee" : a.status === "ACCEPTED" ? "Diterima" : a.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isPaid ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          isDpPaid ? "bg-blue-100 text-blue-800 border-blue-200" :
                            a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                          {isPaid ? "Fee Lunas" : isDpPaid ? "DP Terbayar (Sisa Belum)" : a.fee?.paymentStatus === "WAITING_CONFIRMATION" ? "Menunggu Konfirmasi" : "Belum Dibayar"}
                        </span>
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Total Fee Disepakati:</span>
                        <span className="font-bold text-slate-900">{formatRupiah(totalFee)}</span>
                      </div>
                      {isDpPaid && (
                        <>
                          <div className="flex items-center justify-between text-blue-700 font-semibold text-[11px] pt-1 border-t border-slate-100">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              <span>DP Awal (Dibayar):</span>
                            </span>
                            <span>{formatRupiah(dpAmount)}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-800 font-semibold text-[11px]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Sisa Pelunasan Wajib (1/2 Trip):</span>
                            </span>
                            <span>{formatRupiah(remainingAmount)}</span>
                          </div>
                        </>
                      )}
                      {!isDpPaid && !isPaid && (
                        <div className="text-[10px] text-slate-400 italic">
                          Opsi pembayaran: Bisa bayar DP (50%) terlebih dahulu atau langsung bayar lunas.
                        </div>
                      )}
                    </div>

                    {/* Bank Account */}
                    {a.worker?.workerProfile?.bankAccount ? (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-[11px] space-y-0.5">
                        <div className="text-slate-400 font-medium">Rekening Pencairan Fee:</div>
                        <div className="font-bold text-slate-800">
                          {a.worker.workerProfile.bankName || "BCA"} — <span className="font-mono text-emerald-800">{a.worker.workerProfile.bankAccount}</span>
                        </div>
                        <div className="text-slate-500">
                          a/n {a.worker.workerProfile.bankHolder || a.worker.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Kru belum melengkapi nomor rekening.</div>
                    )}

                    {/* Live Chat Negosiasi Fee Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChatAssignmentId(a.id);
                          setChatModalOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        title="Buka live chat negosiasi dan masukkan harga fix"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>💬 Live Chat Negosiasi Fee &amp; Tetapkan Harga Fix</span>
                      </button>
                    </div>

                    {/* Pay Fee Actions */}
                    {!isPaid && a.status === "ACCEPTED" && a.fee && (
                      <div>
                        {a.fee.paymentStatus === "WAITING_CONFIRMATION" ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Menunggu Konfirmasi Kru</span>
                            </span>
                            {a.fee.proofUrl && (
                              <a
                                href={a.fee.proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                Lihat Bukti Bayar
                              </a>
                            )}
                          </div>
                        ) : isDpPaid ? (
                          <button
                            onClick={() => openPayFeeModal(a.fee.id, a, "REMAINING")}
                            className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>💳 Bayar Pelunasan Sisa Fee ({formatRupiah(remainingAmount)})</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openPayFeeModal(a.fee.id, a)}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderCrewCard("GUIDE", guideAssignment)}
                  {renderCrewCard("DRIVER", driverAssignment)}
                </div>
              );
            })()}

            {/* ================= DAFTAR PELAMAR KERJA KRU (BURSA LAMARAN) ================= */}
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>Daftar Pelamar Kerja Kru (Tour Guide &amp; Driver)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800">
                      {applications.length} Pelamar
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tour Guide dan Driver yang mengajukan lamaran kerja mandiri untuk memandu atau mengemudi paket wisata ini.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchApplications}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Segarkan Pelamar
                </button>
              </div>

              {loadingApplications ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  <span className="text-xs text-slate-400 block mt-2">Memuat daftar pelamar...</span>
                </div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">Belum ada kru yang melamar ke paket wisata ini.</p>
                  <p className="max-w-md mx-auto text-[11px]">
                    Paket wisata yang berstatus AKTIF akan otomatis muncul di Bursa Lowongan Tour Guide &amp; Driver sesuai kesesuaian domisili.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {applications.map((app) => {
                    const isGuide = app.role === "GUIDE";
                    const isPending = app.status === "PENDING";
                    const isApproved = app.status === "APPROVED";
                    const isRejected = app.status === "REJECTED";
                    const profile = app.worker?.workerProfile;
                    const isProcessing = processingAppId === app.id;

                    // Check if assignment exists for this worker
                    const linkedAssignment = primaryTrip?.assignments?.find(
                      (as: any) => as.workerId === app.workerId
                    );

                    return (
                      <div
                        key={app.id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 text-xs bg-white ${isApproved
                          ? "border-emerald-200 bg-emerald-50/20"
                          : isRejected
                            ? "border-slate-200 bg-slate-50/60 opacity-75"
                            : "border-slate-200 shadow-xs"
                          }`}
                      >
                        <div className="space-y-3">
                          {/* Top row: Role, Badge, Date */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isGuide ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"
                                  }`}
                              >
                                {isGuide ? <Compass className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 block text-sm">
                                  {app.worker?.name}
                                </span>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{profile?.domicile || "Domisili belum diatur"}</span>
                                  <span>•</span>
                                  <span>⭐ {profile?.rating?.toFixed(1) || "5.0"}</span>
                                </span>
                              </div>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${isApproved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : isRejected
                                  ? "bg-rose-100 text-rose-700 border-rose-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                            >
                              {isApproved ? "✓ Diterima" : isRejected ? "Ditolak" : "Menunggu Review"}
                            </span>
                          </div>

                          {/* Credentials snippet */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Posisi Melamar:</span>
                              <span className="font-bold text-slate-800">
                                {isGuide ? "Tour Guide Wisata" : "Driver Armada"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Pengalaman Kerja:</span>
                              <span className="font-bold text-slate-800">
                                {profile?.experienceYears ? `${profile.experienceYears} Tahun` : "Baru Mulai"}
                              </span>
                            </div>
                            {profile?.bankName && (
                              <div className="col-span-2 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-400 block text-[10px]">Rekening Bank:</span>
                                <span className="font-medium text-slate-700">
                                  {profile.bankName} - {profile.bankAccount} (a/n {profile.bankHolder || app.worker?.name})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Motivation message */}
                          {app.message && (
                            <div className="p-2.5 rounded-xl bg-teal-50/50 border border-teal-100 text-[11px]">
                              <span className="text-teal-900 font-semibold block text-[10px] mb-0.5">
                                Catatan Lamaran &amp; Motivasi:
                              </span>
                              <p className="text-slate-700 italic leading-relaxed">
                                "{app.message}"
                              </p>
                            </div>
                          )}

                          {/* Direct WhatsApp link */}
                          {app.worker?.phone && (
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-slate-500">Kontak Kru:</span>
                              <a
                                href={formatWhatsAppUrl(
                                  app.worker.phone,
                                  `Halo ${app.worker.name}, kami dari ${pkg.travel?.businessName || "Travel Agency"} menindaklanjuti lamaran Anda untuk paket ${pkg.name}.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>WA: {app.worker.phone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100">
                          {isPending ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApplicationAction(app.id, "REJECT")}
                                className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold disabled:opacity-50 cursor-pointer"
                              >
                                Tolak
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApplicationAction(app.id, "APPROVE")}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isProcessing ? "Memproses..." : "Terima & Tugaskan Kru"}</span>
                              </button>
                            </div>
                          ) : isApproved && linkedAssignment ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChatAssignmentId(linkedAssignment.id);
                                setChatModalOpen(true);
                              }}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>💬 Buka Live Chat Negosiasi Kru Ini</span>
                            </button>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic text-center py-1">
                              {isApproved ? "Lamaran telah diterima dan ditugaskan." : "Lamaran ditolak."}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Pay Fee Modal Dialog (DP & Pelunasan & Full) */}
      {payFeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${payFeeMode === "DP" ? "bg-blue-100 text-blue-700" :
                  payFeeMode === "REMAINING" ? "bg-amber-100 text-amber-700" :
                    "bg-emerald-100 text-emerald-700"
                  }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {payFeeMode === "DP" ? "Pembayaran DP Fee Kru (Awal)" :
                      payFeeMode === "REMAINING" ? "Pelunasan Sisa Fee Kru (1/2 Perjalanan)" :
                        "Pembayaran Fee Penuh (Langsung Lunas)"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {payFeeTargetAssignment?.worker?.name || "Kru"} ({payFeeTargetAssignment?.role === "GUIDE" ? "Tour Guide" : "Driver"})
                  </p>
                </div>
              </div>
              <button onClick={() => setPayFeeModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher if not already in REMAINING mode */}
            {payFeeMode !== "REMAINING" && (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setPayFeeMode("DP")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${payFeeMode === "DP"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Bayar DP Dahulu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayFeeMode("FULL")}
                  className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${payFeeMode === "FULL"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bayar Lunas (100%)</span>
                </button>
              </div>
            )}

            {/* Payment Summary & Calculations */}
            {(() => {
              const totalFee = payFeeTargetAssignment?.fee?.negotiatedAmount || payFeeTargetAssignment?.feeAmount || 500000;
              const curDpAmount = parseFloat(customDpAmount) || Math.round(totalFee / 2);
              const remainingVal = payFeeMode === "REMAINING"
                ? (payFeeTargetAssignment?.fee?.remainingAmount || Math.max(0, totalFee - (payFeeTargetAssignment?.fee?.dpAmount || payFeeTargetAssignment?.dpFeeAmount || Math.round(totalFee / 2))))
                : Math.max(0, totalFee - curDpAmount);

              const transferAmount = payFeeMode === "DP"
                ? curDpAmount
                : payFeeMode === "REMAINING"
                  ? remainingVal
                  : totalFee;

              return (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Fee Disepakati:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(totalFee)}</span>
                    </div>

                    {payFeeMode === "DP" && (
                      <>
                        <div className="pt-2 border-t border-slate-200/80">
                          <label className="block text-slate-700 font-bold mb-1">
                            Nominal DP yang Ditransfer (Rp):
                          </label>
                          <input
                            type="number"
                            value={customDpAmount}
                            onChange={(e) => setCustomDpAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Contoh: 250000"
                            min={50000}
                            max={totalFee}
                          />
                          <div className="flex gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => setCustomDpAmount(String(Math.round(totalFee * 0.5)))}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold cursor-pointer"
                            >
                              50% ({formatRupiah(Math.round(totalFee * 0.5))})
                            </button>
                            <button
                              type="button"
                              onClick={() => setCustomDpAmount(String(Math.round(totalFee * 0.3)))}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold cursor-pointer"
                            >
                              30% ({formatRupiah(Math.round(totalFee * 0.3))})
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between text-amber-800 font-semibold pt-1 border-t border-slate-200/60">
                          <span>Sisa Pelunasan Wajib (Saat 1/2 Perjalanan):</span>
                          <span>{formatRupiah(remainingVal)}</span>
                        </div>
                      </>
                    )}

                    {payFeeMode === "REMAINING" && (
                      <div className="pt-1 border-t border-slate-200/60 flex justify-between text-amber-800 font-semibold">
                        <span>Nominal Pelunasan Wajib:</span>
                        <span className="text-sm font-extrabold text-amber-900">{formatRupiah(remainingVal)}</span>
                      </div>
                    )}

                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between font-extrabold text-xs">
                      <span>Total Ditransfer Sekarang:</span>
                      <span className="text-sm text-emerald-800">{formatRupiah(transferAmount)}</span>
                    </div>
                  </div>

                  {/* Kru Bank Account */}
                  {payFeeTargetAssignment?.worker?.workerProfile?.bankAccount ? (
                    <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs space-y-1">
                      <div className="text-teal-900 font-bold flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-teal-600" />
                        <span>Rekening Tujuan Transfer Kru:</span>
                      </div>
                      <div className="font-mono text-sm font-extrabold text-slate-900">
                        {payFeeTargetAssignment.worker.workerProfile.bankName || "BCA"} — {payFeeTargetAssignment.worker.workerProfile.bankAccount}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Atas Nama: <strong>{payFeeTargetAssignment.worker.workerProfile.bankHolder || payFeeTargetAssignment.worker.name}</strong>
                      </div>
                    </div>
                  ) : null}

                  {/* Flow Guide Alert */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                    {payFeeMode === "DP" && (
                      <span>💡 <strong>Alur Pembayaran DP:</strong> Setelah DP ditransfer, status fee kru akan tercatat sebagai DP aktif. Sistem akan memberikan pengingat otomatis bagi Admin Travel untuk melunasi sisa fee saat perjalanan mencapai setengah rute.</span>
                    )}
                    {payFeeMode === "REMAINING" && (
                      <span>💡 <strong>Alur Pelunasan:</strong> Transfer sisa fee kepada kru dan upload bukti transfer. Kru akan mengonfirmasi penerimaan dan status fee menjadi LUNAS.</span>
                    )}
                    {payFeeMode === "FULL" && (
                      <span>💡 <strong>Alur Fee Penuh:</strong> Transfer fee 100% langsung lunas kepada kru. Status fee akan berubah menjadi LUNAS setelah kru mengonfirmasi penerimaan.</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Proof Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Upload Bukti Transfer Bank:
              </label>
              <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${feeProofFile ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 bg-slate-50"
                }`}>
                {feeProofFile ? (
                  <>
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-800 truncate flex-1">{feeProofFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500">Pilih file foto/struk transfer (JPG, PNG, PDF)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setFeeProofFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayFeeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePayFee}
                disabled={payingFee || !feeProofFile}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                {payingFee ? "Mengupload..." : payFeeMode === "DP" ? "Kirim Bukti DP" : payFeeMode === "REMAINING" ? "Kirim Bukti Pelunasan" : "Kirim Bukti Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Counter Fee Modal Dialog */}
      {counterModalOpen && counterAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Tawar Balik Fee Kru</h3>
              <button onClick={() => setCounterModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <span className="text-slate-500">Kru: <strong>{counterAssignment.worker?.name}</strong></span>
              <span className="block text-slate-500">Tawaran Kru Saat Ini: <strong className="text-amber-800">{formatRupiah(counterAssignment.fee?.negotiatedAmount || counterAssignment.feeAmount)}</strong></span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Tawaran Balik (Rp)</label>
              <input
                type="number"
                value={travelCounterFee}
                onChange={(e) => setTravelCounterFee(e.target.value)}
                placeholder="Contoh: 350000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Negosiasi (Opsional)</label>
              <textarea
                rows={2}
                value={travelCounterNote}
                onChange={(e) => setTravelCounterNote(e.target.value)}
                placeholder="Alasan penyesuaian nominal fee..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCounterModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleTravelCounter}
                disabled={!travelCounterFee || respondingId === counterAssignment.id}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                Kirim Tawaran Balik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Crew Modal */}
      {selectedTrip && (
        <UnifiedAssignCrewModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          trip={selectedTrip}
          onSuccess={() => fetchPackage()}
        />
      )}

      {/* Live Chat Negosiasi Fee Modal */}
      {chatModalOpen && selectedChatAssignmentId && (
        <NegotiationChatModal
          assignmentId={selectedChatAssignmentId}
          isOpen={chatModalOpen}
          onClose={() => {
            setChatModalOpen(false);
            setSelectedChatAssignmentId(null);
          }}
          currentUserRole="TRAVEL"
          onFeeUpdated={fetchPackage}
        />
      )}
    </div>
  );
}
