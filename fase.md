# Milestone 7 — Backend Integration: Evaluasi & Perancangan

**Status:** Draft  
**Peran:** Senior AI Engineer

---

## Step 1 — Recall Knowledge dari Empat Repositori

### Facial Beauty Prediction

- **Pelajaran penting:** Model bekerja pada gambar yang sudah diproses sepenuhnya, bukan pada stream. Seluruh pipeline inferensi bergantung pada input gambar yang sudah bersih dan konsisten.
- **Pipeline:** Preprocess gambar → forward ke backbone CNN → ambil distribusi skor.
- **Preprocessing:** Gambar di-resize, dinormalisasi (meskipun ada inkonsistensi di kode). Kualitas input sangat mempengaruhi output.
- **Deployment/inference:** Model PyTorch disimpan dan dimuat ulang. Inferensi dilakukan pada gambar tunggal.
- **Layak diadopsi:** Pemisahan tegas antara capture dan analisis. Gambar statis adalah unit kerja backend.
- **Hindari:** Inkonsistensi preprocessing antara training dan inference. Tidak ada normalisasi standar.

### face-rating

- **Feature engineering:** Geometri wajah (rasio landmark) adalah fitur kuat tetapi harus dihitung dari gambar yang sudah di-crop dan di-align.
- **Workflow:** Landmark diekstrak dari gambar diam, bukan dari video.
- **Pelajaran:** Backend harus menerima gambar yang sudah siap, tetapi preprocessing berat (alignment, crop) sebaiknya dilakukan di backend agar konsisten.

### MEBeauty

- **Pipeline:** Deteksi wajah → crop & alignment (di backend) → resize → normalisasi → model regresi.
- **Backend flow:** Gambar mentah diunggah → preprocessing → inferensi → hasil dikembalikan.
- **Penting:** Preprocessing yang konsisten dan terpisah dari frontend sangat krusial.
- **Deployment:** Model PyTorch di backend, API menerima gambar.

### DeepFace

- **Pipeline:**  
  Detect  
  ↓  
  Align  
  ↓  
  Normalize  
  ↓  
  Represent  
  ↓  
  Verify / Analyze
- **Kenapa sangat baik:** Setiap tahap berdiri sendiri, mudah diuji, dan bisa diganti tanpa merusak yang lain. Pipeline ini menjadi cetak biru backend FaceAI.

---

## Step 2 — Ingat Tujuan FaceAI

Frontend hanya bertugas menangkap foto terbaik. Backend melakukan **seluruh** analisis AI. Tidak ada inferensi real‑time di browser. Milestone 7 adalah jembatan antara keduanya: **mengirim foto dari frontend ke backend dengan aman dan andal**.

---

## Step 3 — Evaluasi Milestone 7

Deliverable yang diusulkan (Upload API, Multipart Upload, Progress Indicator, Error Handling, Response Handling) sudah mencakup kebutuhan dasar komunikasi frontend‑backend. Namun, berdasarkan praktik terbaik dari keempat repositori, saya menambahkan:

- **Validasi ukuran dan format gambar** di sisi server agar tidak menerima file sembarangan.
- **Response standar** (JSON) yang konsisten, mencakup status, ID gambar, dan error message.
- **Logging** dasar di backend untuk memudahkan debugging.
- **Konfigurasi endpoint** yang terpusat di frontend (`config.js`) dan backend (environment variable).

Tidak ada yang perlu dihapus. Urutan stage juga sudah logis: mulai dari API sederhana, lalu integrasi frontend, baru feedback pengguna.

---

## Step 4 — Pemecahan Menjadi Stage

### Stage 7.1 — Backend Upload Endpoint

**Objective:**  
Membuat endpoint FastAPI yang menerima file gambar (multipart/form-data), memvalidasi, menyimpan sementara di folder `backend/uploads/`.

**Deliverables:**

- Endpoint `POST /api/upload`
- Validasi ekstensi (jpg, png) dan ukuran maksimal (5 MB).
- Simpan file dengan nama unik (UUID) di `backend/uploads/`.
- Response JSON: `{ "status": "ok", "filename": "...", "message": "..." }` atau `{ "status": "error", "message": "..." }`.
- Menambahkan `python-multipart` ke `requirements.txt`.

**Files yang berubah:**

- `backend/app/main.py` – tambah router upload
- `backend/app/api/upload.py` – file baru
- `backend/requirements.txt`
- `backend/uploads/` – folder baru (di-gitignore)

**Output:**  
Kirim file via Postman/curl ke `http://localhost:8000/api/upload` → file tersimpan di `uploads/` dan response JSON sukses.

**Testing:**

- Upload file jpg/png → sukses.
- Upload file txt atau tanpa file → error 400.
- File > 5 MB → error 413.

**Dependency:** Tidak ada (backend mandiri).

---

### Stage 7.2 — Frontend Upload Service

**Objective:**  
Membuat service `upload.js` di frontend yang mengirimkan canvas hasil capture ke backend menggunakan `fetch` dengan `FormData`.

**Deliverables:**

- Fungsi `FaceAI.upload.send(canvas)` yang:
  - Mengonversi canvas ke Blob (JPEG, kualitas 0.9).
  - Membuat `FormData` dan mengirim via `POST` ke URL di `config.BACKEND_UPLOAD_URL`.
  - Mengembalikan Promise dengan response JSON.
- Tambahan konfigurasi di `config.js`: `BACKEND_UPLOAD_URL: 'http://localhost:8000/api/upload'`.
- Menghubungkan tombol "Continue" di `capture.js` untuk memanggil `FaceAI.upload.send()`.
- Basic error handling: jika jaringan gagal, tampilkan pesan error.

**Files yang berubah:**

- `frontend/js/modules/upload.js` – file baru
- `frontend/js/core/config.js`
- `frontend/js/modules/capture.js` – modifikasi handler "Continue"
- `frontend/index.html` – tambahkan script `upload.js`

**Output:**  
Klik "Continue" setelah capture → console log response dari backend `{ status: "ok", filename: "..." }`. Gambar tersimpan di backend.

**Testing:**

- Capture, klik Continue → cek console untuk response sukses.
- Matikan backend → klik Continue → muncul pesan error.

**Dependency:** Stage 7.1 harus selesai (backend endpoint sudah berfungsi).

---

### Stage 7.3 — Upload Progress & Feedback

**Objective:**  
Menampilkan indikator progres upload (spinner/teks "Uploading…") dan mengunci tombol "Continue" selama proses upload agar tidak double‑submit.

**Deliverables:**

- Di `capture.js`, saat upload dimulai:
  - Tampilkan teks "Uploading…" di tombol Continue dan disable.
  - Jika sukses, tampilkan "Upload Successful!" sebentar, lalu set state `RESULT_READY` (atau tetap `CAPTURED` untuk sekarang).
  - Jika gagal, tampilkan pesan error dan enable kembali tombol.
- Modifikasi `ui.js` untuk mendukung perubahan teks tombol dan disable.

**Files yang berubah:**

- `frontend/js/modules/capture.js`
- `frontend/js/ui/ui.js`

**Output:**  
Setelah klik Continue, tombol berubah menjadi "Uploading…" (disabled), lalu berubah menjadi "Upload Successful!" (atau "Upload Failed, Retry") sesuai hasil.

**Testing:**

- Upload normal → tombol berubah sesuai tahapan.
- Matikan koneksi saat upload → tombol kembali enable dan pesan error muncul.
- Klik ganda tombol → hanya satu upload yang terkirim (karena disabled).

**Dependency:** Stage 7.2 (upload service) harus selesai.

---

### Stage 7.4 — Error Handling & Retry

**Objective:**  
Menangani kegagalan upload dengan pesan yang jelas dan memberikan opsi untuk mencoba ulang (Retry) tanpa harus mengulang capture.

**Deliverables:**

- Modifikasi handler "Continue": jika upload gagal, tombol kembali aktif dengan teks "Retry Upload".
- Error dibedakan: jaringan (fetch error), server error (5xx), validasi (4xx), timeout.
- Pesan error ditampilkan di area error umum (`FaceAI.ui.showError`).
- Retry hanya mengirim ulang Blob yang sama (tanpa capture ulang).

**Files yang berubah:**

- `frontend/js/modules/capture.js`
- `frontend/js/modules/upload.js` – tambah timeout & error classification

**Output:**  
Skenario gagal → pesan jelas, tombol "Retry Upload", bisa mencoba kembali hingga berhasil atau memilih "Retake".

**Testing:**

- Simulasikan server mati → klik Continue → pesan error muncul, tombol "Retry Upload".
- Hidupkan server → klik "Retry" → upload berhasil.

**Dependency:** Stage 7.3 (progress & feedback) harus selesai.

---

### Stage 7.5 — Backend Logging & Configuration

**Objective:**  
Menyempurnakan backend dengan logging, batasan ukuran file, dan konfigurasi yang rapi.

**Deliverables:**

- Logging dengan `logging` module: setiap upload dicatat (nama file, ukuran, timestamp).
- Konfigurasi batasan ukuran file di `.env` (contoh: `MAX_UPLOAD_SIZE_MB=5`).
- Struktur response standar menggunakan Pydantic model.
- Menambahkan handler untuk `RequestValidationError` agar mengembalikan JSON yang jelas.

**Files yang berubah:**

- `backend/app/api/upload.py`
- `backend/app/core/config.py` (atau file `.env` dan pembacaan dengan Pydantic)
- `backend/app/main.py` – tambah exception handler
- `backend/requirements.txt` – tambah `python-dotenv` (jika belum)

**Output:**  
Di console backend, setiap upload tercatat. Response error menjadi lebih informatif.

**Testing:**

- Upload file, cek log backend.
- Kirim file terlalu besar, dapatkan response JSON dengan pesan jelas.

**Dependency:** Stage 7.1 (backend endpoint dasar).

---

## Step 5 — Dependency Check

- **Stage 7.1** adalah fondasi; semua stage lain bergantung padanya.
- **Stage 7.2** membutuhkan 7.1.
- **Stage 7.3** membutuhkan 7.2.
- **Stage 7.4** membutuhkan 7.3.
- **Stage 7.5** bisa dikerjakan kapan saja setelah 7.1, tetapi idealnya setelah 7.4 untuk menyempurnakan backend berdasarkan pengalaman integrasi.

Urutan pengerjaan disarankan: 7.1 → 7.2 → 7.3 → 7.4 → 7.5.

---

## Step 6 — Engineering Review

- Apakah stage terlalu besar? Tidak, setiap stage hanya menambah satu kemampuan (API, integrasi frontend, feedback, error handling, logging).
- Over‑engineering? Tidak ada; semua dibutuhkan untuk fondasi yang kokoh menuju milestone berikutnya (preprocessing, AI analysis).
- Apakah frontend tetap ringan? Ya, hanya menambah modul upload sederhana.
- Apakah backend menjadi pusat AI? Ya, mulai dari menerima gambar hingga nanti preprocessing dan inferensi.
- Apakah struktur mudah dikembangkan hingga v1.0? Sangat; pipeline backend sudah mengikuti pola DeepFace (detect → align → …), hanya saja dimulai dari menerima gambar.
- Pelajaran dari repositori: Semua repositori menekankan konsistensi preprocessing; dengan backend yang menerima gambar utuh, kita bisa memastikan preprocessing berjalan seragam.

**Kesimpulan:** Milestone 7 dirancang dengan baik. Stage‑stage di atas akan membangun integrasi frontend‑backend yang andal, modular, dan siap menopang seluruh pipeline AI FaceAI.
