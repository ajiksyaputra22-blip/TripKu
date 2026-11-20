import Link from "next/link";
import { MapPin, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-emerald-600" />
        </div>

        {/* Error Code */}
        <p className="text-7xl font-extrabold text-emerald-600 tracking-tight mb-2">404</p>

        {/* Heading */}
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
          Halaman Tidak Ditemukan
        </h1>

        {/* Description */}
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Sepertinya rute perjalanan yang kamu cari tidak ada di peta kami.
          Mungkin halaman ini sudah dipindahkan atau alamatnya salah ketik.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Lihat Paket Wisata
          </Link>
        </div>
      </div>
    </div>
  );
}
