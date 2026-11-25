# HaloTani (Agritech Assistant)

Aplikasi konsultasi keluhan petani dengan bantuan AI. Proyek kelas 2-A, Politeknik Negeri Madiun.

Proyek ini sudah dipisah menjadi dua bagian yang berkomunikasi lewat REST API:

```
HaloTani/
├── backend/    Laravel (REST API, auth token Sanctum, database, panggilan AI)
├── frontend/   React + Vite + Tailwind (seluruh tampilan)
└── docs/       File tugas (PDF) dan README lama versi Filament
```

## Menjalankan

Butuh dua terminal, backend dan frontend jalan bersamaan.

### 1. Backend (http://127.0.0.1:8000)

```
cd backend
composer require laravel/sanctum
copy .env.example .env        (Linux/Mac: cp .env.example .env)
php artisan key:generate
```

Buat database kosong `halotani_db` (phpMyAdmin), isi `CEREBRAS_API_KEY` di `.env`, lalu:

```
php artisan migrate:fresh --seed
php artisan serve
```

`composer.lock` lama sengaja dihapus karena berisi Filament. `composer require` di atas akan membuat yang baru.

### 2. Frontend (http://localhost:5173)

```
cd frontend
npm install
copy .env.example .env
npm run dev
```

`VITE_API_URL` di `frontend/.env` harus menunjuk ke backend (default `http://127.0.0.1:8000/api`).
`FRONTEND_URL` di `backend/.env` harus sama dengan alamat frontend. Nilai ini dipakai untuk CORS dan untuk tautan reset kata sandi.

### Akun uji coba

| Peran | Email | Kata sandi |
|---|---|---|
| Petani | budi@agritech.test | password123 |
| Admin | admin@agritech.test | password123 |

## Daftar endpoint

Semua di bawah `/api`. Yang bertanda 🔒 butuh header `Authorization: Bearer <token>`.
Error validasi berbentuk Laravel standar: `{"message": "...", "errors": {"field": ["pesan"]}}` (status 422).

| Method | Path | Isi permintaan | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | `nama, email, password, password_confirmation, kontak?, alamat?` | Mengembalikan `{token, petani}` |
| POST | `/auth/login` | `email, password` | Mengembalikan `{token, petani}` |
| POST | `/auth/forgot-password` | `email` | Kirim tautan reset (ke `storage/logs/laravel.log` selama `MAIL_MAILER=log`) |
| POST | `/auth/reset-password` | `token, email, password, password_confirmation` | |
| POST | `/auth/logout` 🔒 | | Mencabut token yang dipakai |
| GET | `/auth/me` 🔒 | | Data petani yang login |
| PUT | `/profil` 🔒 | `nama, email, kontak?, alamat?, password?, password_confirmation?, current_password?` | |
| GET | `/dashboard` 🔒 | | `{stats: {total, selesai, proses}, terbaru: {data: [...]}}` |
| GET | `/keluhan?status=semua\|selesai\|proses` 🔒 | | Keluhan milik petani yang login |
| POST | `/keluhan` 🔒 | `jenis_tanaman, lokasi_lahan, tingkat_urgensi (Rendah/Sedang/Tinggi), deskripsi` | Memanggil AI, bisa memakan waktu sampai ~40 detik |
| GET | `/keluhan/{id}` 🔒 | | |

Minimal kata `deskripsi`: Rendah 15, Sedang 25, Tinggi 50 (aturan lama, kini dicek di backend dan frontend).

## Yang berubah dibanding versi Filament

- Filament, Livewire, dan semua view Blade dihapus. Tampilan pindah ke `frontend/`.
- Login memakai token Bearer (Sanctum), disimpan di `localStorage` selama 7 hari. Tabel `personal_access_tokens` dibuat oleh migrasi `2026_10_22_000000_...` yang sudah disesuaikan dengan id petani bertipe UUID.
- Statistik Beranda kini hanya menghitung keluhan milik petani yang login. Sebelumnya widget menghitung keluhan semua petani.
- Id petani cadangan yang di-hardcode (`01a11165-...`) untuk pengguna yang belum login dihapus. Semua endpoint keluhan wajib login.
- Struktur database, seeder, dan `KiraAIService` tidak diubah (kecuali `env()` diganti `config()` agar jalan setelah `config:cache`).

## Catatan yang masih perlu diperhatikan

- Jika semua model AI gagal, `KiraAIService` mengembalikan teks pesan error, dan teks itu tetap tersimpan sebagai `hasil_analisis` dengan status `selesai`. Perilaku ini sudah ada sejak versi lama dan belum saya ubah.
- Kolom `jenis_tanaman` belum ada di tabel `keluhan`. Semua isian disimpan dalam satu kolom `teks_keluhan`, lalu dipecah lagi oleh `KeluhanResource`. Kalau mau lebih rapi, buat migrasi baru untuk menambah kolom `jenis_tanaman` dan `lokasi_lahan`.
- Panel admin belum ada (seperti sebelumnya). Akun admin dapat login tetapi tampilannya sama dengan petani.
