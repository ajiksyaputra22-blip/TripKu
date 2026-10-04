import Link from "next/link";
import { ChevronRight, Users, ShieldCheck, MapPin, Star } from "lucide-react";

export const metadata = {
  title: "Tentang Kami | TripKu",
  description: "Kenali TripKu, platform marketplace perjalanan wisata multi-vendor pertama di Indonesia.",
};

const values = [
  {
    icon: ShieldCheck,
    title: "Terverifikasi",
    desc: "Setiap agensi travel, tour guide, dan driver yang bergabung melewati proses verifikasi dokumen dan legalitas oleh tim admin kami.",
  },
  {
    icon: Users,
    title: "Multi-Peran",
    desc: "Satu ekosistem yang menghubungkan customer, agensi travel, tour guide, dan driver dalam satu platform terintegrasi.",
  },
  {
    icon: MapPin,
    title: "Destinasi Lokal",
    desc: "Fokus pada keindahan wisata Indonesia — dari Labuan Bajo, Raja Ampat, Bromo, hingga destinasi tersembunyi yang belum banyak dikenal.",
  },
  {
    icon: Star,
    title: "Transparan",
    desc: "Rating dan ulasan nyata dari customer setelah perjalanan. Tidak ada ulasan palsu — semua berbasis pengalaman perjalanan aktual.",
  },
];

const team = [
  { initial: "A", name: "Tim Teknologi", role: "Platform & Infrastruktur" },
  { initial: "B", name: "Tim Operasional", role: "Verifikasi & Quality Control" },
  { initial: "C", name: "Tim Produk", role: "Desain & Pengalaman Pengguna" },
  { initial: "D", name: "Tim Layanan", role: "Customer Support" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Tentang Kami</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Tentang TripKu
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Platform marketplace perjalanan wisata multi-vendor pertama di Indonesia yang menghubungkan customer, agensi travel, tour guide, dan driver dalam satu ekosistem terintegrasi.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Mission */}
        <div className="bg-slate-900 rounded-2xl p-8 text-white">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block mb-3">Misi Kami</span>
          <p className="text-lg sm:text-xl font-bold leading-snug max-w-2xl">
            Menjadikan perjalanan wisata di Indonesia lebih mudah diakses, lebih terpercaya, dan lebih menghubungkan semua pihak yang terlibat.
          </p>
        </div>

        {/* Problem + Answer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Problem side */}
          <div className="bg-slate-100 rounded-2xl p-6 sm:p-7 space-y-4 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Masalah yang kami lihat</span>
            <ul className="space-y-3">
              {[
                "Customer tidak tahu mana agensi travel yang benar-benar terpercaya",
                "Agensi kecil tidak punya platform untuk menjangkau lebih banyak customer",
                "Guide dan driver berkualitas tidak terhubung ke ekosistem wisata yang ada",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 block" />
                  </span>
                  <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Answer side */}
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-7 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Jawaban kami</span>
            <ul className="space-y-3">
              {[
                "Verifikasi berlapis untuk setiap mitra sebelum bisa berjualan",
                "Satu platform untuk agensi, guide, dan driver tampil & berkolaborasi",
                "Trip Room eksklusif per perjalanan agar semua pihak terhubung real-time",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                  </span>
                  <span className="text-xs text-slate-300 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-5">Nilai yang Kami Pegang</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-1">{v.title}</div>
                    <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Tim di Balik TripKu</h2>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {team.map((t) => (
              <div key={t.name} className="text-center">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black mx-auto mb-2">
                  {t.initial}
                </div>
                <div className="text-xs font-bold text-slate-900">{t.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
