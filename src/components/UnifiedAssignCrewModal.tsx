"use client";

import { useState, useEffect, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  X,
  Compass,
  Car,
  CreditCard,
  AlertCircle,
  Users,
  Search,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Check,
  Edit3
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface UnifiedAssignCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  onSuccess?: () => void;
}

export default function UnifiedAssignCrewModal({
  isOpen,
  onClose,
  trip,
  onSuccess,
}: UnifiedAssignCrewModalProps) {
  const { toast } = useToast();
  // Step state: "GUIDE" first, then "DRIVER"
  const [currentStep, setCurrentStep] = useState<"GUIDE" | "DRIVER">("GUIDE");

  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);

  // Domicile and Name Search filter states
  const [domicileFilter, setDomicileFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  // Guide state
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [guideFee, setGuideFee] = useState("500000");
  const [guideAgreement, setGuideAgreement] = useState("");

  // Driver state
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [driverFee, setDriverFee] = useState("350000");
  const [driverAgreement, setDriverAgreement] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Trip destination for domicile quick-match
  const tripDestination = trip?.package?.destination || trip?.destination || "";

  // Deteksi status penugasan yang sudah ada pada trip
  const existingGuide = trip?.assignments
    ?.filter((a: any) => a.role === "GUIDE")
    ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
  const existingDriver = trip?.assignments
    ?.filter((a: any) => a.role === "DRIVER")
    ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

  const guideAccepted = existingGuide?.status === "ACCEPTED";
  const driverAccepted = existingDriver?.status === "ACCEPTED";
  const guideRejected = existingGuide?.status === "REJECTED";
  const driverRejected = existingDriver?.status === "REJECTED";

  // Mode pencarian sesuai revisi:
  // 1. Jika dua-duanya menolak atau dua-duanya belum ada: wajib mengulang mencari kru kembali
  // 2. Jika salah satu menolak: wajib mencari kru satu lagi sesuai yang dibutuhkan
  const needGuideOnly = !guideAccepted && driverAccepted;
  const needDriverOnly = guideAccepted && !driverAccepted;
  const needBoth = !needGuideOnly && !needDriverOnly;

  useEffect(() => {
    if (isOpen && trip) {
      if (needDriverOnly) {
        setCurrentStep("DRIVER");
      } else {
        setCurrentStep("GUIDE");
      }
      setErrorMsg("");
      setDomicileFilter("");
      setNameFilter("");
      setGuideAgreement(`Pemandu wisata untuk paket ${trip.package?.name || trip.destination}. Memandu wisatawan, briefing keselamatan, dan pelaporan checkpoint lokasi.`);
      setDriverAgreement(`Pengemudi armada transportasi penjemputan bandara/hotel dan antar rombongan wisata ke pelabuhan/destinasi.`);

      const fetchWorkers = async () => {
        setLoadingWorkers(true);
        try {
          const res = await fetch("/api/assignments?action=list_available_workers");
          const data = await res.json();
          const workers = data.workers || [];
          setAvailableWorkers(workers);

          const firstGuide = workers.find((w: any) => w.role === "GUIDE");
          const firstDriver = workers.find((w: any) => w.role === "DRIVER");

          if (!needDriverOnly && firstGuide) setSelectedGuideId(firstGuide.id);
          else setSelectedGuideId("");

          if (!needGuideOnly && firstDriver) setSelectedDriverId(firstDriver.id);
          else setSelectedDriverId("");
        } catch {
          setAvailableWorkers([]);
        } finally {
          setLoadingWorkers(false);
        }
      };
      fetchWorkers();
    }
  }, [isOpen, trip, needDriverOnly, needGuideOnly]);

  // Filter workers by domicile and name
  const filteredWorkers = useMemo(() => {
    return availableWorkers.filter((w) => {
      const domicile = (w.workerProfile?.domicile || "").toLowerCase();
      const name = (w.name || "").toLowerCase();

      if (domicileFilter.trim()) {
        const domQ = domicileFilter.toLowerCase().trim();
        if (!domicile.includes(domQ)) return false;
      }

      if (nameFilter.trim()) {
        const nameQ = nameFilter.toLowerCase().trim();
        if (!name.includes(nameQ) && !domicile.includes(nameQ)) return false;
      }

      return true;
    });
  }, [availableWorkers, domicileFilter, nameFilter]);

  const guides = filteredWorkers.filter((w) => w.role === "GUIDE");
  const drivers = filteredWorkers.filter((w) => w.role === "DRIVER");

  // Selected guide & driver objects
  const selectedGuide = availableWorkers.find((w) => w.id === selectedGuideId);
  const selectedDriver = availableWorkers.find((w) => w.id === selectedDriverId);

  const totalFee = needDriverOnly
    ? (parseFloat(driverFee) || 0)
    : needGuideOnly
      ? (parseFloat(guideFee) || 0)
      : ((parseFloat(guideFee) || 0) + (parseFloat(driverFee) || 0));

  if (!isOpen || !trip) return null;

  const handleNextToDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCurrentStep("DRIVER");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (needGuideOnly && !selectedGuideId) {
      setErrorMsg("Pilih calon Tour Guide pengganti sebelum konfirmasi.");
      return;
    }
    if (needDriverOnly && !selectedDriverId) {
      setErrorMsg("Pilih calon Driver pengganti sebelum konfirmasi.");
      return;
    }
    if (!selectedGuideId && !selectedDriverId) {
      setErrorMsg("Pilih setidaknya satu Tour Guide atau Driver sebelum konfirmasi.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload: any = {
        tripId: trip.id,
      };

      if (!needDriverOnly && selectedGuideId) {
        payload.guide = {
          workerId: selectedGuideId,
          feeAmount: parseFloat(guideFee) || 500000,
          agreement: guideAgreement,
        };
      }

      if (!needGuideOnly && selectedDriverId) {
        payload.driver = {
          workerId: selectedDriverId,
          feeAmount: parseFloat(driverFee) || 350000,
          agreement: driverAgreement,
        };
      }

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Kru perjalanan berhasil ditugaskan!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Gagal menyimpan penugasan kru.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan sistem saat menyimpan penugasan kru.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 my-8 border border-slate-100 max-h-[92vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {needGuideOnly
                  ? "Pencarian Kru Pengganti: Tour Guide"
                  : needDriverOnly
                    ? "Pencarian Kru Pengganti: Driver Wisata"
                    : "Penugasan Kru Perjalanan"}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {needGuideOnly
                ? "Penugasan Tour Guide Pengganti"
                : needDriverOnly
                  ? "Penugasan Driver Armada Pengganti"
                  : currentStep === "GUIDE"
                    ? "Penugasan Tour Guide"
                    : "Penugasan Driver Armada"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Trip: <span className="font-semibold text-slate-800">{trip.package?.name || trip.destination}</span>
              {tripDestination && ` • Destinasi: ${tripDestination}`}
              {trip.scheduleDate && ` • Jadwal: ${formatDate(trip.scheduleDate)}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner Status Penugasan Berdasarkan Kondisi Kru */}
        {needGuideOnly && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>
                <strong>Driver telah menerima penugasan</strong> ({existingDriver?.worker?.name}). Anda hanya perlu mencari dan menugaskan <strong>1 Tour Guide</strong> pengganti.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] shrink-0">
              Driver Diterima
            </span>
          </div>
        )}

        {needDriverOnly && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span>
                <strong>Tour Guide telah menerima penugasan</strong> ({existingGuide?.worker?.name}). Anda hanya perlu mencari dan menugaskan <strong>1 Driver Armada</strong> pengganti.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] shrink-0">
              Guide Diterima
            </span>
          </div>
        )}

        {guideRejected && driverRejected && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Kedua calon kru sebelumnya menolak penawaran.</strong> Anda wajib mengulang pencarian Tour Guide dan Driver pengganti.
            </span>
          </div>
        )}

        {/* DOMICILE & NAME FILTER BAR */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Filter Domisili Kru ({currentStep === "GUIDE" ? "Tour Guide" : "Driver"})
            </span>
            {tripDestination && (
              <button
                type="button"
                onClick={() => setDomicileFilter(tripDestination)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                Cocokkan Destinasi: {tripDestination}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={domicileFilter}
                onChange={(e) => setDomicileFilter(e.target.value)}
                placeholder="Cari kota/wilayah domisili (Contoh: Bali, Bandung, Labuan Bajo)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder={`Cari nama ${currentStep === "GUIDE" ? "guide" : "driver"}...`}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          {(domicileFilter || nameFilter) && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Hasil: <strong>{currentStep === "GUIDE" ? guides.length : drivers.length}</strong> kandidat {currentStep === "GUIDE" ? "Tour Guide" : "Driver"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDomicileFilter("");
                  setNameFilter("");
                }}
                className="text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= TAHAP 1: FORM TOUR GUIDE ================= */}
        {currentStep === "GUIDE" && (
          <form onSubmit={handleNextToDriver} className="space-y-5">
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-extrabold text-sm normal-case">Pilih Tour Guide (Pemandu Wisata)</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {guides.length} Pemandu Tersedia
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Pemandu Wisata Berdasarkan Domisili
                </label>
                <select
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold shadow-2xs"
                >
                  <option value="">-- Lewati / Tidak Menggunakan Tour Guide --</option>
                  {guides.map((g) => {
                    const dom = g.workerProfile?.domicile || "Domisili belum diatur";
                    return (
                      <option key={g.id} value={g.id}>
                        {g.name} — 📍 {dom} (⭐ {g.workerProfile?.rating || "5.0"})
                      </option>
                    );
                  })}
                </select>
                {guides.length === 0 && !loadingWorkers && (
                  <span className="text-[11px] text-amber-700 block mt-1.5 font-medium">
                    Tidak ada guide yang cocok dengan filter domisili pencarian.
                  </span>
                )}
              </div>

              {/* Selected Guide Detail Card */}
              {selectedGuide && (
                <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="font-extrabold text-slate-900 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {selectedGuide.name}
                    </span>
                    <span className="text-xs text-emerald-700 font-black px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      ⭐ {selectedGuide.workerProfile?.rating || "5.0"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kota/Wilayah Domisili: <strong>{selectedGuide.workerProfile?.domicile || "Belum diatur"}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Lisensi: <strong>{selectedGuide.workerProfile?.licenseNumber || "Tervalidasi"}</strong></span>
                    <span>•</span>
                    <span>Pengalaman: <strong>{selectedGuide.workerProfile?.experienceYears || 1} tahun</strong></span>
                  </div>
                </div>
              )}

              {selectedGuideId && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nominal Fee / Honor Guide (Rp) *
                    </label>
                    <input
                      type="number"
                      value={guideFee}
                      onChange={(e) => setGuideFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-extrabold text-slate-900 shadow-2xs"
                      placeholder="500000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Instruksi &amp; Catatan Tugas Guide
                    </label>
                    <textarea
                      rows={2}
                      value={guideAgreement}
                      onChange={(e) => setGuideAgreement(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-2xs"
                      placeholder="Instruksi tugas guide..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Tombol Aksi Tahap 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>

              {needGuideOnly ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedGuideId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{submitting ? "Menugaskan..." : "Konfirmasi & Tugaskan Tour Guide"}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{selectedGuideId ? "Simpan & Lanjut ke Driver" : "Lanjut ke Driver (Tanpa Guide)"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* ================= TAHAP 2: FORM DRIVER PARIWISATA ================= */}
        {currentStep === "DRIVER" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Status Review Tour Guide (Step 1) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <span>Tour Guide:</span>
                    <span className="text-emerald-700">
                      {needDriverOnly
                        ? existingGuide?.worker?.name || "Sudah Diterima"
                        : selectedGuide ? selectedGuide.name : "Dilewati (Tanpa Guide)"}
                    </span>
                    {needDriverOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold">Diterima</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {needDriverOnly
                      ? "Kru tour guide sudah menerima penugasan perjalanan ini"
                      : selectedGuide ? `Honor: ${formatRupiah(parseFloat(guideFee) || 0)}` : "Tidak ada alokasi honor guide"}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Driver */}
            <div className="p-5 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs uppercase tracking-wider">
                  <div className="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-900 font-extrabold text-sm normal-case">Pilih Driver Pariwisata (Armada)</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  {drivers.length} Driver Tersedia
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Driver Berdasarkan Domisili
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-cyan-500 text-slate-900 font-semibold shadow-2xs"
                >
                  <option value="">-- Lewati / Tidak Menggunakan Driver --</option>
                  {drivers.map((d) => {
                    const dom = d.workerProfile?.domicile || "Domisili belum diatur";
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name} — 📍 {dom} (⭐ {d.workerProfile?.rating || "5.0"})
                      </option>
                    );
                  })}
                </select>
                {drivers.length === 0 && !loadingWorkers && (
                  <span className="text-[11px] text-amber-700 block mt-1.5 font-medium">
                    Tidak ada driver yang cocok dengan filter domisili pencarian.
                  </span>
                )}
              </div>

              {/* Selected Driver Detail Card */}
              {selectedDriver && (
                <div className="p-3.5 rounded-2xl bg-white border border-cyan-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="font-extrabold text-slate-900 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                      {selectedDriver.name}
                    </span>
                    <span className="text-xs text-cyan-700 font-black px-2 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200">
                      ⭐ {selectedDriver.workerProfile?.rating || "5.0"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>Kota/Wilayah Domisili: <strong>{selectedDriver.workerProfile?.domicile || "Belum diatur"}</strong></span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>SIM/Lisensi: <strong>{selectedDriver.workerProfile?.licenseNumber || "SIM Aktif"}</strong></span>
                    <span>•</span>
                    <span>Pengalaman: <strong>{selectedDriver.workerProfile?.experienceYears || 1} tahun</strong></span>
                  </div>
                </div>
              )}

              {selectedDriverId && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nominal Fee / Honor Driver (Rp) *
                    </label>
                    <input
                      type="number"
                      value={driverFee}
                      onChange={(e) => setDriverFee(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-cyan-500 font-extrabold text-slate-900 shadow-2xs"
                      placeholder="350000"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Instruksi &amp; Catatan Tugas Driver
                    </label>
                    <textarea
                      rows={2}
                      value={driverAgreement}
                      onChange={(e) => setDriverAgreement(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-cyan-500 text-slate-800 shadow-2xs"
                      placeholder="Instruksi tugas driver..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Total Ringkasan Biaya Kru */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Alokasi Honor Operasional Kru
                </span>
                <div className="text-xl font-black text-emerald-400">
                  {formatRupiah(totalFee)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {needDriverOnly
                    ? "Alokasi honor untuk Driver Pariwisata pengganti"
                    : needGuideOnly
                      ? "Alokasi honor untuk Tour Guide pengganti"
                      : selectedGuideId && selectedDriverId
                        ? "Tour Guide + Driver Pariwisata"
                        : selectedGuideId
                          ? "Hanya Tour Guide"
                          : selectedDriverId
                            ? "Hanya Driver Pariwisata"
                            : "Belum ada kru terpilih"}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {needDriverOnly ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Batal</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setCurrentStep("GUIDE"); setErrorMsg(""); }}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || (needDriverOnly ? !selectedDriverId : (!selectedGuideId && !selectedDriverId))}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Menugaskan..." : needDriverOnly ? "Konfirmasi & Tugaskan Driver" : "Konfirmasi & Tugaskan Kru"}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
