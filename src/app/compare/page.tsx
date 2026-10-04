"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PackageData } from "@/components/PackageCard";
import { formatRupiah } from "@/lib/utils";
import { Layers, Trash2, ArrowRight, Check, X, ShieldCheck, Plus } from "lucide-react";

export default function ComparePage() {
  const [packages, setPackages] = useState<PackageData[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("compare_packages");
      if (saved) setPackages(JSON.parse(saved));
    } catch { }
  }, []);

  const handleRemove = (id: string) => {
    const updated = packages.filter((p) => p.id !== id);
    setPackages(updated);
    try {
      localStorage.setItem("compare_packages", JSON.stringify(updated));
    } catch { }
  };

  const handleClearAll = () => {
    setPackages([]);
    try {
      localStorage.removeItem("compare_packages");
    } catch { }
  };

  const parseFacilities = (fac: any): string[] => {
    try {
      if (Array.isArray(fac)) return fac;
      return JSON.parse(fac);
    } catch {
      return typeof fac === "string" ? fac.split(",") : [];
    }
  };

  if (packages.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Belum Ada Paket yang Dibandingkan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md text-center mt-2">
          Pilih 2 hingga 4 paket wisata dari katalog jelajah dengan menekan ikon perbandingan pada kartu paket.
        </p>
        <Link
          href="/explore"
          className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
        >
          <span>Buka Katalog Paket</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
              <span>Komparasi Paket Wisata</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bandingkan Pilihan Liburan Terbaik Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Menampilkan {packages.length} paket (Maksimal 4 paket sesuai rekomendasi standar PRD).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {packages.length < 4 && (
              <Link
                href="/explore"
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Paket</span>
              </Link>
            )}
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* Side by Side Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="p-4 w-48 text-xs font-bold uppercase tracking-wider text-slate-400">
                </th>
                {packages.map((pkg) => (
                  <th key={pkg.id} className="p-4 w-64 align-top">
                    <div className="relative group">
                      <button
                        onClick={() => handleRemove(pkg.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors z-10"
                        title="Hapus dari perbandingan"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="h-32 rounded-xl overflow-hidden mb-3 bg-slate-100">
                        <img
                          src={pkg.coverImage}
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                        {pkg.name}
                      </h3>
                      <div className="mt-2 text-emerald-600 font-extrabold text-base">
                        {formatRupiah(pkg.price)}
                      </div>
                      <Link
                        href={`/packages/${pkg.slug || pkg.id}/book`}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <span>Pesan Sekarang</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row: Agensi Travel */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Agensi Travel</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-800 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span>{pkg.travel?.businessName || "Mitra Wisata Terpadu"}</span>
                      {pkg.travel?.verificationStatus === "APPROVED" && (
                        <span title="Resmi Terverifikasi">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row: Destinasi */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Destinasi</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-700 font-medium">
                    {pkg.destination}
                  </td>
                ))}
              </tr>

              {/* Row: Durasi */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Durasi Tour</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-700 font-semibold">
                    {pkg.durationDays} Hari
                  </td>
                ))}
              </tr>

              {/* Row: Kapasitas & Kuota */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Kapasitas & Sisa Kuota</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-700">
                    <span className="font-semibold">{pkg.capacity} Pax</span> (Sisa:{" "}
                    <span className="font-bold text-emerald-700">{pkg.quotaLeft} Kuota</span>)
                    {((pkg.totalBookedPax ?? pkg.totalBookings ?? pkg._count?.bookings ?? 0) > 0) && (
                      <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                        {pkg.totalBookedPax ?? pkg.totalBookings ?? pkg._count?.bookings} Terpesan (Total)
                      </div>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row: Transportasi */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Armada Transportasi</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-700">
                    {pkg.vehicle || "Armada Pariwisata AC"}
                  </td>
                ))}
              </tr>

              {/* Row: Akomodasi */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Penginapan/Akomodasi</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="p-4 text-slate-700">
                    {pkg.accommodation || "Hotel Standar Wisata"}
                  </td>
                ))}
              </tr>

              {/* Row: Fasilitas */}
              <tr>
                <td className="p-4 font-bold text-slate-500 bg-slate-50/40">Fasilitas Termasuk</td>
                {packages.map((pkg) => {
                  const facs = parseFacilities(pkg.facilities);
                  return (
                    <td key={pkg.id} className="p-4 text-slate-700">
                      <ul className="space-y-1">
                        {facs.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  );
                })}
              </tr>

            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
