import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan | TripKu",
  description: "Syarat dan ketentuan penggunaan platform TripKu untuk semua pengguna, mitra agensi, tour guide, dan driver.",
};

const sections = [
  {
    title: "1. Penerimaan Ketentuan",
    content: `Dengan mendaftar atau menggunakan layanan TripKu, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, Anda tidak diizinkan menggunakan platform kami.

TripKu berhak memperbarui ketentuan ini kapan saja. Penggunaan layanan secara berkelanjutan setelah perubahan diterbitkan dianggap sebagai penerimaan atas perubahan tersebut.`,
  },
  {
    title: "2. Definisi",
    content: `Dalam ketentuan ini:

• "Platform" merujuk pada website TripKu dan seluruh layanan yang tersedia di dalamnya
• "Pengguna" adalah siapapun yang mengakses atau menggunakan platform (customer, mitra agensi, guide, driver)
• "Mitra" adalah agensi travel, tour guide, dan driver yang terdaftar dan terverifikasi di TripKu
• "Paket" adalah produk perjalanan wisata yang ditawarkan oleh mitra agensi travel`,
  },
  {
    title: "3. Ketentuan untuk Customer",
    content: `Sebagai customer, Anda setuju bahwa:

• Informasi yang Anda berikan saat pendaftaran dan pemesanan adalah benar dan akurat
• Setiap peserta wajib memiliki identitas resmi yang valid (KTP atau paspor)
• Pembayaran dilakukan sesuai nominal dan tenggat waktu yang ditetapkan
• Pembatalan pemesanan mengikuti kebijakan masing-masing agensi travel
• TripKu bertindak sebagai platform penghubung, bukan sebagai penyelenggara perjalanan langsung`,
  },
  {
    title: "4. Ketentuan untuk Mitra Agensi Travel",
    content: `Sebagai mitra agensi travel, Anda setuju bahwa:

• Dokumen legalitas usaha (SIUP/NIB) yang diupload adalah asli dan masih berlaku
• Deskripsi, harga, fasilitas, dan jadwal paket wisata yang dipublikasikan adalah akurat
• Verifikasi pembayaran customer dilakukan dalam 1x24 jam kerja
• Penugasan tour guide dan driver dilakukan tepat waktu sebelum keberangkatan
• TripKu berhak menangguhkan akun jika ditemukan pelanggaran terhadap ketentuan ini`,
  },
  {
    title: "5. Ketentuan untuk Tour Guide dan Driver",
    content: `Sebagai kru wisata (tour guide atau driver), Anda setuju bahwa:

• Dokumen wajib (SIM untuk driver, sertifikasi untuk guide) yang diupload adalah asli dan berlaku
• Profil dan domisili yang tercantum adalah akurat
• Setiap penugasan yang diterima wajib dijalankan sesuai kesepakatan dengan agensi travel
• Negosiasi fee dilakukan secara jujur melalui sistem negosiasi yang tersedia
• Absensi keberangkatan dan kepulangan peserta wajib dicatat di sistem`,
  },
  {
    title: "6. Larangan Penggunaan",
    content: `Pengguna dilarang untuk:

• Mendaftarkan akun dengan identitas palsu atau dokumen tidak valid
• Melakukan transaksi di luar platform untuk menghindari sistem
• Menyebarkan informasi palsu, menyesatkan, atau merusak reputasi pihak lain di platform
• Mengakses data pengguna lain tanpa izin
• Melakukan tindakan yang melanggar hukum yang berlaku di Indonesia`,
  },
  {
    title: "7. Pembatasan Tanggung Jawab",
    content: `TripKu berperan sebagai platform penghubung antara customer dan mitra. Oleh karena itu:

• TripKu tidak bertanggung jawab atas kualitas layanan yang diberikan oleh mitra secara langsung
• TripKu tidak menanggung kerugian akibat pembatalan sepihak oleh mitra
• TripKu tidak bertanggung jawab atas kejadian force majeure (bencana alam, keadaan darurat, dll.)

Kami berkomitmen untuk menindaklanjuti setiap pengaduan yang masuk melalui kanal resmi kami.`,
  },
  {
    title: "8. Hak Kekayaan Intelektual",
    content: `Seluruh konten di platform TripKu termasuk logo, desain, teks, dan kode adalah milik PT TripKu Indonesia dan dilindungi oleh hukum hak cipta Indonesia. Dilarang menyalin, mendistribusikan, atau menggunakan konten tersebut tanpa izin tertulis dari kami.`,
  },
  {
    title: "9. Hukum yang Berlaku",
    content: `Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui jalur hukum yang berlaku.`,
  },
  {
    title: "10. Hubungi Kami",
    content: `Untuk pertanyaan mengenai syarat dan ketentuan ini, hubungi kami di:

Email: cs@tripku.id
Jam layanan: Senin – Minggu, 08.00 – 20.00 WIB`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Syarat &amp; Ketentuan</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-slate-500 text-sm">
            Terakhir diperbarui: Oktober 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {sections.map((s) => (
            <div key={s.title} className="px-6 sm:px-8 py-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">{s.title}</h2>
              <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{s.content}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Dengan menggunakan layanan TripKu, Anda menyetujui syarat dan ketentuan ini.{" "}
          <Link href="/privacy" className="text-emerald-600 hover:underline">Baca juga Kebijakan Privasi</Link>.
        </div>
      </div>
    </div>
  );
}
