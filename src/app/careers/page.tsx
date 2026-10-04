import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Cara Kerja TripKu | TripKu",
  description: "Pelajari bagaimana TripKu menghubungkan customer, agensi travel, tour guide, dan driver dalam satu ekosistem perjalanan wisata.",
};

const customerSteps = [
  { num: "01", title: "Buat Akun", desc: "Daftar sebagai customer dengan email. Proses cepat, tidak perlu verifikasi dokumen." },
  { num: "02", title: "Jelajahi & Bandingkan", desc: "Temukan paket wisata dari berbagai agensi. Gunakan fitur komparasi untuk memilih yang paling sesuai." },
  { num: "03", title: "Pesan & Bayar", desc: "Isi data peserta, pilih skema pembayaran (penuh atau DP), lalu transfer ke rekening agensi." },
  { num: "04", title: "Ikuti Perjalanan", desc: "Pantau status perjalanan, komunikasi dengan kru lewat Trip Room, dan nikmati wisata Anda." },
  { num: "05", title: "Beri Ulasan", desc: "Setelah perjalanan selesai, berikan rating dan ulasan untuk paket, guide, serta driver." },
];

const agencySteps = [
  { num: "01", title: "Daftar & Verifikasi", desc: "Upload dokumen legalitas usaha. Tim admin memverifikasi dalam 1-3 hari kerja." },
  { num: "02", title: "Buat Paket Wisata", desc: "Tambahkan paket lengkap: deskripsi, itinerary, harga, fasilitas, slot peserta, dan jadwal keberangkatan." },
  { num: "03", title: "Terima Pemesanan", desc: "Konfirmasi booking masuk, verifikasi pembayaran, dan tugaskan kru (guide & driver) ke perjalanan." },
  { num: "04", title: "Kelola Perjalanan", desc: "Monitor status absensi, komunikasi lewat Trip Room, dan tandai perjalanan selesai." },
];

const crewSteps = [
  { num: "01", title: "Daftar & Upload Dokumen", desc: "Guide wajib upload sertifikasi. Driver wajib upload SIM dan foto kendaraan." },
  { num: "02", title: "Lihat Lowongan", desc: "Agensi travel membuka lowongan penugasan. Ajukan lamaran dan negosiasikan fee." },
  { num: "03", title: "Jalankan Penugasan", desc: "Terima penugasan resmi dari agensi, catat absensi peserta, dan komunikasi via Trip Room." },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Cara Kerja TripKu</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Cara Kerja TripKu
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            TripKu menghubungkan empat peran dalam satu ekosistem. Pelajari alur kerja masing-masing peran di bawah ini.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Customer Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Alur</span>
              <h2 className="text-sm font-bold text-slate-900">Sebagai Customer</h2>
            </div>
            <Link href="/auth" className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Daftar Sekarang
            </Link>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-5 gap-4">
            {customerSteps.map((s, i) => (
              <div key={s.num} className="relative">
                {i < customerSteps.length - 1 && (
                  <div className="hidden sm:block absolute top-3 left-full w-full h-px bg-slate-100 z-0" style={{ width: "calc(100% - 0px)" }} />
                )}
                <div className="relative z-10 space-y-2">
                  <div className="text-xl font-black text-slate-200">{s.num}</div>
                  <div className="text-xs font-bold text-slate-900">{s.title}</div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agency Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Alur</span>
              <h2 className="text-sm font-bold text-slate-900">Sebagai Agensi Travel</h2>
            </div>
            <Link href="/travel/register" className="text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Daftar Mitra
            </Link>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {agencySteps.map((s) => (
              <div key={s.num} className="space-y-2">
                <div className="text-xl font-black text-slate-200">{s.num}</div>
                <div className="text-xs font-bold text-slate-900">{s.title}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Flow */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Alur</span>
              <h2 className="text-sm font-bold text-slate-900">Sebagai Tour Guide atau Driver</h2>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {crewSteps.map((s) => (
              <div key={s.num} className="space-y-2">
                <div className="text-xl font-black text-slate-200">{s.num}</div>
                <div className="text-xs font-bold text-slate-900">{s.title}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-5 flex gap-3">
            <Link href="/guide/register" className="text-[11px] font-bold text-emerald-600 hover:underline">
              Gabung sebagai Tour Guide
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/driver/register" className="text-[11px] font-bold text-emerald-600 hover:underline">
              Gabung sebagai Driver
            </Link>
          </div>
        </div>

        {/* Trip Room highlight */}
        <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block mb-2">Fitur Unggulan</span>
          <h2 className="text-base font-extrabold mb-2">Trip Room</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Setiap perjalanan memiliki Trip Room eksklusif sebagai ruang komunikasi antara customer, agensi, guide, dan driver. Di sini Anda bisa mengirim pesan, memantau status perjalanan, melihat profil kru yang ditugaskan, dan mencatat absensi peserta secara real-time.
          </p>
        </div>
      </div>
    </div>
  );
}
