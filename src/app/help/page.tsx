import Link from "next/link";
import { ChevronRight, MessageCircle, Phone, Mail, FileText, Clock, Shield, CreditCard } from "lucide-react";

export const metadata = {
  title: "Pusat Bantuan | TripKu",
  description: "Temukan jawaban atas pertanyaan umum seputar pemesanan, pembayaran, dan perjalanan bersama TripKu.",
};

const faqs = [
  {
    category: "Pemesanan & Booking",
    icon: FileText,
    items: [
      {
        q: "Bagaimana cara memesan paket wisata di TripKu?",
        a: "Pilih paket yang Anda inginkan di halaman Jelajahi Paket, klik tombol 'Pesan Sekarang', lalu ikuti langkah pengisian data peserta dan pembayaran. Kode booking akan dikirimkan setelah pembayaran terverifikasi.",
      },
      {
        q: "Apakah saya bisa memesan untuk lebih dari satu orang?",
        a: "Ya. Saat checkout, Anda dapat menambahkan data peserta sebanyak kapasitas yang tersedia pada paket tersebut. Setiap peserta wajib mengisi nama dan nomor identitas.",
      },
      {
        q: "Berapa lama proses verifikasi pembayaran?",
        a: "Verifikasi pembayaran dilakukan oleh agensi travel mitra dalam 1x24 jam kerja. Anda akan mendapat notifikasi setelah pembayaran dikonfirmasi.",
      },
      {
        q: "Apakah saya bisa membatalkan pemesanan?",
        a: "Kebijakan pembatalan ditentukan oleh masing-masing agensi travel. Silakan hubungi agensi terkait melalui Trip Room atau WhatsApp yang tersedia di halaman booking Anda.",
      },
    ],
  },
  {
    category: "Pembayaran",
    icon: CreditCard,
    items: [
      {
        q: "Metode pembayaran apa saja yang diterima?",
        a: "TripKu mendukung transfer bank manual. Detail rekening tujuan ditampilkan saat checkout. Bukti transfer wajib diupload untuk proses verifikasi.",
      },
      {
        q: "Apa itu skema DP (Down Payment)?",
        a: "Beberapa paket menyediakan opsi bayar DP terlebih dahulu, lalu melunasi sisanya sebelum H-2 keberangkatan. Besaran DP ditentukan oleh agensi travel masing-masing.",
      },
      {
        q: "Apakah pembayaran saya aman?",
        a: "Semua transaksi diverifikasi langsung oleh agensi travel mitra yang telah terverifikasi legalitasnya oleh tim admin TripKu. Bukti pembayaran disimpan di sistem kami.",
      },
    ],
  },
  {
    category: "Perjalanan & Kru",
    icon: Shield,
    items: [
      {
        q: "Bagaimana saya tahu siapa tour guide dan driver saya?",
        a: "Informasi kru yang ditugaskan akan tampil di Trip Room setelah agensi travel menetapkan penugasan. Anda dapat melihat nama, kontak, dan profil kru di sana.",
      },
      {
        q: "Apa itu Trip Room?",
        a: "Trip Room adalah ruang komunikasi khusus per perjalanan. Di sini Anda bisa mengirim pesan, melihat update lokasi kru, dan memantau status perjalanan secara real-time.",
      },
      {
        q: "Bagaimana cara memberikan ulasan setelah perjalanan?",
        a: "Setelah perjalanan selesai, tombol 'Beri Ulasan' akan muncul di halaman detail booking Anda. Ulasan mencakup rating paket, guide, dan driver secara terpisah.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Pusat Bantuan</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Pusat Bantuan TripKu
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Temukan jawaban atas pertanyaan seputar pemesanan, pembayaran, dan perjalanan. Tidak menemukan yang Anda cari? Hubungi kami langsung.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-800">{section.category}</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {section.items.map((item, i) => (
                    <details key={i} className="group px-6 py-4 cursor-pointer">
                      <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-800 list-none select-none">
                        {item.q}
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-3 text-xs text-slate-500 leading-relaxed">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Card */}
        <div className="mt-10 bg-slate-900 rounded-2xl p-6 sm:p-8 text-white">
          <h2 className="text-base font-bold mb-1">Masih butuh bantuan?</h2>
          <p className="text-xs text-slate-400 mb-6">Tim kami siap membantu Anda pada jam layanan.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="mailto:cs@tripku.id" className="flex items-center gap-3 p-4 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition-colors">
              <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">Email</div>
                <div className="text-[11px] text-slate-400">cs@tripku.id</div>
              </div>
            </a>
            <a href="https://wa.me/6281264683665" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition-colors">
              <MessageCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">WhatsApp</div>
                <div className="text-[11px] text-slate-400">+62 812 6468 3665</div>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/8 border border-white/10">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold">Jam Layanan</div>
                <div className="text-[11px] text-slate-400">Senin – Minggu, 08.00–20.00 WIB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
