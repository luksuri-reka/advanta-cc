# Proyek Advanta CC: Sistem Verifikasi Produk dan Manajemen Admin

Selamat datang di dokumentasi proyek Advanta CC, sebuah aplikasi web lengkap yang dibangun menggunakan Next.js, TypeScript, dan Supabase. Aplikasi ini memiliki dua fungsi utama: halaman verifikasi produk untuk publik dan konsol admin yang komprehensif untuk manajemen data internal.

## 🚀 Ringkasan Konsep dan Alur Kerja

Aplikasi ini terbagi menjadi dua bagian utama dengan alur kerja yang berbeda namun saling terhubung:

### 1\. Alur Kerja Verifikasi Publik (User-Facing)

Ini adalah halaman yang dapat diakses oleh siapa saja untuk memverifikasi keaslian produk benih Advanta.

  * **Pencarian**: Pengguna memasukkan **Nomor Seri** unik yang terdapat pada kemasan produk ke dalam form pencarian di halaman utama (`/page.tsx`).
  * **Komunikasi API**: Form tersebut memanggil fungsi `searchProduct` (`app/utils/api.ts`) yang berkomunikasi dengan *database* Supabase melalui sebuah RPC (Remote Procedure Call) bernama `get_product_details_by_serial`.
  * **Hasil Verifikasi**:
      * **Berhasil**: Jika nomor seri valid, API mengembalikan detail lengkap produk. Komponen `ProductResult` (`app/components/ProductResult.tsx`) akan menampilkan informasi ini dengan antarmuka yang kaya, termasuk detail produk, parameter uji, dan informasi sertifikasi.
      * **Gagal**: Jika nomor seri tidak ditemukan, pesan kesalahan akan ditampilkan. Pengguna diberikan opsi untuk melaporkan kegagalan ini, yang akan dicatat di *database* untuk diinvestigasi lebih lanjut (`app/api/report-failure/route.ts`).

### 2\. Alur Kerja Konsol Admin (Admin-Facing)

Ini adalah area terproteksi untuk staf internal Advanta guna mengelola seluruh data yang terkait dengan produk dan operasional.

  * **Autentikasi & Otorisasi**:
      * Akses ke semua rute di bawah `/admin` dilindungi oleh *middleware* (`middleware.ts`) yang memeriksa sesi otentikasi Supabase.
      * Pengguna yang belum *login* akan diarahkan ke halaman `/admin/login`.
      * Sistem *login* dan manajemen sesi ditangani oleh `app/utils/auth.ts` dan `AuthContext.tsx`.
  * **Dashboard**: Setelah berhasil *login*, admin akan disambut oleh halaman *dashboard* (`app/admin/page.tsx`) yang menampilkan statistik kunci seperti jumlah pengguna, produk, dan data produksi.
  * **Manajemen Data (CRUD)**:
      * Admin dapat melakukan operasi **Create, Read, Update, dan Delete (CRUD)** pada berbagai modul.
      * Setiap modul (misalnya, *Users, Products, Productions*) memiliki struktur serupa: sebuah halaman utama (`page.tsx`) yang mengambil data dari server, sebuah komponen klien (`*Client.tsx`) untuk mengelola interaksi UI, sebuah komponen formulir (`*Form.tsx`) untuk menambah/mengedit data, dan sebuah `actions.ts` yang berisi *Server Actions* untuk berinteraksi langsung dengan Supabase.
  * **Fitur Lanjutan**:
      * **Impor & Ekspor**: Admin dapat mengimpor data produksi secara massal menggunakan template Excel/CSV dan mengekspor data yang difilter ke dalam format Excel sesuai template pemerintah.
      * **Generate Registers**: Admin dapat men-generate ribuan data *register* QR code untuk setiap *batch* produksi berdasarkan token verifikasi eksternal.

-----

## 🏛️ Struktur Proyek

Struktur direktori aplikasi ini diatur mengikuti konvensi App Router dari Next.js untuk memisahkan antara bagian publik dan bagian admin.

```
luksuri-reka/advanta-cc/
├── app/
│   ├── (public)/
│   │   ├── page.tsx               # Halaman utama verifikasi produk
│   │   └── components/
│   │       └── ProductResult.tsx    # Komponen untuk menampilkan hasil verifikasi
│   │
│   ├── admin/
│   │   ├── page.tsx               # Halaman dashboard admin
│   │   ├── layout.tsx             # Layout dasar untuk area admin
│   │   ├── Navbar.tsx             # Komponen navigasi admin
│   │   ├── login/                 # Halaman login khusus admin
│   │   ├── bags/                  # Modul manajemen kantong & QR
│   │   ├── products/              # Modul manajemen data master produk
│   │   ├── productions/           # Modul manajemen data produksi
│   │   ├── users/                 # Modul manajemen pengguna
│   │   ├── roles/                 # Modul manajemen peran & hak akses
│   │   └── ... (modul lainnya)     # Modul master data (varietas, kelas benih, dll.)
│   │
│   ├── api/
│   │   ├── admin/                 # API Routes khusus admin (cth: users-count)
│   │   ├── productions/           # API Routes untuk impor, ekspor, dll.
│   │   └── report-failure/        # API Route untuk laporan kegagalan verifikasi
│   │
│   ├── utils/
│   │   ├── api.ts                 # Logika koneksi ke RPC Supabase
│   │   ├── auth.ts                # Fungsi otentikasi (login, logout)
│   │   ├── supabase.ts            # Inisialisasi Supabase client
│   │   └── ... (utilitas lainnya)
│   │
│   ├── AuthContext.tsx          # React Context untuk manajemen sesi otentikasi
│   ├── globals.css              # Styling global
│   └── layout.tsx               # Root layout aplikasi
│
├── public/                      # Aset statis (gambar, ikon)
├── middleware.ts                # Middleware untuk proteksi rute admin
└── ... (file konfigurasi)
```

-----

## ✨ Fitur Utama

### Halaman Publik

  * **Verifikasi Nomor Seri**: Form sederhana dan intuitif untuk cek keaslian produk.
  * **Tampilan Hasil Detail**: Hasil verifikasi yang kaya informasi, mencakup foto, data teknis, parameter uji lab, dan info sertifikasi.
  * **Desain Responsif**: Tampilan yang optimal di berbagai perangkat, dari desktop hingga mobile.
  * **Mekanisme Pelaporan**: Memungkinkan pengguna melaporkan jika produk tidak ditemukan, memberikan *feedback* berharga bagi perusahaan.

### Konsol Admin

  * **Dashboard Informatif**: Memberikan gambaran umum aktivitas sistem secara *real-time*.
  * **Manajemen Pengguna & Peran**: Kontrol akses terperinci dengan sistem peran (*roles*) dan izin (*permissions*).
  * **Manajemen Data Master**: CRUD lengkap untuk semua data inti bisnis, termasuk:
      * Produk & SKU
      * Perusahaan & Mitra
      * Jenis Tanaman, Varietas, Kelas Benih, Bahan Aktif
  * **Manajemen Produksi End-to-End**:
      * Pencatatan data produksi yang sangat detail, dari target hingga hasil lab.
      * Fitur **impor** data produksi massal dari file Excel/CSV.
      * Fitur **ekspor** data ke format Excel sesuai standar Kementerian Pertanian.
  * **Manajemen QR & Kemasan**:
      * Sistem untuk men-generate ribuan *register* QR code unik untuk setiap *batch* produksi.
      * Manajemen data kantong (*bags*) dan kemasan (*packs*).
      * Fitur untuk men-download data QR code dalam format CSV untuk dicetak.

-----

## 🛠️ Teknologi yang Digunakan

  * **Framework**: **Next.js** (App Router)
  * **Bahasa**: **TypeScript**
  * **Styling**: **Tailwind CSS**
  * **UI Components**: **Headless UI** & **Heroicons**
  * **Backend & Database**: **Supabase** (PostgreSQL, Authentication, Storage)
  * **Fitur Utama Next.js**:
      * **Server Components & Client Components** untuk optimasi performa.
      * **Server Actions** untuk interaksi *database* yang aman dari sisi server.
      * **Route Handlers** (`app/api`) untuk fungsionalitas backend kustom.
      * **Middleware** untuk proteksi rute.
  * **Manajemen Notifikasi**: **React Hot Toast**
  * **Manipulasi Excel/CSV**: **xlsx** (SheetJS)

## Pengiriman Benih Pengganti

Sebelum menjalankan versi aplikasi yang memakai fitur ini, jalankan
[`20261028_add_replacement_shipment.sql`](supabase/migrations/20261028_add_replacement_shipment.sql)
melalui SQL Editor Supabase atau koneksi PostgreSQL untuk proyek yang sama dengan
`NEXT_PUBLIC_SUPABASE_URL`. Migrasi ini dapat dijalankan ulang dan tidak mengisi
status pengiriman pada data lama.

Pada detail komplain, bagian pengiriman berada di bawah **Tgl Selesai** dan tetap
bisa diperbarui setelah komplain selesai. Superadmin atau petugas aktif dengan
hak **Update Status** dapat memilih **Sudah**, **Belum**, atau
**Tidak Ada Penggantian Benih**. Tanggal wajib untuk **Sudah** dan dikosongkan
untuk dua pilihan lainnya. Tampilan tanggal dan export menggunakan DD/MM/YYYY.
Setiap perubahan disimpan bersama catatan internal dalam satu transaksi.

Status dan tanggal masuk ke `Rekap_Complaint` serta sheet **Info Keluhan** pada
report Excel individual. Data lama ditampilkan sebagai **Belum diisi**.

Pengujian API, validasi, hak akses, dan export Excel:

```sh
node --test tests/replacement-shipment.test.cjs
npx tsc --noEmit --incremental false
npm run build
```
