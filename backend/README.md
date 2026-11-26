# Dokumentasi REST API Backend HaloTani

Dokumen ini ditujukan untuk memudahkan integrasi **Frontend** dengan seluruh endpoint **Backend Laravel HaloTani** (baik untuk role **Petani** maupun **Admin**).

---

## 1. Persiapan & Menjalankan Server Backend

```bash
cd backend
composer install
cp .env.example .env          # Windows CMD: copy .env.example .env
php artisan key:generate
```

Pastikan MySQL (XAMPP/Laragon) aktif dan database `halotani_db` sudah dibuat. Sesuaikan `backend/.env`:

```env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=halotani_db
DB_USERNAME=root
DB_PASSWORD=

CEREBRAS_API_KEY=isi_api_key_cerebras
CEREBRAS_MODEL=gpt-oss-120b
```

Jalankan migrasi, seeder, dan server lokal:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

### Akun Uji Coba Bawaan (`PetaniSeeder`)

| Role | Email | Password | Nilai `petani.role` |
|---|---|---|---|
| Petani | `budi@agritech.test` | `password123` | `"petani"` |
| Admin | `admin@agritech.test` | `password123` | `"admin"` |

---

## 2. Aturan Umum Pemanggilan API untuk Frontend

- **Base URL:** `http://127.0.0.1:8000/api`
- **Header Wajib:**
  ```http
  Accept: application/json
  Content-Type: application/json
  ```
- **Header Autentikasi (untuk semua endpoint non-publik):**
  ```http
  Authorization: Bearer <token>
  ```
- **Cara Menentukan Role di Frontend:**
  Saat `POST /api/auth/login` atau `GET /api/auth/me`, objek pengguna memiliki field `role` bernilai `"petani"` atau `"admin"`. Gunakan `user.role === "admin"` untuk mengarahkan pengguna ke halaman/sidebar Admin.
- **Kode Status Standar:**
  - `200` / `201`: Berhasil.
  - `401`: Token tidak ada, kedaluwarsa, atau sudah dicabut (arahkan kembali ke halaman login).
  - `403`: Akun bukan Admin mencoba mengakses `/api/admin/*` (`{"message": "Akses ditolak. Fitur ini khusus akun Admin."}`).
  - `404`: Data dengan ID terkait tidak ditemukan.
  - `422`: Validasi gagal (`{"message": "...", "errors": {"nama_field": ["Pesan error..."]}}`).

---

## 3. Endpoint Publik & Role Petani

| Method | Endpoint | Auth | Body / Query | Keterangan |
|---|---|---|---|---|
| `POST` | `/auth/register` | Publik | `nama, email, password, password_confirmation, kontak?, alamat?` | Registrasi akun petani baru, mengembalikan `{ token, petani }` |
| `POST` | `/auth/login` | Publik | `email, password` | Login (maks 10x/menit), mengembalikan `{ token, petani }` |
| `POST` | `/auth/forgot-password` | Publik | `email` | Menulis tautan reset ke `storage/logs/laravel.log` bila `MAIL_MAILER=log` |
| `POST` | `/auth/reset-password` | Publik | `token, email, password, password_confirmation` | Mengatur ulang kata sandi & mencabut semua sesi lama |
| `POST` | `/auth/logout` | Bearer | - | Mencabut token yang sedang dipakai |
| `GET` | `/auth/me` | Bearer | - | Mengembalikan `{ data: { id, nama, email, kontak, alamat, role } }` |
| `PUT` | `/profil` | Bearer | `nama, email, kontak?, alamat?, password?, password_confirmation?, current_password?` | Memperbarui profil akun yang login (`{ data: ... }`) |
| `GET` | `/dashboard` | Bearer | - | Statistik pribadi & 5 keluhan terbaru milik petani |
| `GET` | `/keluhan` | Bearer | `?status=semua\|selesai\|proses` | Daftar keluhan milik petani yang login (`{ data: [...] }`) |
| `POST` | `/keluhan` | Bearer | `jenis_tanaman, lokasi_lahan, tingkat_urgensi, deskripsi` | Menyimpan keluhan & memanggil AI menggunakan template prompt aktif |
| `GET` | `/keluhan/{id}` | Bearer | - | Detail satu keluhan milik petani (`{ data: {...} }`) |

> **Catatan penting untuk Frontend pada `GET /api/dashboard`:**
> Field `terbaru` dikembalikan langsung berupa array (`response.terbaru` berbentuk `[...]`, bukan `response.terbaru.data`).
>
> **Aturan minimal kata `deskripsi` pada `POST /api/keluhan`:**
> - `Rendah`: minimal 15 kata
> - `Sedang`: minimal 25 kata
> - `Tinggi`: minimal 50 kata

---

## 4. Endpoint Khusus Role Admin (`/api/admin/*`)

Seluruh endpoint di bawah ini wajib menyertakan `Authorization: Bearer <token>` milik akun dengan `role = "admin"`.

---

### A. Menu 1: Beranda Admin & Pantauan Keluhan

#### 1. Ambil Data Dashboard Admin
- **Endpoint:** `GET /api/admin/dashboard`
- **Query Opsional:**
  - `urgensi`: `semua` (default) | `Rendah` | `Sedang` | `Tinggi`
  - `search`: kata kunci pencarian (mencocokkan nama petani, email, tanaman, lokasi, atau isi keluhan)
- **Contoh Pemanggilan:** `GET /api/admin/dashboard?urgensi=Tinggi&search=padi`
- **Contoh Response (`200 OK`):**
  ```json
  {
    "stats": {
      "total_petani": 12,
      "total_akun": 13,
      "total_keluhan": 28,
      "keluhan_selesai": 27,
      "keluhan_proses": 1,
      "urgensi_tinggi": 5,
      "keluhan_bulan_ini": 9,
      "komoditas_bulan_ini": {
        "nama": "Padi",
        "jumlah": 4
      }
    },
    "tren_tanaman": [
      { "nama": "Padi", "jumlah": 11 },
      { "nama": "Cabai", "jumlah": 8 },
      { "nama": "Jagung", "jumlah": 5 }
    ],
    "sebaran_urgensi": [
      { "tingkat": "Tinggi", "jumlah": 5 },
      { "tingkat": "Sedang", "jumlah": 14 },
      { "tingkat": "Rendah", "jumlah": 9 }
    ],
    "keluhan": [
      {
        "id": "9d4e2a10-1234-4b5c-89ab-0123456789ab",
        "jenis_tanaman": "Padi",
        "lokasi_lahan": "Jiwan, Madiun",
        "tingkat_urgensi": "Tinggi",
        "deskripsi": "Daun menguning dari ujung...",
        "teks_keluhan": "Jenis Tanaman: Padi\nLokasi: Jiwan, Madiun\nUrgensi: Tinggi\nKeluhan: Daun menguning dari ujung...",
        "hasil_analisis": "- Periksa drainase sawah...",
        "status": "selesai",
        "tanggal": "2026-11-26T08:30:00+00:00",
        "petani": {
          "id": "8a1b2c3d-0000-4000-8000-111122223333",
          "nama": "Budi Santoso",
          "email": "budi@agritech.test"
        }
      }
    ]
  }
  ```
  *(Catatan: Jika bulan berjalan belum ada keluhan, `komoditas_bulan_ini` bernilai `null`).*

#### 2. Hapus Keluhan (Spam / Data Tes)
- **Endpoint:** `DELETE /api/admin/keluhan/{id}`
- **Contoh Response (`200 OK`):**
  ```json
  {
    "message": "Data keluhan berhasil dihapus."
  }
  ```

---

### B. Menu 2: Kelola Akun Pengguna

#### 1. Daftar Semua Akun
- **Endpoint:** `GET /api/admin/pengguna`
- **Query Opsional:** `?search=kata_kunci` (mencari nama, email, atau alamat)
- **Contoh Response (`200 OK`):**
  ```json
  {
    "summary": {
      "total": 2,
      "petani": 1,
      "admin": 1
    },
    "data": [
      {
        "id": "8a1b2c3d-0000-4000-8000-111122223333",
        "nama": "Budi Santoso",
        "email": "budi@agritech.test",
        "role": "petani",
        "kontak": "081234567890",
        "alamat": "Desa Sukamaju, Madiun",
        "keluhan_count": 3,
        "created_at": "2026-11-26T02:00:00+00:00"
      }
    ]
  }
  ```

#### 2. Hapus Akun Pengguna
- **Endpoint:** `DELETE /api/admin/pengguna/{id}`
- **Perilaku:** Menghapus akun, seluruh token login-nya, serta riwayat keluhannya. Jika `id` sama dengan ID Admin yang sedang login, server menolak dengan status `422`.
- **Contoh Response Sukses (`200 OK`):**
  ```json
  {
    "message": "Akun Budi Santoso berhasil dihapus."
  }
  ```
- **Contoh Response Gagal Hapus Diri Sendiri (`422 Unprocessable Entity`):**
  ```json
  {
    "message": "Anda tidak dapat menghapus akun yang sedang digunakan."
  }
  ```

---

### C. Menu 3: Pengaturan Template Prompt AI

Variabel dinamis yang didukung di dalam teks template:
- `{jenis_tanaman}`
- `{lokasi}`
- `{urgensi}`
- `{keluhan}` *(wajib ada di dalam template saat disimpan)*

#### 1. Ambil Template Prompt Aktif
- **Endpoint:** `GET /api/admin/template-prompt`
- **Contoh Response (`200 OK`):**
  ```json
  {
    "data": {
      "id": "1f2e3d4c-5678-4999-8888-abcdef012345",
      "isi_template": "Kamu adalah penyuluh pertanian yang membantu petani.\nJenis tanaman: {jenis_tanaman}\nLokasi: {lokasi}\nTingkat urgensi: {urgensi}\nKeluhan petani: {keluhan}\n\nBerikan analisis penyebab masalah dan rekomendasi penanganan dengan bahasa sederhana yang mudah dipahami petani.",
      "default_template": "Kamu adalah penyuluh pertanian 'Agritech Assistant'...",
      "updated_at": "2026-11-26T02:02:55+00:00",
      "diubah_oleh": "Admin Agritech",
      "placeholders": ["{jenis_tanaman}", "{lokasi}", "{urgensi}", "{keluhan}"]
    }
  }
  ```
  *(Tips Frontend: Gunakan `default_template` untuk tombol "Kembalikan ke Bawaan" di form editor).*

#### 2. Simpan Perubahan Template Prompt
- **Endpoint:** `PUT /api/admin/template-prompt`
- **Request Body:**
  ```json
  {
    "isi_template": "Kamu adalah penyuluh HaloTani.\nTanaman: {jenis_tanaman}\nLokasi: {lokasi}\nUrgensi: {urgensi}\nKeluhan: {keluhan}\nBerikan langkah penanganan singkat."
  }
  ```
- **Validasi:** Minimal 20 karakter, maksimal 5000 karakter, dan wajib mengandung teks `{keluhan}`.
- **Contoh Response (`200 OK`):**
  ```json
  {
    "message": "Template prompt AI berhasil disimpan.",
    "data": {
      "id": "1f2e3d4c-5678-4999-8888-abcdef012345",
      "isi_template": "...",
      "default_template": "...",
      "updated_at": "2026-11-26T09:15:00+00:00",
      "diubah_oleh": "Admin Agritech",
      "placeholders": ["{jenis_tanaman}", "{lokasi}", "{urgensi}", "{keluhan}"]
    }
  }
  ```

#### 3. Uji Coba Kirim Prompt ke AI (Tanpa Masuk Tabel `keluhan`)
- **Endpoint:** `POST /api/admin/template-prompt/test`
- **Request Body:**
  ```json
  {
    "jenis_tanaman": "Padi",
    "lokasi_lahan": "Jiwan, Madiun",
    "tingkat_urgensi": "Sedang",
    "deskripsi": "Ujung daun padi menguning dan mengering setelah hujan deras.",
    "isi_template": "Opsional: kirim isi textarea yang sedang diedit sebelum disimpan"
  }
  ```
- **Contoh Response (`200 OK`):**
  ```json
  {
    "data": {
      "prompt_terkirim": "Kamu adalah penyuluh pertanian...\nJenis tanaman: Padi...",
      "hasil_analisis": "- Kemungkinan gejala hawar daun bakteri...\n- Atur kembali drainase petakan sawah..."
    }
  }
  ```

---

### D. Menu 4: Rekap Laporan Bulanan

#### 1. Daftar Semua Laporan Bulanan
- **Endpoint:** `GET /api/admin/laporan`
- **Contoh Response (`200 OK`):**
  ```json
  {
    "data": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "bulan": "November",
        "tahun": "2026",
        "ringkasan": {
          "bulan_angka": 11,
          "total_keluhan": 9,
          "keluhan_selesai": 9,
          "keluhan_proses": 0,
          "petani_aktif": 4,
          "urgensi": {
            "Tinggi": 2,
            "Sedang": 5,
            "Rendah": 2
          },
          "tanaman_terbanyak": [
            { "nama": "Padi", "jumlah": 5 },
            { "nama": "Cabai", "jumlah": 4 }
          ],
          "lokasi_terbanyak": [
            { "nama": "Jiwan, Madiun", "jumlah": 5 }
          ],
          "catatan": "Curah hujan tinggi memicu kelembapan berlebih.",
          "dibuat_oleh": "Admin Agritech",
          "digenerate_pada": "2026-11-26T09:20:00+00:00"
        },
        "isi_teks": null,
        "created_at": "2026-11-26T09:20:00+00:00"
      }
    ]
  }
  ```

#### 2. Buat / Perbarui Rekap Laporan Bulanan
- **Endpoint:** `POST /api/admin/laporan`
- **Request Body:**
  ```json
  {
    "bulan": 11,
    "tahun": 2026,
    "catatan": "Opsional: catatan evaluasi admin untuk periode ini"
  }
  ```
  *(Catatan: `bulan` dikirim berupa angka `1` sampai `12`. Jika rekap untuk bulan & tahun tersebut sudah pernah dibuat, backend otomatis memperbarui isinya dan mengembalikan status `200`; jika baru pertama kali, status `201`).*
- **Contoh Response (`201 Created` / `200 OK`):**
  ```json
  {
    "message": "Rekap laporan November 2026 berhasil dibuat.",
    "data": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "bulan": "November",
      "tahun": "2026",
      "ringkasan": { "...sama seperti struktur GET /api/admin/laporan..." },
      "isi_teks": null,
      "created_at": "2026-11-26T09:20:00+00:00"
    }
  }
  ```

#### 3. Hapus Laporan Bulanan
- **Endpoint:** `DELETE /api/admin/laporan/{id}`
- **Contoh Response (`200 OK`):**
  ```json
  {
    "message": "Laporan periode November 2026 berhasil dihapus."
  }
  ```

---

## 5. Struktur File Baru di Backend

- `app/Http/Middleware/EnsureAdmin.php`: Middleware alias `admin` untuk validasi `role === 'admin'`.
- `app/Http/Controllers/Api/Admin/AdminDashboardController.php`: Endpoint statistik, tren tanaman/urgensi, pantauan & hapus keluhan.
- `app/Http/Controllers/Api/Admin/AdminPetaniController.php`: Endpoint daftar & hapus akun pengguna.
- `app/Http/Controllers/Api/Admin/AdminPromptController.php`: Endpoint baca, simpan, & uji template prompt AI.
- `app/Http/Controllers/Api/Admin/AdminLaporanController.php`: Endpoint rekap laporan bulanan.
- `app/Services/KiraAIService.php`: Layanan AI yang kini membaca template aktif dari tabel `template_prompt`.
- `tests/Feature/AdminPanelApiTest.php`: Suite pengujian otomatis fitur Admin.

## 6. Menjalankan Automated Test Backend

Aman dijalankan kapan saja karena menggunakan SQLite `:memory:` (tidak menyentuh isi database MySQL `halotani_db`):

```bash
cd backend
./vendor/bin/phpunit
```
