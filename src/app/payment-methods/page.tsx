import Link from "next/link";
import { ChevronRight, Building2, Smartphone, Clock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Metode Pembayaran | TripKu",
  description: "Panduan lengkap metode pembayaran yang tersedia di TripKu, termasuk transfer bank dan skema DP.",
};

const banks = [
  { name: "Bank BCA", no: "1234567890", holder: "PT TripKu Indonesia" },
  { name: "Bank Mandiri", no: "0987654321", holder: "PT TripKu Indonesia" },
  { name: "Bank BRI", no: "1122334455", holder: "PT TripKu Indonesia" },
  { name: "Bank BNI", no: "5566778899", holder: "PT TripKu Indonesia" },
];

const steps = [
  {
    num: "01",
    title: "Pilih paket & checkout",
    desc: "Lengkapi data peserta dan pilih skema pembayaran (penuh atau DP) yang tersedia pada paket.",
  },
  {
    num: "02",
    title: "Transfer ke rekening agensi",
    desc: "Rekening tujuan ditampilkan setelah checkout. Transfer sesuai nominal yang tertera, tanpa pembulatan.",
  },
  {
    num: "03",
    title: "Upload bukti transfer",
    desc: "Upload foto atau screenshot bukti transfer di halaman detail booking Anda. Format: JPG, PNG, atau PDF.",
  },
  {
    num: "04",
    title: "Tunggu konfirmasi",
    desc: "Agensi travel memverifikasi pembayaran dalam 1x24 jam. Status booking otomatis diperbarui setelah terverifikasi.",
  },
];

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Metode Pembayaran</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Metode Pembayaran
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            TripKu menggunakan sistem transfer bank langsung ke rekening agensi travel mitra. Setiap pembayaran diverifikasi manual dan tercatat di sistem.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Cara Pembayaran</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s) => (
              <div key={s.num} className="space-y-2">
                <div className="text-2xl font-black text-slate-200">{s.num}</div>
                <div className="text-xs font-bold text-slate-900">{s.title}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bank Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Rekening Bank yang Didukung</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banks.map((b) => (
              <div key={b.name} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 mb-1">{b.name}</div>
                <div className="font-mono text-sm font-bold text-emerald-700">{b.no}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">a.n. {b.holder}</div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-5 text-[11px] text-slate-400">
            * Nomor rekening di atas adalah contoh. Rekening tujuan aktual ditampilkan saat checkout berdasarkan agensi travel yang Anda pilih.
          </div>
        </div>

        {/* Payment Schemes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Bayar Penuh (100%)</h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span>Pembayaran dilakukan sekaligus saat booking</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span>Booking langsung dikonfirmasi setelah verifikasi</li>
              <li className="flex items-start gap-2"><span className="text-emerald-600 font-bold mt-0.5">✓</span>Tidak ada kewajiban pembayaran tambahan</li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-800">Skema DP (Uang Muka)</h2>
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">✓</span>Bayar sebagian di awal untuk mengamankan tempat</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">✓</span>Sisa pelunasan wajib dibayar maksimal H-2 keberangkatan</li>
              <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">✓</span>Persentase DP ditentukan oleh masing-masing agensi</li>
            </ul>
          </div>
        </div>

        {/* Mobile Banking Note */}
        <div className="bg-slate-900 rounded-2xl p-6 flex items-start gap-4 text-white">
          <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold mb-1">Transfer via Mobile Banking atau ATM</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pastikan nominal transfer sesuai dengan yang tertera di halaman booking, termasuk angka unik jika diminta. Simpan bukti transfer sebelum diupload ke sistem.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
