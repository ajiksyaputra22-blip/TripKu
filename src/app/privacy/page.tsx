import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi | TripKu",
  description: "Kebijakan privasi TripKu mengenai pengumpulan, penggunaan, dan perlindungan data pengguna.",
};

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    content: `Kami mengumpulkan data yang Anda berikan secara langsung saat mendaftar, memesan paket wisata, atau menghubungi kami, antara lain:
    
• Nama lengkap dan nomor identitas (KTP/paspor) peserta perjalanan
• Alamat email dan nomor telepon (WhatsApp)
• Data profil untuk mitra kru (domisili, lisensi, sertifikasi)
• Bukti pembayaran yang Anda upload
• Pesan yang dikirim di Trip Room

Kami tidak mengumpulkan data kartu kredit atau informasi perbankan sensitif secara langsung.`,
  },
  {
    title: "2. Cara Kami Menggunakan Data",
    content: `Data yang dikumpulkan digunakan untuk:

• Memproses dan mengkonfirmasi pemesanan paket wisata
• Menghubungkan Anda dengan agensi travel, tour guide, dan driver
• Mengirim notifikasi terkait status booking dan perjalanan
• Memverifikasi identitas mitra (agensi, guide, driver) untuk keamanan
• Meningkatkan layanan dan pengalaman pengguna di platform`,
  },
  {
    title: "3. Berbagi Data dengan Pihak Ketiga",
    content: `Kami tidak menjual data pribadi Anda kepada pihak ketiga. Data dapat dibagikan hanya kepada:

• Agensi travel mitra yang mengelola paket yang Anda pesan (nama, kontak, data peserta)
• Tour guide dan driver yang ditugaskan pada perjalanan Anda (nama dan nomor kontak pemesan)
• Pihak berwenang jika diwajibkan oleh hukum yang berlaku di Indonesia`,
  },
  {
    title: "4. Penyimpanan dan Keamanan Data",
    content: `Data Anda disimpan di server kami yang dikelola dengan standar keamanan yang memadai. Kami menggunakan enkripsi HTTPS untuk seluruh komunikasi data. Akses ke data dibatasi hanya pada personel yang berwenang dan membutuhkan akses tersebut untuk menjalankan layanan.`,
  },
  {
    title: "5. Hak Pengguna",
    content: `Sebagai pengguna, Anda memiliki hak untuk:

• Mengakses data pribadi yang kami simpan tentang Anda
• Meminta koreksi data yang tidak akurat
• Meminta penghapusan akun dan data Anda (dengan konsekuensi tidak dapat mengakses layanan)
• Menarik persetujuan penggunaan data kapan saja

Untuk mengajukan permintaan, hubungi kami di cs@tripku.id.`,
  },
  {
    title: "6. Cookie dan Penyimpanan Lokal",
    content: `Kami menggunakan session cookie untuk menjaga status login Anda dan localStorage untuk menyimpan preferensi perbandingan paket secara lokal di perangkat Anda. Data ini tidak dikirim ke server dan dapat dihapus kapan saja melalui pengaturan browser Anda.`,
  },
  {
    title: "7. Perubahan Kebijakan",
    content: `Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan layanan setelah perubahan berlaku dianggap sebagai persetujuan terhadap kebijakan yang diperbarui.`,
  },
  {
    title: "8. Hubungi Kami",
    content: `Jika Anda memiliki pertanyaan atau kekhawatiran mengenai kebijakan privasi ini, silakan hubungi kami di:

Email: cs@tripku.id
Jam layanan: Senin – Minggu, 08.00 – 20.00 WIB`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Kebijakan Privasi</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Kebijakan Privasi
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
          Dengan menggunakan layanan TripKu, Anda menyetujui kebijakan privasi ini.{" "}
          <Link href="/terms" className="text-emerald-600 hover:underline">Baca juga Syarat &amp; Ketentuan</Link>.
        </div>
      </div>
    </div>
  );
}
