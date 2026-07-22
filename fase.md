# Dokumen Desain Teknis Milestone 11 — History & Dataset

**Versi:** 1.0  
**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer & Software Architect

---

## Langkah 1 — Insight dari Empat Repositori yang Relevan

### Facial Beauty Prediction

- **Dataset disusun terpisah dari kode:** Gambar mentah dan file label (Excel/CSV) berada di folder terpisah. Ini memudahkan audit.
- **Hasil eksperimen dicatat:** Metrik evaluasi disimpan, bukan hanya skor akhir. Untuk FaceAI, kita perlu menyimpan seluruh laporan, bukan hanya skor overall.
- **Metadata penelitian dipisahkan:** Informasi tentang model, preprocessing, dan split data disimpan. FaceAI harus menyimpan versi model AI dan versi preprocessing yang digunakan.

### face-rating

- **Fitur geometris dapat ditelusuri:** Setiap rasio dan landmark disimpan secara eksplisit. Laporan FaceAI sudah memuat skor per region, sehingga history dapat menyimpan laporan lengkap.
- **Hasil prediksi disimpan terstruktur:** CSV dengan kolom untuk setiap fitur. FaceAI bisa menyimpan laporan JSON di database sebagai teks.

### MEBeauty

- **Konsistensi preprocessing penting:** Metadata preprocessing (model align, ukuran resize) dicatat untuk reproduksibilitas. FaceAI harus menyimpan informasi preprocessing pipeline version.
- **Embedding sebagai representasi antara:** Embedding disimpan terpisah dari gambar. Untuk FaceAI, embedding belum digunakan, tetapi desain harus memungkinkan penyimpanan embedding di masa depan jika diperlukan.
- **Struktur dataset multi-etnis:** Tidak relevan langsung, tetapi menunjukkan pentingnya menyimpan informasi identitas (jika ada) secara anonim.

### DeepFace

- **Embedding cache:** DeepFace menyimpan embedding ke file pickle untuk pencarian cepat. FaceAI dapat mengadopsi penyimpanan hasil analisis sebagai JSON di database, yang berfungsi sebagai cache.
- **Representasi hasil terstruktur:** Setiap fungsi (verify, analyze) mengembalikan dictionary. History dapat menyimpan dictionary tersebut.
- **Modularitas pipeline:** Setiap tahap berdiri sendiri. History tidak boleh mencampuradukkan preprocessing, analysis, dan report; ia hanya mencatat input dan output.

---

## Langkah 2 — Evaluasi Milestone 11

### 1. Apakah objective sudah tepat?

**Ya.** Menyimpan seluruh hasil analisa adalah kebutuhan dasar. Tanpa history, FaceAI hanyalah alat sekali pakai.

### 2. Apakah deliverables sudah lengkap?

**Hampir.** "Save Report" dan "Save Image" sudah benar. "History", "Search", "Delete", "Export" mencakup operasi CRUD. Namun ada beberapa tambahan yang perlu dipertimbangkan:

- **Metadata analisis:** timestamp, versi model, versi preprocessing, durasi analisis (opsional).
- **Thumbnail:** Tidak wajib, tetapi berguna untuk tampilan depan. Bisa ditambahkan sebagai perbaikan di M12.
- **Backup/restore:** Tidak perlu di MVP.
- **Keterkaitan dengan pengguna:** Untuk saat ini single-user, jadi tidak perlu user ID. Namun desain harus siap menambahkan kolom user_id di masa depan.

Saya rekomendasikan menambahkan **versi model/preprocessing** ke metadata agar hasil dapat direproduksi.

### 3. Apakah ada komponen penting yang hilang?

- **Versi model/preprocessing** seperti di atas.
- **Kemampuan untuk menyimpan hasil preprocessing (aligned face)?** Tidak wajib; dapat direproduksi dari gambar asli. Tapi untuk thumbnail, bisa disimpan gambar resize kecil.
- **Integrasi otomatis dengan pipeline:** Setelah laporan dihasilkan, harus otomatis tersimpan ke history tanpa intervensi pengguna.

### 4. Apakah ada bagian yang sebaiknya dipindahkan ke milestone lain?

"Search" yang kompleks (full-text search, filter berdasarkan skor) bisa ditingkatkan di M12. Untuk M11, cukup sederhana: daftar semua riwayat, filter dasar (tanggal), dan delete. "Export" bisa berupa unduh JSON laporan.

### 5. Apakah urutannya sudah benar?

Ya, setelah Report Generator (M10). Tidak ada ketergantungan dengan milestone lain.

### 6. Apakah sesuai dengan pembelajaran dari keempat repository?

**Ya.** Kita mengadopsi pemisahan gambar dan metadata (Facial Beauty Prediction), penyimpanan hasil terstruktur (face-rating, DeepFace), pencatatan versi preprocessing (MEBeauty), dan modularitas (DeepFace).

---

## Langkah 3 — Filosofi Penyimpanan Data FaceAI

- **Wajib disimpan:**
  - Gambar asli (hasil capture).
  - Laporan lengkap (JSON sesuai skema Report dari M10).
  - Metadata analisis: ID unik, timestamp, versi model AI (misal "buffalo_l v1.0"), versi preprocessing pipeline (misal "v1.0"), overall score, confidence.
  - Status analisis (sukses/gagal).

- **Tidak perlu disimpan:**
  - Hasil preprocessing (aligned face) – dapat direproduksi dari gambar asli dengan preprocessing pipeline yang sama.
  - Embedding (saat ini tidak digunakan untuk analisis kecantikan, tapi arsitektur harus siap menambahkannya nanti).

- **Boleh dihitung ulang:** Semua skor dapat direproduksi dengan menjalankan ulang pipeline pada gambar asli, asalkan versi model dan preprocessing sama. Oleh karena itu, **gambar asli tidak boleh dihapus** kecuali seluruh analisis dihapus.

- **Bersifat immutable:** Setelah analisis selesai, record tidak boleh diubah. Jika user ingin analisis ulang, dibuat record baru.

- **Hubungan antar entitas:**
  - 1 analisis → 1 gambar asli + 1 laporan.
  - Tidak ada hubungan antar analisis (independen).
  - Jika user mengunggah gambar yang sama dua kali, akan menghasilkan dua record berbeda dengan ID berbeda.

- **Efisiensi:** Gunakan database SQLite untuk metadata, sedangkan gambar tetap disimpan di folder `uploads/` (atau folder khusus `history/`). Laporan disimpan sebagai teks JSON di database, bukan file terpisah, untuk kemudahan query dan backup.

---

## Langkah 4 — Desain Arsitektur History & Dataset

### Struktur Folder

```
FaceAI/
  backend/
    uploads/                  ← gambar hasil upload (tetap)
    history/                  ← folder baru untuk penyimpanan permanen
      <analysis_id>/
        original.jpg          ← salinan gambar asli (opsional, bisa tetap di uploads)
        thumbnail.jpg         ← (opsional, untuk M12)
        report.json           ← (opsional, cadangan jika database corrupt)
```

Untuk kemudahan, kita akan tetap menyimpan gambar asli di `uploads/` dan **tidak menghapusnya** setelah analisis. Database akan menyimpan path relatif ke file tersebut.

### Skema Database SQLite

Tabel `analyses`:

- `id` : TEXT PRIMARY KEY (UUID)
- `timestamp` : TEXT (ISO 8601)
- `image_path` : TEXT (path relatif ke gambar asli)
- `report_json` : TEXT (JSON lengkap sesuai Report schema)
- `overall_score` : REAL
- `confidence` : REAL
- `model_version` : TEXT (misal "insightface-buffalo_l-v1")
- `preprocessing_version` : TEXT (misal "align-eyes-letterbox-224")
- `strengths` : TEXT (JSON array)
- `suggestions` : TEXT (JSON array)
- `status` : TEXT ('completed', 'failed', dll)

Index: `timestamp` untuk pengurutan.

### Struktur Report JSON

Sesuai `Report` Pydantic dari M10. Disimpan sebagai string.

### Alur Penyimpanan

1. Endpoint `/api/analyze` (atau `/api/report`) menghasilkan `Report`.
2. Setelah report dibuat, **sebelum** mengembalikan response, panggil service `history_service.save_analysis()`.
3. `save_analysis` melakukan:
   - Generate UUID.
   - Copy gambar asli dari temp path ke `uploads/` (jika belum ada) → dapatkan `image_path`.
   - Simpan record ke database.
   - Kembalikan `analysis_id`.
4. Response report diperkaya dengan `analysis_id`.

Endpoint `/api/upload` hanya menyimpan gambar; belum ada history. Maka kita integrasikan penyimpanan history di endpoint `/api/analyze` (atau `/api/report`) karena di sana laporan sudah jadi.

Untuk `export`, kita bisa buat endpoint `/api/history/{id}/export` yang mengembalikan file JSON laporan sebagai unduhan.

---

## Langkah 5 — Pemecahan Menjadi Stage Kecil

### Stage 11.1 — Database Setup & Model

**Objective:**  
Menyiapkan database SQLite, tabel `analyses`, dan model data menggunakan Python (sqlite3).

**Mengapa diperlukan:**  
Pondasi penyimpanan metadata. Tanpa ini, stage lain tidak bisa berjalan.

**Input:**  
Tidak ada.

**Process:**

- Buat modul `backend/app/database.py` dengan fungsi `init_db()`.
- Buat file `backend/app/services/history_service.py` dengan class `HistoryService` yang menangani operasi CRUD.
- Tentukan versi skema awal.

**Output:**  
Database siap digunakan; tabel `analyses` terbuat.

**Deliverables:**

- `backend/app/database.py`
- `backend/app/services/history_service.py` (kerangka)
- Folder `backend/history/` (opsional, jika mau simpan cadangan)

**Dependency:** Tidak ada.

**Definition of Done:**  
Jalankan `init_db()` → file `faceai.db` muncul dengan tabel yang benar.

**Testing Checklist:**

- Panggil `HistoryService.create(...)` dummy dan pastikan record tersimpan.
- Uji query semua record.

**Risiko:**  
Migrasi skema di masa depan; gunakan versioning sederhana.

**Catatan Engineering:**  
Gunakan `sqlite3` modul standar, tidak perlu ORM untuk menjaga kesederhanaan. Fungsi database akan diisolasi di `history_service.py`.

---

### Stage 11.2 — Save Analysis Service

**Objective:**  
Mengimplementasikan penyimpanan otomatis setiap kali report selesai dibuat, dengan menyimpan gambar asli, report JSON, dan metadata ke database dan folder.

**Mengapa diperlukan:**  
Ini adalah inti dari history: menangkap hasil tanpa intervensi.

**Input:**

- `Report` object (dari M10)
- Path gambar asli (hasil upload)
- Versi model & preprocessing (dari config)

**Process:**

- Buat fungsi `save_analysis(report, image_path, model_ver, prep_ver)` di `history_service.py`:
  1. Generate UUID.
  2. Simpan record ke database dengan semua field.
  3. (Opsional) Salin gambar asli ke folder `history/<id>/original.jpg` jika diinginkan. Untuk sederhana, kita biarkan gambar di `uploads/`.
  4. Return `analysis_id`.
- Panggil fungsi ini di endpoint `/api/analyze` (atau `/api/report`) setelah report terbentuk, sebelum response.

**Output:**  
Record baru di database; gambar tetap ada.

**Deliverables:**

- `backend/app/services/history_service.py` (implementasi `save_analysis`)
- Modifikasi endpoint `/api/analyze` (atau `/api/report`) untuk memanggil service.

**Dependency:** Stage 11.1.

**Definition of Done:**  
Setelah memanggil `/api/analyze`, data muncul di database.

**Testing Checklist:**

- Lakukan analisis via API, cek database apakah ada record baru.
- Pastikan `image_path` sesuai.
- Uji dengan report kosong (edge case, harusnya tidak terjadi).

**Risiko:**  
Duplikasi gambar jika endpoint dipanggil ulang; dicegah dengan tidak menyimpan ulang gambar.

**Catatan Engineering:**  
Gunakan konfigurasi `MODEL_VERSION` dan `PREPROCESSING_VERSION` di `config.py` agar mudah diubah.

---

### Stage 11.3 — API Endpoints for History Management

**Objective:**  
Menyediakan endpoint untuk mengakses, menghapus, dan mengekspor riwayat analisis.

**Mengapa diperlukan:**  
Frontend membutuhkan akses ke data riwayat, dan pengguna ingin mengelola datanya.

**Input:**

- Database record.

**Process:**

- Buat `backend/app/api/history.py` dengan router:
  - `GET /api/history` → list semua analisis (dengan paginasi? untuk MVP, sederhana). Kembalikan array berisi `id`, `timestamp`, `overall_score`, `thumbnail_url` (null), `strengths`, dll.
  - `GET /api/history/{id}` → detail lengkap termasuk report.
  - `DELETE /api/history/{id}` → hapus record dan (opsional) gambar terkait.
  - `GET /api/history/{id}/export` → unduh report sebagai file JSON.
- Gunakan `history_service` untuk query database.

**Output:**  
Response JSON yang sesuai.

**Deliverables:**

- `backend/app/api/history.py`
- Daftarkan router di `main.py`

**Dependency:** Stage 11.2 (data harus sudah ada).

**Definition of Done:**

- `/api/history` mengembalikan list.
- `/api/history/{id}` mengembalikan detail.
- `DELETE` menghapus record.

**Testing Checklist:**

- Simpan beberapa analisis, lalu akses list.
- Hapus satu, cek apakah hilang.
- Ekspor report, verifikasi file JSON valid.

**Risiko:**  
Penghapusan gambar harus hati-hati; jika gambar digunakan oleh record lain? Tidak mungkin karena setiap analisis punya gambar sendiri. Namun jika gambar yang sama digunakan di beberapa analisis (misal upload ulang file yang sama), kita tidak boleh menghapus gambar begitu saja. Kita bisa simpan reference count, atau lebih sederhana: saat delete, hanya hapus record database, biarkan gambar tetap ada di `uploads/` (akan dibersihkan secara periodik). Untuk MVP, kita hapus record saja, gambar tetap ada untuk kesederhanaan.

**Catatan Engineering:**  
Gunakan pydantic model untuk response list agar konsisten.

---

### Stage 11.4 — Frontend History UI

**Objective:**  
Menampilkan daftar riwayat di frontend dan memungkinkan pengguna melihat detail, menghapus, dan mengunduh laporan.

**Mengapa diperlukan:**  
Pengguna harus bisa mengakses history dari antarmuka.

**Input:**  
API dari Stage 11.3.

**Process:**

- Buat file `frontend/js/modules/history.js` dengan fungsi untuk fetch history, render list, detail modal, delete, export.
- Tambahkan tombol "History" di UI setelah capture selesai (atau di menu terpisah). Untuk MVP, kita bisa menampilkan daftar history di bawah report, atau di tab.
- Sederhana: setelah report muncul, di bawahnya ada tombol "View History" yang mengganti tampilan dengan daftar history (fetch dari `/api/history`). Atau kita buat panel terpisah yang selalu bisa diakses.
- Implementasi: buat div `#history-panel`, sembunyikan saat capture, tampilkan saat user klik "History". Di dalamnya, render list dengan `fetch` dan template literal.

**Output:**  
Antarmuka riwayat berfungsi.

**Deliverables:**

- `frontend/js/modules/history.js`
- Modifikasi `frontend/index.html` (tambah div panel)
- Modifikasi `frontend/js/capture.js` untuk menampilkan panel history.

**Dependency:** Stage 11.3 (API harus berfungsi).

**Definition of Done:**

- Setelah beberapa analisis, klik History menampilkan daftar.
- Klik item history menampilkan detail (tampilan mirip report).
- Tombol delete berfungsi.
- Tombol export mengunduh JSON.

**Testing Checklist:**

- Uji dengan 0, 1, banyak history.
- Uji delete.
- Uji export.

**Risiko:**  
UI menjadi kompleks; jaga agar tidak merusak alur capture.

**Catatan Engineering:**  
Gunakan `fetch` dengan error handling. Simpan history di state frontend? Tidak perlu; panggil API setiap kali panel dibuka.

---

## Langkah 6 — Urutan Stage yang Direkomendasikan

11.1 → 11.2 → 11.3 → 11.4. Setiap stage bergantung pada sebelumnya.

---

## Langkah 7 — Best Practices & Risiko Jangka Panjang

- **Modularitas:** History service adalah modul terpisah, tidak bergantung pada API. Dapat digunakan oleh background job di masa depan.
- **Scalability:** SQLite cukup untuk ribuan record. Jika nanti perlu skalabilitas tinggi, migrasi ke PostgreSQL tanpa mengubah interface service.
- **Backup:** Simpan report JSON di folder `history/` sebagai cadangan, atau setidaknya sediakan endpoint export massal.
- **Data immutability:** Jangan update record setelah dibuat. Jika ada revisi model, buat analisis baru.
- **Privacy:** Gambar asli mungkin mengandung informasi sensitif. Pastikan akses endpoint history dilindungi (untuk development tidak masalah). Di masa depan, tambahkan autentikasi.
- **Pembersihan:** Jangan hapus gambar secara otomatis; biarkan pengguna menghapus melalui UI. Untuk mencegah penumpukan, bisa ada batasan jumlah maksimum history (opsional).

Dengan desain ini, Milestone 11 akan menghasilkan sistem history yang kokoh dan siap berkembang bersama FaceAI. Saya mohon persetujuan untuk memulai implementasi Stage 11.1.
