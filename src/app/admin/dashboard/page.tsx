"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  ShieldCheck,
  Briefcase,
  Check,
  X,
  FileText,
  Compass
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [usersData, setUsersData] = useState<any>(null);
  const [verifications, setVerifications] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, vRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/verifications"),
      ]);

      const uJson = await uRes.json();
      const vJson = await vRes.json();

      setUsersData(uJson);
      setVerifications(vJson);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data administrator.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyTravel = async (travelId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TRAVEL",
          id: travelId,
          action,
        }),
      });
      if (res.ok) {
        toast.success(`Status mitra travel berhasil diubah menjadi: ${action}`);
        fetchData();
      } else {
        toast.error("Gagal memproses verifikasi travel.");
      }
    } catch {
      toast.error("Gagal memproses verifikasi.");
    }
  };

  const handleVerifyWorker = async (workerId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WORKER",
          id: workerId,
          action,
        }),
      });
      if (res.ok) {
        toast.success(`Status pekerja berhasil diubah menjadi: ${action}`);
        fetchData();
      } else {
        toast.error("Gagal memproses verifikasi pekerja.");
      }
    } catch {
      toast.error("Gagal memproses verifikasi pekerja.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const stats = usersData?.stats || {
    totalUsers: 0,
    totalTravels: 0,
    totalPackages: 0,
    totalBookings: 0,
    totalTrips: 0,
    totalWorkers: 0,
  };

  const pendingTravels = verifications?.travels?.filter((t: any) => t.verificationStatus === "PENDING") || [];
  const pendingWorkers = verifications?.workers?.filter((w: any) => !w.isAvailable) || [];
  const totalPendingVerifications = pendingTravels.length + pendingWorkers.length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pusat Kendali Administrator Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Verifikasi legalitas dokumen izin usaha mitra agensi travel & verifikasi kesiapan kru pekerja pariwisata.
          </p>
        </div>

        {/* Platform Overview KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Pengguna</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</div>
            <span className="text-[10px] text-purple-600 font-medium mt-0.5 block">Seluruh 5 Peran</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Agensi Travel</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalTravels}</div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">Mitra Terdaftar</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kru Perjalanan</span>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalWorkers}</div>
            <span className="text-[10px] text-teal-600 font-medium mt-0.5 block">Tour Guide & Driver Terdaftar</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Antrean Verifikasi</span>
            <div className="text-2xl font-extrabold text-amber-600">{totalPendingVerifications}</div>
            <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">Perlu Tindakan Admin</span>
          </div>
        </div>

        {/* Tab Navigation - Verifikasi Legalitas & Mitra */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-purple-600 text-white shadow-xs">
            <span>Verifikasi Legalitas & Mitra</span>
            {totalPendingVerifications > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-extrabold">
                {totalPendingVerifications}
              </span>
            )}
          </div>
        </div>

        {/* Verifikasi Agensi Travel & Pekerja */}
        <div className="space-y-6">
          {/* Travel Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Antrean & Status Verifikasi Legalitas Agensi Travel ({verifications?.travels?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama Usaha Travel</th>
                    <th className="p-4">Kontak / Penanggung Jawab</th>
                    <th className="p-4">Dokumen Izin Usaha</th>
                    <th className="p-4">Status Verifikasi</th>
                    <th className="p-4 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifications?.travels && verifications.travels.length > 0 ? (
                    verifications.travels.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{t.businessName}</div>
                          <div className="text-[11px] text-slate-500">{t.address || "Alamat belum diatur"}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{t.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{t.user?.email}</div>
                        </td>
                        <td className="p-4">
                          {(() => {
                            let siup = t.siupUrl;
                            if (!siup && t.description && t.description.includes("[IZIN_USAHA_URL]:")) {
                              siup = t.description.split("[IZIN_USAHA_URL]:")[1]?.trim();
                            }
                            if (!siup) {
                              return <span className="text-slate-400 italic text-[11px]">Belum diupload</span>;
                            }
                            return (
                              <a
                                href={siup}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline text-[11px]"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat Izin Usaha (PDF/Foto)</span>
                              </a>
                            );
                          })()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.verificationStatus === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.verificationStatus === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                              }`}
                          >
                            {t.verificationStatus || "PENDING"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {t.verificationStatus !== "APPROVED" && (
                              <button
                                onClick={() => handleVerifyTravel(t.id, "APPROVED")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                            )}
                            {t.verificationStatus !== "REJECTED" && (
                              <button
                                onClick={() => handleVerifyTravel(t.id, "REJECTED")}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                        Belum ada mitra agensi travel yang mendaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workers Verification */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Antrean & Status Verifikasi Pekerja Lapangan (Tour Guide & Driver) ({verifications?.workers?.length || 0})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Nama Pekerja</th>
                    <th className="p-4">Peran & Domisili</th>
                    <th className="p-4">Dokumen Pendukung</th>
                    <th className="p-4">Status Verifikasi</th>
                    <th className="p-4 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifications?.workers && verifications.workers.length > 0 ? (
                    verifications.workers.map((w: any) => (
                      <tr key={w.id} className="hover:bg-slate-50/80">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{w.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{w.user?.email} | {w.user?.phone || "-"}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800">
                            {w.workerType}
                          </span>
                          {w.domicile && (
                            <div className="text-[11px] text-slate-500 mt-1 font-medium"> {w.domicile}</div>
                          )}
                        </td>
                        <td className="p-4">
                          {(() => {
                            let simUrl = w.simImageUrl;
                            if (!simUrl && w.bio && w.bio.includes("[SIM_URL]:")) {
                              simUrl = w.bio.split("[SIM_URL]:")[1]?.trim();
                            }

                            let certUrl = w.certificateUrl;
                            if (!certUrl && w.bio && w.bio.includes("[CERTIFICATE_PDF_URL]:")) {
                              certUrl = w.bio.split("[CERTIFICATE_PDF_URL]:")[1]?.trim();
                            }

                            const ktpUrl = w.ktpImageUrl;

                            if (!simUrl && !certUrl && !ktpUrl) {
                              return <span className="text-slate-400 italic text-[11px]">Tidak ada dokumen</span>;
                            }

                            return (
                              <div className="flex flex-col gap-1">
                                {simUrl && (
                                  <a href={simUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline text-[11px]">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>Lihat SIM (Wajib) ✓</span>
                                  </a>
                                )}
                                {certUrl && (
                                  <a href={certUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline text-[11px]">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>Sertifikat Guide (PDF)</span>
                                  </a>
                                )}
                                {ktpUrl && (
                                  <a href={ktpUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline text-[11px]">
                                    <FileText className="w-3.5 h-3.5 shrink-0" />
                                    <span>Foto KTP</span>
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${w.user?.status === "SUSPENDED"
                              ? "bg-rose-100 text-rose-800"
                              : w.isAvailable
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800 animate-pulse"
                              }`}
                          >
                            {w.user?.status === "SUSPENDED" ? "REJECTED" : w.isAvailable ? "APPROVED" : "PENDING"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!w.isAvailable && (
                              <button
                                onClick={() => handleVerifyWorker(w.id, "APPROVED")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleVerifyWorker(w.id, "REJECTED")}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak / Suspend</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs italic">
                        Belum ada pekerja guide atau driver yang mendaftar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
