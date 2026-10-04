# PRD — Revisi Aplikasi Travel/Tour
**Versi dokumen:** 1.0
**Tanggal revisi sumber:** 27 September 2026
**Tujuan dokumen:** Menjadi acuan tunggal (single source of truth) bagi AI coding agent agar implementasi tidak keluar jalur dari scope revisi yang diminta. Setiap requirement diberi ID unik, deskripsi, acceptance criteria, dan referensi ke poin revisi asli.

---

## 0. Aktor (Roles)

| Role | Keterangan |
|---|---|
| Customer | Pengguna yang memesan paket wisata |
| Admin Travel | Pemilik/pengelola agensi travel, membuat paket destinasi |
| Driver | Kru pendukung trip (transportasi) |
| Tour Guide | Kru pendukung trip (pemandu) |
| Admin Sistem | Superadmin platform, memverifikasi dokumen semua aktor |

> **Catatan untuk AI agent:** Jangan menambah role, field, atau flow baru di luar yang tercantum di dokumen ini. Jika ada ambiguitas, ikuti perilaku yang paling mendekati deskripsi asli di kolom "Referensi Revisi", jangan berasumsi sendiri.

---

## 1. Autentikasi & Registrasi

### REQ-1.1 — Hapus Login/Register via Google
**Referensi Revisi:** #1
- Hilangkan seluruh tombol, handler, dan dependensi terkait login/register via Google (OAuth Google) dari seluruh aplikasi.
- Login dan register hanya menggunakan metode manual (email/username + password, sesuai skema data yang sudah ada).

**Acceptance Criteria:**
- [ ] Tidak ada tombol "Login/Register with Google" di halaman manapun.
- [ ] Tidak ada kode/konfigurasi Google OAuth yang tersisa dan aktif dipanggil.

### REQ-1.2 — Halaman Auth: 4 Kartu Register
**Referensi Revisi:** #8
- Halaman **register/auth** menampilkan **4 kartu aktor** saja: Customer, Admin Travel, Driver, Tour Guide.
- Fokus halaman ini adalah **pendaftaran (register)** — tidak ada opsi login di halaman ini.

**Acceptance Criteria:**
- [ ] Hanya 4 kartu tampil, tidak 5.
- [ ] Tidak ada elemen/link login di halaman register.

### REQ-1.3 — Halaman Login Tunggal (Single Door)
**Referensi Revisi:** #8
- Buat **satu halaman login umum** untuk seluruh aktor (Customer, Admin Travel, Driver, Tour Guide, Admin Sistem).
- Hanya **1 kartu/form login** di halaman ini.
- Sistem mendeteksi role akun secara otomatis dari kredensial dan mengarahkan ke dashboard sesuai role.
- Jika kredensial bukan milik akun yang terdaftar, login ditolak (tidak bisa masuk).

**Acceptance Criteria:**
- [ ] Hanya ada 1 halaman login untuk semua role.
- [ ] Redirect setelah login sesuai role akun.
- [ ] Kredensial salah/tidak sesuai role → login gagal dengan pesan error yang jelas.

---

## 2. Profil, Data Diri & Dokumen (Semua Aktor)

### REQ-2.1 — Semua Data Diri Tampil di Profile & Bisa Diedit Manual
**Referensi Revisi:** #15
- Seluruh data diri tiap aktor (Customer, Admin Travel, Driver, Tour Guide) ditampilkan lengkap di halaman profile masing-masing.
- Semua field bisa diedit manual oleh pemilik akun.

### REQ-2.2 — Profile Admin Travel
**Referensi Revisi:** #16
- Tambahkan halaman/section **Profile Admin Travel** berisi data yang diisi saat register.
- Diakses melalui komponen dropdown profile yang sudah ada di kode (`setProfileDropdownOpen`).

**Acceptance Criteria:**
- [ ] Admin Travel punya menu profile yang sebelumnya belum ada.
- [ ] Data yang tampil = data hasil register Admin Travel.

### REQ-2.3 — Nomor HP Pribadi Customer di Data Pemesanan Peserta
**Referensi Revisi:** #3
- Pada form/data pemesanan peserta (halaman customer), tambahkan field **nomor HP pribadi untuk dirinya sendiri** (customer sebagai peserta).

### REQ-2.4 — Register Driver: Hapus Info Kendaraan, Tambah Domisili
**Referensi Revisi:** #11
- Hapus semua field terkait **informasi kendaraan** dari form register Driver.
- Tambahkan field **domisili/wilayah tempat tinggal** di form register Driver.

### REQ-2.5 — Dokumen Pendukung per Role
**Referensi Revisi:** #10
| Role | Dokumen | Wajib? |
|---|---|---|
| Driver | SIM (upload file) | Wajib |
| Tour Guide | Dokumen pendukung (upload file) | Opsional |
| Admin Travel | Surat Izin Usaha (upload file) | Wajib |

- Semua dokumen di atas **wajib diupload sebagai file**, bukan berupa link.
- Seluruh dokumen ini dapat dilihat oleh **Admin Sistem** untuk proses approval (ACC).

**Acceptance Criteria:**
- [ ] Driver tidak bisa lanjut register tanpa upload SIM.
- [ ] Admin Travel tidak bisa lanjut register tanpa upload Surat Izin Usaha.
- [ ] Tour Guide bisa skip upload dokumen pendukung.
- [ ] Admin Sistem punya halaman untuk review & approve/reject dokumen tiap akun.

### REQ-2.6 — Sertifikat Tour Guide (Opsional)
**Referensi Revisi:** #14
- Tambahkan upload **sertifikat via file PDF** pada form register Tour Guide, sifatnya **opsional**.
- Upload berupa file asli, bukan link.

### REQ-2.7 — KTP: Auto-fill & Sinkronisasi Data
**Referensi Revisi:** #12, #13
- Data KTP (Nama, NIK, TTL) untuk Driver & Tour Guide **otomatis terisi (auto-fill)** berdasarkan hasil pembacaan/ekstraksi gambar KTP yang diupload (OCR atau mekanisme sejenis).
- Data hasil ekstraksi ini **wajib sinkron** dengan data yang diisi user — sistem harus bisa mendeteksi ketidakcocokan (mismatch) antara input manual dan data KTP.
- Data KTP yang sudah tersimpan **otomatis bisa diedit kembali** oleh user (Driver/Tour Guide).

**Acceptance Criteria:**
- [ ] Setelah upload foto KTP, field Nama/NIK/TTL terisi otomatis.
- [ ] Sistem menolak/menandai jika data manual tidak cocok dengan data KTP.
- [ ] User bisa edit ulang data KTP kapan saja dari profile.

### REQ-2.8 — Profil Tidak Lengkap = Tidak Bisa Ditugaskan
**Referensi Revisi:** #22
- Jika profile Tour Guide atau Driver **belum lengkap**, mereka:
  - Tidak bisa menerima penugasan kru.
  - **Nama tidak muncul/tidak tampil** di daftar kandidat kru pada sisi Admin Travel.

**Acceptance Criteria:**
- [ ] Definisikan "profil lengkap" = semua field wajib + dokumen wajib sudah terisi/terupload.
- [ ] Filter daftar kandidat kru di Admin Travel otomatis menyembunyikan akun dengan profil tidak lengkap.

---

## 3. Paket Destinasi (Trip Package)

### REQ-3.1 — Batas Waktu Pemesanan Otomatis Menonaktifkan Paket
**Referensi Revisi:** #2
- Setiap paket destinasi punya **batas waktu pemesanan**, contoh: jika tanggal keberangkatan 5 Okt, maka batas pemesanan customer adalah **minimal H-3** (2 Okt).
- Jika sudah melewati batas waktu dan Admin Travel **tidak membuka batch/paket lanjutan**, maka:
  - Paket **tidak bisa lagi dipesan** oleh customer.
  - Paket **otomatis dinonaktifkan** (status: nonaktif) — **bukan dihapus**.

**Acceptance Criteria:**
- [ ] Ada job/proses otomatis (scheduled) yang mengecek batas waktu tiap paket.
- [ ] Paket lewat batas waktu → status berubah jadi nonaktif, data tetap ada di database.
- [ ] Paket nonaktif tidak muncul/tidak bisa diklik "pesan" di sisi customer.

### REQ-3.2 — Rating Paket Berdasarkan Jumlah Pemesan
**Referensi Revisi:** #4
- Ranking/urutan "Paket Destinasi" ditentukan berdasarkan **jumlah customer yang memesan** paket tersebut.
- Tambahkan tampilan **rating** pada interface/card paket.

### REQ-3.3 — Rating Agensi (Admin Travel) di Halaman Pemesanan Customer
**Referensi Revisi:** #5
- Di halaman pemesanan (sisi customer), tampilkan kartu **"Tentang Agensi Penyelenggara"**.
- Rating agensi dihitung dari **agregasi rating seluruh paket** yang dimiliki Admin Travel tersebut.

### REQ-3.4 — Hapus Ikon/Logo DP di Interface Paket
**Referensi Revisi:** #7
- Hilangkan seluruh logo/ikon "DP" pada tampilan interface paket.

---

## 4. Pemesanan & Pembayaran

### REQ-4.1 — Kuota Trip Tidak Berkurang Sebelum Pembayaran/DP
**Referensi Revisi:** #6
- Jika customer memesan paket tapi **belum melakukan pembayaran/DP**:
  - Pesanan **tidak masuk** ke daftar pemesanan Admin Travel.
  - **Kuota trip tidak berkurang/terpotong**.
- Kuota baru berkurang setelah pembayaran/DP dikonfirmasi.

**Acceptance Criteria:**
- [ ] Status pemesanan punya state minimal: `pending_payment` → `confirmed`.
- [ ] Hanya status `confirmed` yang mengurangi kuota dan muncul di dashboard Admin Travel.

---

## 5. Penugasan Kru (Crew Assignment)

### REQ-5.1 — Tour Guide/Driver Melamar ke Paket Sesuai Domisili
**Referensi Revisi:** #9
- Tour Guide dan Driver dapat **melamar (apply)** ke paket destinasi yang dibuat Admin Travel.
- Lamaran hanya bisa dilakukan jika **domisili tempat tinggal mereka sesuai** dengan lokasi/domisili paket.
- Lamaran harus **diverifikasi oleh Admin Travel** (approve/reject).

**Acceptance Criteria:**
- [ ] Sistem memfilter/validasi kecocokan domisili sebelum lamaran bisa diajukan.
- [ ] Admin Travel punya interface untuk approve/reject lamaran.

### REQ-5.2 — Penugasan Berdasarkan Paket, Bukan Customer
**Referensi Revisi:** #17, #21
- Penugasan kru (Driver & Tour Guide) dilakukan **per paket destinasi/per trip**, bukan per customer individu.
- Satu penugasan kru berlaku untuk seluruh customer dalam trip/jadwal yang sama.

### REQ-5.3 — Alur Negosiasi Harga & Pembayaran Fee Kru
**Referensi Revisi:** #20
- Penugasan kru dari Admin Travel ke Tour Guide/Driver harus melalui **alur negosiasi harga** (bukan harga fix sepihak).
- Status "fee lunas" **tidak bisa langsung diklik/ditandai** oleh Admin Travel begitu saja.
  - Status yang benar: menunggu pembayaran → **"Menunggu Konfirmasi"** → lunas (setelah dikonfirmasi).
- Pembayaran fee harus disertai **bukti bayar** yang diupload oleh Admin Travel.

**Acceptance Criteria:**
- [ ] Ada flow negosiasi harga (tawar/setuju) sebelum penugasan final.
- [ ] Status fee tidak bisa langsung "Lunas" tanpa melalui "Menunggu Konfirmasi" + bukti bayar.

---

## 6. Dashboard Admin Travel

### REQ-6.1 — Layout Dashboard Utama Dipertahankan
**Referensi Revisi:** #24
- Pertahankan komponen berikut **tanpa perubahan struktur**:
  - `{/* Left (wider) — Pemesanan Terbaru */}`
  - `{/* Right — Paket Terpopuler */}`
- Bagian lain dari dashboard diperbaiki mengikuti seluruh poin revisi di dokumen ini.

### REQ-6.2 — Halaman Detail per Paket Destinasi (Bukan per Customer)
**Referensi Revisi:** #18
- Ketika Admin Travel mengklik satu paket destinasi (yang sudah dibuat Admin Sistem), tampilkan **satu halaman terpusat** berisi:
  1. Informasi seluruh customer/pemesan pada paket & jadwal tersebut.
  2. Monitoring perjalanan.
  3. Trip room.
  4. Penugasan kru.
- Semua customer dengan paket & jadwal yang sama masuk ke **satu halaman/pintu yang sama** (grouped by paket+jadwal), bukan halaman terpisah per customer.
- Di setiap paket/trip, tampilkan **list nama customer + nomor WA** yang bisa langsung connect ke WhatsApp.
- Setiap trip/paket juga menampilkan keterangan trip dan data wisatawan yang mendaftar beserta nomor WA-nya.

**Acceptance Criteria:**
- [ ] Struktur navigasi: Admin Travel → pilih paket destinasi → satu dashboard trip berisi 4 tab/section di atas.
- [ ] List customer per trip menampilkan nama + tombol/link WA (`wa.me/...` atau setara).

### REQ-6.3 — Trip Room di Admin Travel Redirect ke Dashboard Kru
**Referensi Revisi:** #19
- Saat Admin Travel mengklik entri **Tour Guide** atau **Driver** dari Trip Room, sistem **mengarahkan ke dashboard masing-masing kru tersebut** — **bukan** membuka trip room yang sebenarnya.

### REQ-6.4 — Monitoring Posisi & Narasi Status Perjalanan
**Referensi Revisi:** #20, #23
- Monitoring posisi wisatawan **hanya aktif setelah perjalanan dimulai**.
- Sebelum keberangkatan: tampilkan narasi **"Menunggu Keberangkatan"** (bukan peta kosong/error).
- Hanya **Tour Guide** yang berwenang mengupdate lokasi perjalanan.
- Update lokasi hanya bisa diinput **setelah perjalanan dimulai sesuai tanggal jadwal**.

**Acceptance Criteria:**
- [ ] Sebelum H (tanggal trip) & sebelum status "mulai trip", UI monitoring menampilkan status menunggu, bukan tracking aktif.
- [ ] Hanya akun role Tour Guide yang punya akses submit update lokasi.

---

## 7. Dashboard Tour Guide & Driver

### REQ-7.1 — Daftar Penugasan per Paket Destinasi (Tidak Dipisah per Role)
**Referensi Revisi:** #25
- Daftar penugasan wisata di sisi Tour Guide & Driver disusun **per paket destinasi** (contoh: "Kebun Teh"), dan di dalamnya menampilkan **semua customer** trip tersebut.
- Data customer, trip room, absen keberangkatan, absen pulang, lapor titik, dan "mulai trip" **tidak dipisahkan** antara tampilan Tour Guide dan Driver secara struktur data — semuanya terhubung ke customer yang sama.
- **Perbedaan tampilan Driver**: sisi Driver cukup menampilkan **Trip Room**, **data customer**, dan **Mulai Trip** saja (fitur lain seperti lapor titik tidak wajib tampil di Driver — sesuai konteks bahwa update lokasi hanya wewenang Tour Guide/REQ-6.4).

### REQ-7.2 — "Mulai Trip" Berubah Jadi "Selesaikan Trip"
**Referensi Revisi:** #25
- Tombol/status **"Mulai Trip"** akan berubah menjadi **"Selesaikan Trip"** setelah perjalanan berlangsung/selesai dilakukan.

**Acceptance Criteria:**
- [ ] State trip minimal: `belum mulai` → `mulai trip` (tombol berubah jadi "Selesaikan Trip") → `selesai`.

### REQ-7.3 — Nomor WA Customer di Absen Keberangkatan & Absen Pulang
**Referensi Revisi:** #26
- Pada fitur **Absen Keberangkatan** dan **Absen Pulang**, wajib menampilkan **nomor WA customer** yang bisa langsung diakses/diklik (connect ke WhatsApp).

---

## 8. Ringkasan Traceability (Mapping Poin Revisi → Requirement)

| # Revisi Asli | Requirement ID |
|---|---|
| 1 | REQ-1.1 |
| 2 | REQ-3.1 |
| 3 | REQ-2.3 |
| 4 | REQ-3.2 |
| 5 | REQ-3.3 |
| 6 | REQ-4.1 |
| 7 | REQ-3.4 |
| 8 | REQ-1.2, REQ-1.3 |
| 9 | REQ-5.1 |
| 10 | REQ-2.5 |
| 11 | REQ-2.4 |
| 12 | REQ-2.7 |
| 13 | REQ-2.7 |
| 14 | REQ-2.6 |
| 15 | REQ-2.1 |
| 16 | REQ-2.2 |
| 17 | REQ-5.2 |
| 18 | REQ-6.2 |
| 19 | REQ-6.3 |
| 20 | REQ-6.4, REQ-5.3 |
| 21 | REQ-5.2 |
| 22 | REQ-2.8 |
| 23 | REQ-6.4 |
| 24 | REQ-6.1 |
| 25 | REQ-7.1, REQ-7.2 |
| 26 | REQ-7.3 |

---

## 9. Batasan untuk AI Coding Agent

Agar implementasi tidak keluar jalur dari scope PRD ini:

1. **Jangan menambah fitur baru** yang tidak disebutkan di dokumen ini (contoh: jangan menambah metode login lain, jangan menambah role baru, jangan menambah field selain yang diminta).
2. **Jangan menghapus data** — instruksi "nonaktifkan" (REQ-3.1) berarti mengubah status, bukan menghapus record.
3. **Ikuti struktur "per paket destinasi"** sebagai satuan utama data di sisi Admin Travel, Tour Guide, dan Driver (REQ-5.2, REQ-6.2, REQ-7.1) — jangan mengembalikan ke struktur "per customer" seperti versi sebelumnya.
4. **Semua upload dokumen wajib berbentuk file**, bukan input link/URL (REQ-2.5, REQ-2.6).
5. Jika ada bagian kode existing yang secara eksplisit diminta dipertahankan (REQ-6.1), **jangan diubah namanya, posisinya, atau strukturnya** — hanya bagian lain yang boleh direvisi.
6. Jika suatu instruksi ambigu, cek kembali kolom "Referensi Revisi" pada requirement terkait di dokumen ini sebelum mengambil keputusan desain sendiri.
