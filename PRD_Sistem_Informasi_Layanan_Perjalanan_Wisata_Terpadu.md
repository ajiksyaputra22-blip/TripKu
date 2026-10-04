# Product Requirements Document (PRD)
## Sistem Informasi Layanan Perjalanan Wisata Terpadu

**Versi:** 1.0  
**Basis:** SRS Sistem Informasi Layanan Perjalanan Wisata Terpadu v1.1, 16 September 2026  
**Status:** Draft PRD untuk pengembangan Project Capstone

---

## 1. Product Overview

Sistem Informasi Layanan Perjalanan Wisata Terpadu adalah platform **marketplace perjalanan wisata multi-vendor** yang mempertemukan:

- **Customer** yang mencari dan memesan perjalanan wisata.
- **Travel/Admin Travel** yang menyediakan serta mengelola paket perjalanan.
- **Tour Guide** yang menerima dan menjalankan penugasan perjalanan.
- **Driver** yang menerima dan menjalankan penugasan transportasi perjalanan.
- **Admin Sistem** yang mengelola pengguna, verifikasi, dan monitoring platform.

Produk dirancang untuk menyatukan proses dari pencarian paket, pemesanan, pengelolaan peserta, verifikasi pembayaran, persiapan perjalanan, penugasan guide/driver, komunikasi melalui Trip Room, hingga ulasan dan laporan.

### Product Vision

> Menjadi platform terpadu yang menyederhanakan proses pencarian, pemesanan, pengelolaan, dan pelaksanaan perjalanan wisata dengan menghubungkan customer, Travel, Tour Guide, dan Driver dalam satu sistem.

### Core Product Chain

```text
DISCOVERY
    ↓
COMPARISON
    ↓
BOOKING
    ↓
PAYMENT
    ↓
TRIP MANAGEMENT
    ↓
GUIDE / DRIVER ASSIGNMENT
    ↓
TRIP ROOM
    ↓
TRIP EXECUTION
    ↓
REVIEW
    ↓
ANALYTICS
```

---

# 2. Problem Statement

Proses layanan perjalanan wisata melibatkan banyak pihak dan tahapan. Jika pengelolaan dilakukan secara terpisah, pengguna dapat mengalami kesulitan dalam:

- menemukan dan membandingkan paket perjalanan;
- melakukan pemesanan;
- mengelola data peserta;
- mengirim dan memverifikasi bukti pembayaran;
- mempersiapkan perjalanan;
- mengatur Tour Guide dan Driver;
- menyampaikan informasi perjalanan kepada peserta;
- melakukan monitoring dan pelaporan operasional.

Travel juga membutuhkan sistem untuk mengelola paket, booking, peserta, pembayaran, perjalanan, penugasan pekerja, biaya, serta laporan secara terintegrasi.

Platform ini ditujukan untuk menyediakan satu alur layanan yang lebih terstruktur tanpa mengubah sistem menjadi platform transportasi atau hotel booking umum.

---

# 3. Product Goals

## 3.1 Goals Utama

1. Menyediakan marketplace perjalanan wisata multi-vendor.
2. Memudahkan customer mencari paket perjalanan sesuai kebutuhan.
3. Memudahkan customer membandingkan paket sebelum melakukan booking.
4. Memusatkan proses booking dan pengelolaan peserta.
5. Mendukung upload serta verifikasi bukti pembayaran.
6. Membantu Travel mengelola perjalanan dari booking sampai pelaksanaan.
7. Memfasilitasi penugasan Tour Guide dan Driver.
8. Menyediakan Trip Room sebagai ruang penyampaian informasi perjalanan.
9. Menyediakan rating dan review setelah perjalanan.
10. Menyediakan dashboard serta laporan operasional.

## 3.2 Goals Teknis

1. Menerapkan Role-Based Access Control (RBAC).
2. Menyediakan database terstruktur.
3. Menjaga keamanan data pengguna.
4. Menyediakan antarmuka responsif.
5. Memastikan setiap fitur memiliki validasi, status loading, error state, dan success state.
6. Menyediakan fondasi yang dapat dikembangkan pada tahap berikutnya.

---

# 4. Target Users

| User | Kebutuhan Utama | Karakteristik Penggunaan |
|---|---|---|
| Customer | Mencari, membandingkan, dan memesan perjalanan | Mobile-first |
| Travel/Admin Travel | Mengelola paket dan operasional perjalanan | Desktop-first |
| Tour Guide | Melihat dan menjalankan penugasan | Mobile-first |
| Driver | Melihat dan menjalankan penugasan | Mobile-first |
| Admin Sistem | Verifikasi dan monitoring platform | Desktop-first |

---

# 5. User Personas

## 5.1 Customer

**Tujuan:**
- menemukan perjalanan yang sesuai;
- mengetahui detail paket;
- membandingkan beberapa pilihan;
- melakukan booking;
- mengikuti informasi perjalanan.

**Pain Points:**
- informasi paket tersebar;
- sulit membandingkan paket;
- proses booking tidak terpusat;
- informasi perjalanan perlu dicari secara manual.

## 5.2 Travel/Admin Travel

**Tujuan:**
- mempublikasikan paket;
- mengelola booking;
- memverifikasi pembayaran;
- mengatur perjalanan;
- mencari dan menugaskan guide/driver;
- melihat laporan.

**Pain Points:**
- banyak data operasional;
- proses booking dan pembayaran harus dipantau;
- koordinasi pekerja perjalanan;
- kebutuhan laporan operasional.

## 5.3 Tour Guide

**Tujuan:**
- mengetahui penugasan;
- melihat detail perjalanan;
- mengetahui fee;
- memperbarui status pekerjaan.

## 5.4 Driver

**Tujuan:**
- mengetahui penugasan;
- melihat detail perjalanan;
- mengetahui fee;
- memperbarui status pekerjaan.

## 5.5 Admin Sistem

**Tujuan:**
- melakukan verifikasi pengguna;
- mengelola akun;
- melakukan monitoring platform.

---

# 6. Product Scope

## 6.1 In Scope

- Authentication
- Role-Based Access Control
- Registrasi pengguna
- Verifikasi Travel
- Verifikasi Guide/Driver
- Profil Travel
- Manajemen paket perjalanan
- Search
- Filter
- Comparison
- Package Detail
- Booking
- Data peserta
- Booking history
- Upload bukti pembayaran
- Verifikasi pembayaran
- Trip management
- Assignment Guide/Driver
- Fee management
- Trip Room
- Rating & Review
- Dashboard
- Reports
- Analytics berbasis data historis

## 6.2 Out of Scope

Sesuai SRS, sistem tidak mencakup:

- direct payment gateway;
- free chat;
- real-time GPS tracking;
- booking tiket pesawat;
- booking tiket kereta;
- booking tiket kapal;
- direct hotel booking;
- predictive forecasting yang kompleks;
- sistem transportasi umum secara umum.

---

# 7. Feature Map

```text
PLATFORM
│
├── Authentication
│   ├── Register
│   ├── Login
│   ├── Logout
│   └── Role-Based Access
│
├── Customer
│   ├── Browse Packages
│   ├── Search
│   ├── Filter
│   ├── Compare
│   ├── Package Detail
│   ├── Booking
│   ├── Participant Data
│   ├── Payment Proof
│   ├── Booking History
│   ├── Trip Room
│   └── Review
│
├── Travel
│   ├── Profile
│   ├── Package Management
│   ├── Booking Management
│   ├── Participant Management
│   ├── Payment Verification
│   ├── Trip Management
│   ├── Guide Assignment
│   ├── Driver Assignment
│   ├── Fee Management
│   ├── Trip Room
│   └── Reports & Analytics
│
├── Guide
│   ├── Profile
│   ├── Availability
│   ├── Assignment
│   ├── Trip Detail
│   ├── Task Update
│   └── Fee History
│
├── Driver
│   ├── Profile
│   ├── Availability
│   ├── Assignment
│   ├── Trip Detail
│   ├── Task Update
│   └── Fee History
│
└── Admin
    ├── User Management
    ├── Verification
    ├── Monitoring
    └── Dashboard
```

---

# 8. Feature Requirements

## 8.1 Authentication & Authorization

### Objective
Menyediakan akses sistem berdasarkan peran pengguna.

### Requirements

- Register.
- Login.
- Logout.
- Password disimpan dalam bentuk hash.
- Session harus aman.
- Setiap role hanya dapat mengakses fitur yang sesuai.
- Route yang dilindungi tidak dapat diakses tanpa autentikasi.

### Roles

```text
ADMIN
TRAVEL
CUSTOMER
GUIDE
DRIVER
```

### Priority
**P0**

---

## 8.2 Travel Verification

### Objective
Memastikan Travel yang menggunakan platform telah melalui proses verifikasi Admin.

### Main Flow

```text
Travel Register
    ↓
Submit Data
    ↓
Pending Verification
    ↓
Admin Review
    ↓
Approved / Rejected
```

### Priority
**P0**

---

## 8.3 Package Management

Travel dapat:

- membuat paket;
- mengubah paket;
- menghapus paket;
- mengatur harga;
- menentukan kapasitas;
- menentukan tanggal perjalanan;
- mengatur durasi;
- memasukkan itinerary;
- menentukan fasilitas;
- memasukkan informasi transportasi;
- memasukkan informasi akomodasi;
- mengubah status publikasi.

### Priority
**P0**

---

## 8.4 Search & Filter

Customer dapat mencari paket berdasarkan informasi yang tersedia.

Filter dapat mencakup:

- destinasi;
- harga;
- tanggal;
- durasi;
- Travel;
- fasilitas;
- kapasitas.

### Priority
**P0**

---

## 8.5 Package Comparison

Customer dapat membandingkan beberapa paket.

Informasi yang dapat dibandingkan:

- nama paket;
- Travel;
- destinasi;
- harga;
- durasi;
- tanggal;
- fasilitas;
- akomodasi;
- transportasi;
- kapasitas;
- rating jika tersedia.

### Recommendation

Batasi comparison pada sekitar **3–4 paket** agar tetap mudah dibaca.

### Priority
**P1**

---

## 8.6 Booking

Customer dapat:

1. memilih paket;
2. memilih jumlah peserta;
3. mengisi data peserta;
4. melihat ringkasan booking;
5. mengonfirmasi booking;
6. melanjutkan pembayaran.

### Booking Status

```text
PENDING
WAITING_PAYMENT
WAITING_VERIFICATION
CONFIRMED
CANCELLED
COMPLETED
```

### Priority
**P0**

---

## 8.7 Participant Management

Data peserta terhubung dengan booking.

Contoh data:

- nama;
- nomor identitas;
- tanggal lahir;
- kontak darurat.

Validasi wajib diterapkan sebelum booking dapat diselesaikan.

### Priority
**P0**

---

## 8.8 Payment Proof

Customer dapat:

- memilih metode pembayaran yang tersedia;
- memasukkan nominal;
- mengunggah bukti pembayaran;
- melihat status verifikasi.

Travel dapat:

- melihat bukti;
- memverifikasi;
- menolak;
- memberikan catatan verifikasi.

### Catatan

Sistem **tidak menggunakan direct payment gateway** pada scope ini.

### Priority
**P0**

---

## 8.9 Trip Management

Travel dapat membuat dan mengelola data perjalanan berdasarkan booking yang telah dikonfirmasi.

Data perjalanan dapat meliputi:

- jadwal;
- destinasi;
- kendaraan;
- operational notes;
- status perjalanan.

### Priority
**P0**

---

## 8.10 Guide & Driver Assignment

Travel dapat mencari pekerja yang tersedia dan membuat assignment.

Assignment memiliki:

- trip;
- worker;
- role;
- tanggal;
- status;
- fee/agreement.

### Flow

```text
Travel
  ↓
Select Trip
  ↓
Find Available Guide/Driver
  ↓
Send Assignment
  ↓
Worker Accepts
  ↓
Assignment Confirmed
```

### Priority
**P0**

---

## 8.11 Fee Management

Travel dapat mencatat fee untuk Guide/Driver.

Guide/Driver dapat melihat:

- assignment;
- nominal fee;
- status pembayaran;
- riwayat fee.

### Priority
**P1**

---

## 8.12 Trip Room

Trip Room digunakan untuk menyampaikan informasi kepada peserta perjalanan.

Contoh:

- pengumuman;
- perubahan jadwal;
- informasi titik kumpul;
- informasi persiapan;
- update perjalanan.

### Batasan

Trip Room bukan free chat.

### Priority
**P0**

---

## 8.13 Rating & Review

Setelah perjalanan selesai, Customer dapat memberikan:

- rating;
- review.

Review dapat digunakan sebagai informasi tambahan pada paket/Travel atau pihak terkait sesuai rancangan final sistem.

### Priority
**P1**

---

## 8.14 Dashboard & Analytics

Dashboard Travel dapat menampilkan:

- total booking;
- jumlah peserta;
- pendapatan;
- perjalanan aktif;
- paket populer;
- tren booking.

Analytics bersifat **deskriptif/historis**, bukan predictive forecasting kompleks.

### Priority
**P1**

---

# 9. Core User Flows

## 9.1 Customer Flow

```text
Landing Page
    ↓
Browse / Search / Filter
    ↓
Package Detail
    ↓
Compare (Optional)
    ↓
Login / Register
    ↓
Booking
    ↓
Participant Data
    ↓
Booking Summary
    ↓
Payment
    ↓
Upload Payment Proof
    ↓
Waiting Verification
    ↓
Payment Confirmed
    ↓
Trip Preparation
    ↓
Trip Room
    ↓
Trip
    ↓
Completed
    ↓
Rating / Review
```

## 9.2 Travel Flow

```text
Register
    ↓
Admin Verification
    ↓
Approved
    ↓
Travel Profile
    ↓
Create Package
    ↓
Publish
    ↓
Receive Booking
    ↓
Verify Payment
    ↓
Confirm Booking
    ↓
Prepare Trip
    ↓
Find Guide / Driver
    ↓
Assignment
    ↓
Set Fee
    ↓
Trip Room
    ↓
Trip
    ↓
Pay Worker
    ↓
Reports / Analytics
```

## 9.3 Guide / Driver Flow

```text
Register
    ↓
Admin Verification
    ↓
Profile
    ↓
Available
    ↓
Assignment
    ↓
View Trip
    ↓
View Fee
    ↓
Accept Assignment
    ↓
Participate in Trip
    ↓
Update Status
    ↓
Completed
    ↓
Fee History
```

## 9.4 Admin Flow

```text
Login
    ↓
Dashboard
    ↓
Pending Verification
    ↓
Review Data
    ↓
Approve / Reject
    ↓
Manage Users
    ↓
Monitor Platform
```

---

# 10. UI/UX Requirements

## 10.1 Customer Experience

Karakter desain:

- modern;
- bersih;
- visual;
- image-driven;
- card-based;
- mobile-first;
- navigasi sederhana.

### Struktur halaman utama

```text
Header
 ├── Logo
 ├── Search
 ├── Navigation
 └── Profile

Hero / Search Area

Popular / Recommended Packages

Package Cards

Popular Destinations

Travel Providers

Footer
```

## 10.2 Package Detail

Urutan informasi:

```text
Hero Image
↓
Package Name
Destination
Travel
Rating
Price
Book Now
↓
Itinerary
↓
Duration & Schedule
↓
Facilities
↓
Transportation
↓
Accommodation
↓
Capacity
↓
Description
↓
Reviews
```

## 10.3 Travel Dashboard

Karakter desain:

- professional;
- SaaS dashboard;
- desktop-first;
- sidebar navigation;
- tabel;
- card KPI;
- chart;
- status badge.

### KPI

```text
Total Booking
Total Participants
Revenue
Active Trips
```

## 10.4 Guide / Driver Dashboard

Fokus pada task:

- assignment aktif;
- trip berikutnya;
- detail tugas;
- fee;
- status pekerjaan.

## 10.5 Admin Dashboard

Fokus pada:

- pending verification;
- jumlah pengguna;
- status Travel;
- monitoring platform.

---

# 11. Design System Recommendation

> Bagian ini merupakan rekomendasi desain untuk pengembangan, bukan ketentuan eksplisit SRS.

## Typography

Rekomendasi:

- Inter untuk antarmuka utama;
- Poppins dapat digunakan untuk heading jika diperlukan.

## Spacing

Gunakan skala:

```text
4
8
12
16
24
32
48
64
```

## Border Radius

Gunakan sekitar:

```text
8px
12px
16px
```

## Komponen

Minimal memiliki:

- Button;
- Input;
- Select;
- Search;
- Card;
- Modal;
- Table;
- Tabs;
- Badge;
- Dropdown;
- Pagination;
- Toast;
- Empty State;
- Loading State;
- Error State.

### Status

Jangan hanya menggunakan warna.

Gunakan kombinasi:

```text
Icon + Label + Color
```

---

# 12. Information Architecture

```text
Public
├── Home
├── Explore
├── Search
├── Package Detail
├── Travel Profile
├── Login
└── Register

Customer
├── Dashboard
├── My Booking
├── Booking Detail
├── Trip Room
├── Review
└── Profile

Travel
├── Dashboard
├── Packages
├── Bookings
├── Participants
├── Payments
├── Trips
├── Guide & Driver
├── Assignments
├── Fees
├── Trip Room
├── Reports
└── Profile

Guide
├── Dashboard
├── Assignments
├── Trips
├── Fee History
└── Profile

Driver
├── Dashboard
├── Assignments
├── Trips
├── Fee History
└── Profile

Admin
├── Dashboard
├── User Management
├── Verification
└── Monitoring
```

---

# 13. Database Overview

## 13.1 Users

```text
users
- id
- name
- email
- password_hash
- phone
- role
- status
- created_at
- updated_at
```

## 13.2 Travel

```text
travels
- id
- user_id
- business_name
- description
- verification_status
- verification_document
- created_at
- updated_at
```

## 13.3 Packages

```text
packages
- id
- travel_id
- name
- destination
- price
- departure_date
- duration
- vehicle
- facilities
- accommodation
- capacity
- description
- status
- created_at
- updated_at
```

## 13.4 Bookings

```text
bookings
- id
- customer_id
- package_id
- booking_date
- participant_count
- total_price
- status
- created_at
- updated_at
```

## 13.5 Participants

```text
participants
- id
- booking_id
- name
- identity_number
- birth_date
- emergency_contact
```

## 13.6 Payments

```text
payments
- id
- booking_id
- payment_date
- method
- amount
- payment_type
- proof_url
- status
- verification_note
```

## 13.7 Trips

```text
trips
- id
- booking_id
- package_id
- schedule
- destination
- vehicle
- operational_notes
- status
```

## 13.8 Assignments

```text
assignments
- id
- trip_id
- travel_id
- worker_id
- role
- assignment_date
- status
- agreement
```

## 13.9 Fees

```text
fees
- id
- assignment_id
- amount
- agreement_date
- payment_status
- payment_date
```

## 13.10 Trip Rooms

```text
trip_rooms
- id
- trip_id
- title
- created_at
```

## 13.11 Trip Updates

```text
trip_updates
- id
- trip_room_id
- user_id
- content
- created_at
```

## 13.12 Reviews

```text
reviews
- id
- trip_id
- reviewer_id
- reviewed_user_id
- rating
- review
- created_at
```

---

# 14. Relationship Overview

```text
USER
 │
 ├── TRAVEL
 │     └── PACKAGE
 │           └── BOOKING
 │                 ├── PARTICIPANT
 │                 └── PAYMENT
 │
 ├── CUSTOMER
 │     └── BOOKING
 │
 ├── GUIDE
 │     └── ASSIGNMENT
 │
 └── DRIVER
       └── ASSIGNMENT

PACKAGE
   └── TRIP
         ├── ASSIGNMENT
         │      └── FEE
         │
         └── TRIP ROOM
                └── TRIP UPDATE

TRIP
 └── REVIEW
```

---

# 15. Technical Requirements

## 15.1 Recommended Tech Stack

> Stack berikut merupakan rekomendasi implementasi untuk capstone, bukan ketentuan eksplisit SRS.

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

Pilihan yang direkomendasikan untuk tim kecil:

- Next.js full-stack;
- Prisma ORM;
- PostgreSQL.

Alternatif:

- Next.js sebagai frontend;
- NestJS sebagai backend;
- Prisma;
- PostgreSQL.

### Authentication

- Auth.js / NextAuth;
- email + password;
- session-based authentication;
- RBAC.

### Database

- PostgreSQL.

### Storage

Cloud/object storage untuk:

- bukti pembayaran;
- dokumen verifikasi;
- foto paket;
- media lain.

Database menyimpan URL/path file, bukan binary file jika tidak diperlukan.

### Deployment

Rekomendasi:

```text
Frontend / App → Vercel
Database → Supabase PostgreSQL
Storage → Supabase Storage / Object Storage
```

---

# 16. System Architecture

```text
┌─────────────────────────────┐
│         Client/User         │
│ Customer / Travel / Worker  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       Next.js Frontend      │
│ UI + Client Interaction     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ API / Server Layer          │
│ Auth + RBAC + Validation    │
│ Business Logic              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        Prisma ORM           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       PostgreSQL DB         │
└─────────────────────────────┘

               +
               │
               ▼
┌─────────────────────────────┐
│ Cloud Object Storage        │
│ Payment Proof / Documents   │
└─────────────────────────────┘
```

---

# 17. API Overview

Endpoint awal yang disarankan:

```text
/api/auth
/api/users
/api/travels
/api/packages
/api/bookings
/api/participants
/api/payments
/api/trips
/api/assignments
/api/fees
/api/trip-room
/api/reviews
/api/reports
```

Setiap endpoint perlu menerapkan:

- authentication;
- authorization;
- input validation;
- error handling;
- response consistency.

---

# 18. Security Requirements

## Authentication

- Password wajib di-hash.
- Session harus aman.
- Logout harus invalidasi session sesuai mekanisme authentication.

## Authorization

Setiap role memiliki permission berbeda.

Contoh:

```text
Customer → Booking miliknya
Travel → Package dan booking miliknya
Guide → Assignment miliknya
Driver → Assignment miliknya
Admin → Verification dan monitoring
```

## Data Protection

Data sensitif seperti:

- KTP;
- SIM;
- nomor identitas;
- bukti pembayaran;

harus memiliki akses terbatas.

## File Security

- Validasi extension.
- Validasi MIME type.
- Batasi ukuran file.
- Gunakan storage yang aman.
- Jangan expose dokumen sensitif secara publik.

## Web Security

- HTTPS.
- Input validation.
- Protection terhadap unauthorized access.
- Secure session/cookie configuration.
- Server-side authorization.

---

# 19. Non-Functional Requirements

> Angka di bagian ini adalah target rekomendasi untuk capstone dan perlu disesuaikan dengan lingkungan deployment.

## Performance

Target:

- normal page load ≤ 3 detik;
- API response normal ≤ 1–2 detik;
- search/filter ≤ 2 detik untuk dataset capstone.

## Responsiveness

Sistem harus dapat digunakan pada:

- desktop;
- tablet;
- mobile.

Customer, Guide, dan Driver diprioritaskan mobile-first.

## Usability

- navigasi konsisten;
- label jelas;
- form mudah dipahami;
- error message informatif;
- status mudah dikenali.

## Reliability

Sistem harus memberikan feedback ketika:

- request berhasil;
- request gagal;
- data sedang diproses;
- data kosong.

---

# 20. Analytics

Analytics digunakan untuk memahami kondisi operasional berdasarkan data yang tersimpan.

Contoh:

- jumlah booking per periode;
- pendapatan;
- paket populer;
- destinasi populer;
- jumlah peserta;
- perjalanan aktif.

## Batasan

Analytics tidak menjadi sistem predictive forecasting kompleks.

Jika fitur recommendation dipertahankan, gunakan pendekatan sederhana berbasis:

- filter;
- popularitas;
- rating;
- histori booking;
- kesesuaian atribut.

Tidak diperlukan machine learning atau deep learning untuk MVP.

---

# 21. Notification Strategy

Notification dapat digunakan untuk kejadian penting seperti:

- booking dibuat;
- pembayaran diterima;
- pembayaran diverifikasi;
- assignment dibuat;
- perubahan status perjalanan;
- update Trip Room.

Untuk MVP, notification dapat dimulai dari:

- in-app notification;
- status pada dashboard;
- email jika memang diperlukan.

Push notification/mobile notification bukan prioritas awal.

---

# 22. MVP Definition

## P0 — Wajib

```text
Authentication
RBAC
Travel Verification
Travel Profile
Package Management
Search
Filter
Package Detail
Booking
Participant Management
Payment Proof
Payment Verification
Trip Management
Guide Assignment
Driver Assignment
Trip Room Basic
```

## P1 — Setelah Core Stabil

```text
Comparison
Rating & Review
Fee Management
Booking History
Reports
Dashboard Analytics
Guide/Driver Availability
```

## P2 — Enhancement

```text
Advanced Analytics
Advanced Filtering
Advanced Notification
Rich Media
Simple Recommendation Enhancement
```

---

# 23. Scope Control

Karena proyek merupakan capstone dengan waktu dan sumber daya terbatas, pengembangan harus mengikuti prinsip:

> Prioritaskan kedalaman fitur inti daripada memperbanyak jumlah fitur.

### Fitur yang jangan ditambahkan tanpa keputusan scope

- live GPS;
- live chat;
- payment gateway kompleks;
- AI recommendation;
- predictive forecasting;
- flight/train/ship booking;
- hotel booking;
- sistem transportasi umum;
- marketplace di luar kebutuhan perjalanan wisata.

---

# 24. Definition of Done

Sebuah fitur dianggap selesai jika:

- UI telah dibuat;
- database telah terhubung jika dibutuhkan;
- API/service telah tersedia jika dibutuhkan;
- validasi telah diterapkan;
- authorization telah diterapkan;
- success state tersedia;
- loading state tersedia;
- error state tersedia;
- data tersimpan/diambil dengan benar;
- alur utama telah diuji;
- tidak terdapat bug kritis.

---

# 25. Acceptance Criteria

Contoh acceptance criteria untuk fitur booking:

```text
Given customer telah login
When customer memilih paket
Then customer dapat melakukan booking.

Given customer belum mengisi seluruh data peserta
When customer mencoba menyelesaikan booking
Then sistem menolak proses dan menampilkan field yang belum lengkap.

Given booking berhasil dibuat
When customer membuka detail booking
Then sistem menampilkan status booking dan informasi pembayaran.
```

Contoh payment verification:

```text
Given customer telah mengunggah bukti pembayaran
When Travel membuka daftar pembayaran
Then Travel dapat melihat bukti pembayaran.

When Travel menyetujui pembayaran
Then status pembayaran berubah menjadi VERIFIED
dan status booking dapat diperbarui sesuai business rule.
```

---

# 26. Recommended Development Roadmap

## Sprint 1 — Foundation

- project setup;
- database setup;
- authentication;
- RBAC;
- base UI;
- user management.

## Sprint 2 — Travel & Package

- Travel profile;
- verification;
- package CRUD;
- search;
- filter;
- package detail.

## Sprint 3 — Booking & Payment

- booking;
- participant;
- booking summary;
- payment proof;
- payment verification.

## Sprint 4 — Trip Operations

- trip management;
- guide;
- driver;
- assignment;
- fee.

## Sprint 5 — Communication & Review

- Trip Room;
- trip updates;
- rating;
- review;
- booking history.

## Sprint 6 — Reporting & Finalization

- dashboard analytics;
- reports;
- testing;
- bug fixing;
- UI polish;
- deployment;
- documentation.

---

# 27. Product Risks

## 27.1 Scope terlalu besar

**Risk:** Banyak role dan fitur menyebabkan development tidak selesai.

**Mitigation:** gunakan P0/P1/P2.

## 27.2 Multi-role complexity

**Risk:** Permission dan dashboard tiap role semakin kompleks.

**Mitigation:** definisikan RBAC sejak awal.

## 27.3 Payment Verification

**Risk:** Status booking dan payment dapat tidak sinkron.

**Mitigation:** definisikan state machine dan business rules.

## 27.4 Sensitive Documents

**Risk:** KTP/SIM atau bukti pembayaran terekspos.

**Mitigation:** private storage, authorization, signed URL bila diperlukan.

## 27.5 Assignment Logic

**Risk:** Guide/Driver dapat menerima assignment yang bentrok.

**Mitigation:** validasi availability dan conflict sebelum assignment dikonfirmasi.

## 27.6 Database Relationship

**Risk:** Relasi Booking → Participant → Payment → Trip → Assignment cukup kompleks.

**Mitigation:** buat ERD dan migration secara bertahap.

---

# 28. Suggested Booking State Machine

```text
DRAFT
  ↓
PENDING
  ↓
WAITING_PAYMENT
  ↓
WAITING_VERIFICATION
  ↓
CONFIRMED
  ↓
TRIP_ACTIVE
  ↓
COMPLETED
```

Alternative:

```text
PENDING
  ├── CANCELLED
  └── WAITING_PAYMENT

WAITING_PAYMENT
  ├── CANCELLED
  └── WAITING_VERIFICATION

WAITING_VERIFICATION
  ├── CONFIRMED
  └── PAYMENT_REJECTED
```

---

# 29. Suggested Assignment State Machine

```text
PROPOSED
   ↓
PENDING_ACCEPTANCE
   ↓
ACCEPTED
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Alternative:

```text
PENDING_ACCEPTANCE
   ├── ACCEPTED
   └── REJECTED
```

---

# 30. Product Success Metrics

Metrics yang dapat digunakan untuk evaluasi prototype:

## Customer

- jumlah paket yang dilihat;
- jumlah pencarian;
- jumlah comparison;
- jumlah booking;
- completion rate booking.

## Travel

- jumlah paket aktif;
- jumlah booking;
- jumlah booking terkonfirmasi;
- jumlah perjalanan selesai;
- total pendapatan tercatat.

## Operations

- jumlah assignment;
- assignment accepted;
- trip completed;
- payment verified.

## Platform

- jumlah pengguna terverifikasi;
- jumlah Travel aktif;
- jumlah paket aktif;
- jumlah transaksi booking.

---

# 31. Recommended Team Responsibilities

Jika dikerjakan oleh tim capstone:

### Product / Project Manager

- scope;
- prioritas;
- koordinasi;
- backlog.

### Business Analyst

- requirement;
- use case;
- business rules;
- acceptance criteria.

### UI/UX

- user flow;
- wireframe;
- prototype;
- design system.

### Frontend

- interface;
- interaction;
- API integration.

### Backend

- API;
- authentication;
- authorization;
- business logic;
- database.

### QA / Tester

- test case;
- functional testing;
- regression testing;
- bug tracking.

Satu anggota dapat memegang lebih dari satu peran sesuai ukuran tim.

---

# 32. Final Product Blueprint

```text
                         ┌───────────────────┐
                         │   ADMIN SYSTEM    │
                         │ Verification      │
                         │ Monitoring        │
                         └─────────┬─────────┘
                                   │
                                   ▼
┌──────────────┐          ┌───────────────────┐          ┌──────────────┐
│   CUSTOMER   │─────────▶│ TRAVEL MARKETPLACE│◀────────│    TRAVEL    │
│              │          │                   │          │              │
│ Search       │          │ Packages          │          │ Package      │
│ Compare      │          │ Booking           │          │ Booking      │
│ Booking      │          │ Payment           │          │ Trip         │
│ Payment      │          │ Trip              │          │ Assignment   │
│ Trip Room    │          │ Assignment        │          │ Reports      │
│ Review       │          │ Trip Room         │          │ Analytics    │
└──────────────┘          │ Review            │          └──────┬───────┘
                          └─────────┬─────────┘                 │
                                    │                           │
                           ┌────────┴────────┐                  │
                           ▼                 ▼                  │
                    ┌────────────┐   ┌────────────┐             │
                    │ TOUR GUIDE │   │   DRIVER   │◀────────────┘
                    │ Assignment │   │ Assignment │
                    │ Trip       │   │ Trip       │
                    │ Fee        │   │ Fee        │
                    └────────────┘   └────────────┘
```

---

# 33. Critical Review of SRS

Berdasarkan SRS v1.1, terdapat beberapa hal yang perlu dijaga selama implementasi:

1. **Jangan mengubah platform menjadi single-vendor.** Konsep multi-vendor merupakan inti sistem.
2. **Travel bertanggung jawab terhadap operasional booking dan perjalanan.** Admin Sistem berfokus pada verifikasi dan monitoring.
3. **Guide dan Driver merupakan aktor independen** yang dapat menerima penugasan dari lebih dari satu Travel.
4. **Trip Room bukan free chat.** Fungsinya sebagai ruang penyampaian informasi/update perjalanan.
5. **Pembayaran menggunakan upload bukti dan verifikasi**, bukan direct payment gateway.
6. **Analytics bersifat historis/deskriptif.** Jangan menjadikan predictive forecasting sebagai core feature.
7. **Data sensitif Guide/Driver harus dilindungi.**
8. **Recommendation**, apabila dipertahankan, sebaiknya berupa rekomendasi sederhana berbasis data yang sudah tersedia dan bukan AI kompleks.
9. **MVP harus mengutamakan alur end-to-end:** browse → booking → payment → trip → assignment → trip room → completion.
10. Setiap penambahan fitur di luar SRS harus diberi label sebagai **Recommendation/Enhancement/Optional**, bukan dianggap requirement asli.

---

# 34. Open Questions Before Development

Hal berikut perlu diputuskan sebelum implementasi final:

1. Apakah customer wajib login sebelum melihat detail paket atau hanya sebelum booking?
2. Apakah satu booking dapat menghasilkan satu Trip atau beberapa Trip?
3. Apakah satu Trip dapat memiliki banyak booking/customer?
4. Apakah Guide/Driver harus menerima assignment secara eksplisit atau assignment langsung dikonfirmasi Travel?
5. Bagaimana mekanisme pembatalan booking dan refund jika nanti diperlukan?
6. Metode pembayaran apa saja yang ditampilkan dalam MVP?
7. Apakah Trip Room dapat digunakan hanya oleh peserta terkait atau juga Guide/Driver?
8. Apakah rating ditujukan kepada Travel, Guide/Driver, paket, atau kombinasi?
9. Apakah Travel dapat menentukan Guide/Driver dari daftar global platform?
10. Apakah sistem membutuhkan email notification pada MVP?
11. Bagaimana aturan kapasitas paket jika beberapa booking masuk bersamaan?
12. Apakah satu customer dapat melakukan beberapa booking untuk paket yang sama?

Keputusan atas pertanyaan ini sebaiknya dimasukkan kembali ke SRS/Business Rules sebelum database dan API difinalkan.

---

# 35. Source of Truth

Dokumen PRD ini diturunkan dari:

**Sistem Informasi Layanan Perjalanan Wisata Terpadu — SRS Version 1.1 — 16 September 2026.**

Jika terdapat konflik antara rekomendasi implementasi dalam PRD dan requirement resmi SRS, maka requirement SRS menjadi acuan utama. Bagian yang tidak secara eksplisit ditentukan SRS harus dianggap sebagai rekomendasi dan dapat disesuaikan berdasarkan keputusan tim, dosen, atau hasil analisis lanjutan.
