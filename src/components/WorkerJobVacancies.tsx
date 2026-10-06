"use client";

import { useState, useEffect } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Car,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Send,
  X,
  Check,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface WorkerJobVacanciesProps {
  role: "GUIDE" | "DRIVER";
  onApplicationSubmitted?: () => void;
}

export default function WorkerJobVacancies({
  role,
  onApplicationSubmitted,
}: WorkerJobVacanciesProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"VACANCIES" | "MY_APPLICATIONS">("VACANCIES");
  const [jobs, setJobs] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [workerInfo, setWorkerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [domicileOnly, setDomicileOnly] = useState(false);

  // Apply modal
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [submittingApply, setSubmittingApply] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.set("search", search);
      if (domicileOnly) q.set("domicileOnly", "true");

      const [jobsRes, appsRes] = await Promise.all([
        fetch(`/api/jobs?${q.toString()}`),
        fetch("/api/apply"),
      ]);

      const jobsData = await jobsRes.json();
      const appsData = await appsRes.json();

      if (jobsRes.ok) {
        setJobs(jobsData.jobs || []);
        setWorkerInfo(jobsData.worker);
      }
      if (appsRes.ok) {
        setMyApplications(appsData.applications || []);
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [domicileOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const openApplyModal = (job: any) => {
    setSelectedJob(job);
    setApplyMessage(
      `Halo Tim ${job.travel?.businessName || "Travel"}, saya ${workerInfo?.name || "Kru"} berminat dan siap bertugas sebagai ${role === "GUIDE" ? "Tour Guide" : "Driver"
      } untuk perjalanan rombongan paket "${job.name}". Saya berdomisili di ${workerInfo?.domicile || "wilayah terkait"
      } dan memiliki pengalaman serta dokumen resmi yang terverifikasi.`
    );
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSubmittingApply(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedJob.id,
          message: applyMessage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Lamaran Anda berhasil dikirim ke pihak Agensi Travel!");
        setApplyModalOpen(false);
        fetchJobs();
        if (onApplicationSubmitted) onApplicationSubmitted();
      } else {
        toast.error(data.error || "Gagal mengajukan lamaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat melamar.");
    } finally {
      setSubmittingApply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sub-Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Peluang Penugasan Wisata Terbuka
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Temukan paket wisata yang membutuhkan {role === "GUIDE" ? "Tour Guide" : "Driver Armada"}, lamar langsung, dan negosiasikan fee secara transparan.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 rounded-2xl p-1 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab("VACANCIES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "VACANCIES"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Lowongan Tersedia ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("MY_APPLICATIONS")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "MY_APPLICATIONS"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              Lamaran Saya ({myApplications.length})
            </button>
          </div>
        </div>

        {/* Domicile Info Banner */}
        {workerInfo?.domicile && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span>
                Domisili Terdaftar Anda: <strong className="text-slate-900">{workerInfo.domicile}</strong>
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <input
                type="checkbox"
                checked={domicileOnly}
                onChange={(e) => setDomicileOnly(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>Hanya tampilkan paket yang cocok dengan domisili saya</span>
            </label>
          </div>
        )}
      </div>

      {/* ================= TAB 1: LOWONGAN TERSEDIA ================= */}
      {activeTab === "VACANCIES" && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama destinasi, paket, atau agensi travel..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                Cari
              </button>
            </form>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
              <p className="text-xs text-slate-500 mt-2 font-medium">Memuat daftar lowongan pekerjaan...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Tidak Ada Lowongan yang Cocok</p>
              <p className="max-w-md mx-auto">
                {domicileOnly
                  ? `Belum ada paket wisata baru di wilayah domisili ${workerInfo?.domicile || ""}. Coba nonaktifkan filter domisili di atas.`
                  : "Saat ini seluruh paket telah memiliki kru atau belum ada jadwal perjalanan baru."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => {
                const hasApplied = !!job.myApplication;
                const isApproved = job.myApplication?.status === "APPROVED";
                const isRejected = job.myApplication?.status === "REJECTED";

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover & Badges */}
                      <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={job.coverImage || "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800"}
                          alt={job.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-900/90 text-white backdrop-blur-xs">
                            {job.durationDays} Hari Perjalanan
                          </span>
                          {job.isDomicileMatch && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs backdrop-blur-xs">
                              Cocok Domisili
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="flex items-center gap-1 text-[11px] text-emerald-300 font-bold mb-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.destination}</span>
                            {job.originCity && <span className="opacity-80">• Asal {job.originCity}</span>}
                          </div>
                          <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1">
                            {job.name}
                          </h3>
                        </div>
                      </div>

                      {/* Content details */}
                      <div className="p-4 space-y-3">
                        {/* Travel Agency info */}
                        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                              {job.travel?.businessName?.charAt(0) || "T"}
                            </div>
                            <span className="font-bold text-slate-800">
                              {job.travel?.businessName || "Mitra Travel Resmi"}
                            </span>
                          </div>
                          {job.travel?.verificationStatus === "APPROVED" && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Resmi</span>
                            </span>
                          )}
                        </div>

                        {/* Schedule & Pax specs */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">Tgl: {formatDate(job.departureDate)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Car className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{job.vehicle || "Armada Bus/HiAce"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>Kapasitas: {job.capacity} Pax</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">Posisi: {role === "GUIDE" ? "Tour Guide" : "Driver"}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 pt-0">
                      {hasApplied ? (
                        <div
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${isApproved
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : isRejected
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                        >
                          <span className="flex items-center gap-1.5">
                            {isApproved ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : isRejected ? (
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                            )}
                            <span>
                              {isApproved
                                ? "Lamaran Diterima & Ditugaskan!"
                                : isRejected
                                  ? "Lamaran Belum Diterima"
                                  : "Lamaran Terkirim (Menunggu Review)"}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openApplyModal(job)}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <span>Lamar Pekerjaan Ini</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: RIWAYAT LAMARAN SAYA ================= */}
      {activeTab === "MY_APPLICATIONS" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              Riwayat Pengajuan Lamaran Tugas Saya
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total {myApplications.length} Lamaran
            </span>
          </div>

          {myApplications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Briefcase className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Belum Ada Lamaran yang Diajukan</p>
              <p>Pilih paket wisata yang cocok di tab "Lowongan Tersedia" untuk mulai melamar pekerjaan.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myApplications.map((app) => (
                <div key={app.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">
                        {app.package?.name}
                      </h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-emerald-700">
                        {app.package?.destination}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                      <span>Agensi: <strong>{app.package?.travel?.businessName}</strong></span>
                      <span>•</span>
                      <span>Keberangkatan: {formatDate(app.package?.departureDate)}</span>
                      <span>•</span>
                      <span>Diajukan pada: {formatDate(app.createdAt)}</span>
                    </div>

                    {app.message && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 italic mt-2">
                        "{app.message}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${app.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : app.status === "REJECTED"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                    >
                      {app.status === "APPROVED"
                        ? "✓ Lamaran Disetujui"
                        : app.status === "REJECTED"
                          ? "✗ Belum Diterima"
                          : "⏳ Menunggu Review Travel"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL AJUKAN LAMARAN ================= */}
      {applyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Formulir Lamaran Pekerjaan Kru
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Posisi: {role === "GUIDE" ? "Tour Guide Pendamping" : "Driver Armada"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              {/* Package Recap */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                <div className="font-bold text-slate-900">{selectedJob.name}</div>
                <div className="text-slate-500 text-[11px]">
                  Destinasi: {selectedJob.destination} • Keberangkatan: {formatDate(selectedJob.departureDate)}
                </div>
                <div className="text-emerald-700 font-semibold text-[11px]">
                  Penyelenggara: {selectedJob.travel?.businessName}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Surat Pengantar / Motivasi Lamaran <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Info Verification */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kredensial Anda Akan Dikirimkan:</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  Agensi Travel akan dapat melihat data profil terverifikasi Anda (NIK/KTP, Dokumen Lisensi, Pengalaman, dan Nomor Kontak).
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingApply ? "Mengirim..." : "Kirim Lamaran Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
