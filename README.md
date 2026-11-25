# HaloTani (Agritech Assistant)

Aplikasi konsultasi keluhan petani berbasis web yang membantu petani mengirimkan keluhan tanaman dan mendapatkan rekomendasi solusi secara otomatis menggunakan AI.

Proyek ini menggunakan arsitektur terpisah antara **Backend (REST API)** dan **Frontend (SPA)**:

```text
HaloTani/
├── backend/    # Laravel REST API, autentikasi Sanctum, database, & integrasi AI
├── frontend/   # React + Vite + Tailwind CSS (antarmuka pengguna)
└── docs/       # Dokumentasi proyek
```

---

## Teknologi yang Digunakan

### Backend (`backend/`)
- **PHP** `^8.3` & **Laravel** `^13.17`
- **Laravel Sanctum** (autentikasi API berbasis Bearer Token)
- **MySQL** (database utama, default: `halotani_db`)
- **Cerebras API** (`KiraAIService` menggunakan model `gpt-oss-120b` dan fallback `qwen-3.8-27b`)

### Frontend (`frontend/`)
- **React** `^19.0.0` & **Vite** `^7.0.0`
- **Tailwind CSS** `^4.0.0`
- **React Router DOM** `^7.0.0`
- **React Markdown** `^10.0.0`

---

## Prasyarat

Pastikan perangkat Anda sudah terpasang:
- PHP >= 8.3 & Composer
- Node.js & npm
- MySQL / MariaDB (misalnya via Laragon atau XAMPP)
- API Key dari [Cerebras](https://cloud.cerebras.ai/) untuk fitur analisis AI

---

## Cara Menjalankan

Jalankan **Backend** dan **Frontend** pada dua terminal yang berbeda secara bersamaan.

### 1. Backend (`http://127.0.0.1:8000`)

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Install dependensi PHP (pastikan `laravel/sanctum` terpasang):
   ```bash
   composer install
   composer require laravel/sanctum
   ```
3. Salin file environment dan buat application key:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
   *(Di Windows CMD gunakan `copy .env.example .env`)*

4. Buat database MySQL kosong bernama `halotani_db`, lalu sesuaikan konfigurasi di `backend/.env`:
   ```env
   APP_URL=http://127.0.0.1:8000
   FRONTEND_URL=http://localhost:5173

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=halotani_db
   DB_USERNAME=root
   DB_PASSWORD=

   CEREBRAS_API_KEY=isi_api_key_cerebras_anda
   CEREBRAS_MODEL=gpt-oss-120b
   ```

5. Jalankan migrasi dan seeder database, lalu nyalakan server:
   ```bash
   php artisan migrate:fresh --seed
   php artisan serve
   ```

### 2. Frontend (`http://localhost:5173`)

1. Masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependensi Node.js:
   ```bash
   npm install
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
   Pastikan `VITE_API_URL` di `frontend/.env` mengarah ke backend dengan akhiran `/api`:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Jalankan server development:
   ```bash
   npm run dev
   ```

---

## Akun Uji Coba (Seeder)

Setelah menjalankan `php artisan migrate:fresh --seed`, tersedia akun bawaan dari `PetaniSeeder`:

| Peran  | Email                 | Kata Sandi    |
| ------ | --------------------- | ------------- |
| Petani | `budi@agritech.test`  | `password123` |
| Admin  | `admin@agritech.test` | `password123` |

---

## Daftar Endpoint API

Semua endpoint berada di bawah prefix `/api`. Endpoint bertanda 🔒 membutuhkan header:
```http
Authorization: Bearer <token>
```

### Autentikasi & Profil
| Method | Endpoint                | Auth | Parameter / Body                                                               | Keterangan                                      |
| ------ | ----------------------- | ---- | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| `POST` | `/auth/register`        | -    | `nama`, `email`, `password`, `password_confirmation`, `kontak?`, `alamat?`     | Registrasi petani baru, return `{token, petani}`|
| `POST` | `/auth/login`           | -    | `email`, `password`                                                            | Login (rate limit 10/menit), return `{token, petani}` |
| `POST` | `/auth/forgot-password` | -    | `email`                                                                        | Kirim tautan reset password (rate limit 5/menit)|
| `POST` | `/auth/reset-password`  | -    | `token`, `email`, `password`, `password_confirmation`                          | Reset password (rate limit 5/menit)             |
| `POST` | `/auth/logout`          | 🔒   | -                                                                              | Mencabut token yang sedang aktif                |
| `GET`  | `/auth/me`              | 🔒   | -                                                                              | Mengambil data petani yang sedang login         |
| `PUT`  | `/profil`               | 🔒   | `nama`, `email`, `kontak?`, `alamat?`, `password?`, `password_confirmation?`, `current_password?` | Memperbarui profil petani |

### Dashboard & Keluhan
| Method | Endpoint       | Auth | Parameter / Body                                                                 | Keterangan                                                  |
| ------ | -------------- | ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET`  | `/dashboard`   | 🔒   | -                                                                                | Statistik `{total, selesai, proses}` & keluhan terbaru      |
| `GET`  | `/keluhan`     | 🔒   | Query `?status=semua\|selesai\|proses`                                           | Daftar keluhan milik petani yang login                      |
| `POST` | `/keluhan`     | 🔒   | `jenis_tanaman`, `lokasi_lahan`, `tingkat_urgensi` (`Rendah`/`Sedang`/`Tinggi`), `deskripsi` | Mengirim keluhan & memanggil `KiraAIService` untuk analisis |
| `GET`  | `/keluhan/{id}`| 🔒   | -                                                                                | Detail keluhan beserta hasil analisis AI                    |

---

## Catatan Pengujian & Pengembangan

- **CORS**: Konfigurasi `config/cors.php` membaca `FRONTEND_URL` dari `backend/.env` (mendukung lebih dari satu origin yang dipisahkan koma).
- **Reset Kata Sandi**: Selama `MAIL_MAILER=log` di `.env`, tautan reset kata sandi akan tercatat di `backend/storage/logs/laravel.log`.
- **Menjalankan Test Backend**:
  ```bash
  cd backend
  composer test
  ```
