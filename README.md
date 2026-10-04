# Sistem Informasi Layanan Perjalanan Wisata Terpadu (Multi-Vendor Marketplace)

Platform marketplace perjalanan wisata terpadu yang mempertemukan **Customer**, **Agensi Travel**, **Tour Guide**, **Driver**, dan **Admin Sistem** dalam satu ekosistem digital terpadu sesuai standar **PRD Sistem Informasi Layanan Perjalanan Wisata Terpadu v1.0**.

---

## 🌟 Fitur Utama Berdasarkan PRD

### 1. Customer Experience
- **Katalog & Pencarian Cerdas:** Filter destinasi (Labuan Bajo, Bromo, Raja Ampat, Bali, Jogja), durasi, dan rentang budget.
- **Komparasi Paket Wisata (P1 Feature):** Bandingkan spesifikasi 2 hingga 4 paket secara berdampingan (*side-by-side*).
- **Detail Paket Lengkap:** Galeri foto, durasi, armada transportasi, akomodasi, fasilitas termasuk, dan ulasan wisatawan.
- **Pemesanan Multi-Peserta:** Pengisian data manifest peserta (Nama, NIK KTP/Paspor, Tanggal Lahir, Kontak Darurat).
- **Upload Bukti Pembayaran Manual:** Transfer bank/e-wallet manual dengan upload foto bukti transfer.
- **Trip Room Terpadu:** Ruang pengumuman titik kumpul dan arahan persiapan tour.
- **Rating & Ulasan:** Memberikan feedback bintang dan ulasan setelah perjalanan selesai.

### 2. Travel Provider (Agensi Wisata)
- **Dashboard SaaS & Analitik:** KPI total booking, pendapatan terverifikasi, jumlah peserta, dan grafik tren bulanan.
- **Manajemen Paket (CRUD):** Tambah, edit, dan hapus paket wisata lengkap dengan kapasitas kuota.
- **Verifikasi Pembayaran:** Menyetujui atau menolak bukti transfer customer secara transparan.
- **Jadwal Perjalanan & Penugasan Kru:** Mengonversi booking terkonfirmasi menjadi Trip dan menugaskan Tour Guide serta Driver.
- **Manajemen Fee Kru:** Transparansi penetapan dan status pelunasan fee pekerja pariwisata.
- **Trip Room Admin:** Mempublikasikan titik kumpul dan arahan persiapan perjalanan.

### 3. Tour Guide Portal
- Menerima tawaran penugasan (*Accept / Reject*).
- Memperbarui status pelaksanaan perjalanan (*Scheduled -> Ongoing -> Completed*).
- Berkomunikasi satu arah memandu persiapan peserta di Trip Room.
- Pemantauan histori fee cair vs menunggu pelunasan.

### 4. Driver Portal
- Menerima penugasan armada kendaraan wisata.
- Memantau rute destinasi, jadwal keberangkatan, dan titik kumpul penjemputan.
- Rekapitulasi fee pengemudi.

### 5. Admin Sistem Portal
- Verifikasi legalitas agensi travel (NIB/Izin Usaha).
- Verifikasi lisensi pekerja pariwisata.
- Monitoring performa platform (Total user, travel, paket, transaksi).
- Manajemen akun dan kontrol akses (RBAC).

---

## 🔑 Akun Uji Coba Demo (5 Roles)

Sistem telah dilengkapi dengan *pre-seeded database* yang berisi akun demo untuk kelima aktor (Password default untuk semua akun: `password123`):

| Peran (Role) | Nama Pengguna | Alamat Email | Hak Akses Utama |
|---|---|---|---|
| **CUSTOMER** | Budi Pratama | `customer@example.com` | Jelajah, Komparasi, Booking, Upload Bukti, Review |
| **TRAVEL** | PT Jelajah Nusantara | `travel@nusantara.com` | Paket Wisata, Verifikasi Bayar, Trip, Assign Kru |
| **TRAVEL** | Flores Komodo Exp. | `travel@komodo.com` | Liveaboard Komodo, Trip Room, Fee Kru |
| **TOUR GUIDE**| Rian Hidayat | `guide@example.com` | Terima Tugas, Update Status Trip, Histori Fee |
| **DRIVER** | Pak Joko Susanto | `driver@example.com` | Tugas Kendaraan, Titik Kumpul, Histori Fee |
| **ADMIN** | Admin Sistem | `admin@wisataterpadu.com`| Verifikasi Mitra Travel, Pengguna, Monitoring |

> **Fitur Praktis:** Pada Navbar terdapat tombol **"Ganti Akun Demo"** untuk berganti peran dengan 1-klik tanpa perlu mengetik manual.

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Sinkronisasi Database & Seed Data:**
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

3. **Jalankan Server Development:**
   ```bash
   npm run dev
   ```
   Akses aplikasi pada peramban: `http://localhost:3000`

---

## 🛠️ Tech Stack
- **Framework:** Next.js 15 (App Router) & React 19
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS & Lucide Icons
- **Database ORM:** Prisma ORM (SQLite lokal / PostgreSQL-ready untuk Supabase/Vercel)
- **Autentikasi & Keamanan:** Session Cookie JWT terenkripsi (`jose`) + `bcryptjs`
