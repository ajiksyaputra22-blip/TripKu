"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Briefcase, Map, Car, AlertCircle, Clock } from "lucide-react";

function RoleGatewayContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const pendingParam = searchParams.get("pending");

  return (
    <div className="min-h-screen bg-slate-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header - TripKu */}
        <div className="text-center space-y-4">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <img
              src="/logo.png"
              alt="TripKu Logo"
              className="h-20 w-auto object-contain mx-auto"
            />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Daftar sebagai Mitra TripKu
            </h1>
            <p className="mt-2 text-base text-slate-500 max-w-lg mx-auto">
              Pilih peran Anda dan lengkapi pendaftaran untuk bergabung di platform TripKu.
            </p>
          </div>
        </div>

        {/* Alerts for errors or pending verification */}
        {errorParam && (
          <div className="max-w-lg mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Terjadi kesalahan saat proses pendaftaran. Silakan coba kembali.</span>
          </div>
        )}

        {pendingParam === "1" && (
          <div className="max-w-lg mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Pendaftaran Anda berhasil dicatat dan saat ini sedang menunggu verifikasi oleh Admin Sistem.
            </span>
          </div>
        )}

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Customer Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">CUSTOMER / WISATAWAN</h2>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Pesan paket liburan favorit, koordinasi dengan Tour Guide di Trip Room, dan nikmati liburan tanpa beban.
              </p>
            </div>

            <div>
              <Link
                href="/customer/register"
                className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md shadow-blue-600/20 transition-all"
              >
                Daftar sebagai Customer
              </Link>
            </div>
          </div>

          {/* Travel Agency Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">AGENSI TRAVEL</h2>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Kelola katalog paket, verifikasi pembayaran, tugaskan Tour Guide dan Driver armada pariwisata.
              </p>
            </div>

            <div>
              <Link
                href="/travel/register"
                className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow-md shadow-emerald-600/20 transition-all"
              >
                Daftar sebagai Agensi Travel
              </Link>
            </div>
          </div>

          {/* Tour Guide Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Map className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">TOUR GUIDE</h2>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Terima penugasan trip, dampingi wisatawan di lapangan, perbarui status perjalanan, dan pantau fee.
              </p>
            </div>

            <div>
              <Link
                href="/guide/register"
                className="block w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs text-center shadow-md shadow-teal-600/20 transition-all"
              >
                Daftar sebagai Tour Guide
              </Link>
            </div>
          </div>

          {/* Driver Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">DRIVER ARMADA</h2>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Layanan penjemputan wisatawan, konfirmasi rute transportasi, dan manajemen jadwal kerja armada.
              </p>
            </div>

            <div>
              <Link
                href="/driver/register"
                className="block w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center shadow-md shadow-indigo-600/20 transition-all"
              >
                Daftar sebagai Driver
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function RoleGatewayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Memuat...</div>}>
      <RoleGatewayContent />
    </Suspense>
  );
}
