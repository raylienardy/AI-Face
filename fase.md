# Dokumen Desain Teknis Milestone 10 — AI Report Generator

**Versi:** 1.0  
**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer

---

## Langkah 1 — Insight dari Empat Repositori yang Relevan untuk Report Generator

### Facial Beauty Prediction

- **Distribusi skor, bukan sekadar rata-rata:** Model memberikan distribusi probabilitas rating (1–5). Insight penting: laporan bisa menampilkan _keyakinan_ dengan distribusi, bukan hanya satu angka. Untuk FaceAI, meskipun kita tidak menggunakan EMD loss saat ini, konsep ini menginspirasi agar setiap skor disertai **rentang keyakinan**.
- **Expected value sebagai skor akhir:** Laporan harus mudah dibaca; satu angka utama tetap penting. Namun kita bisa tambahkan _confidence band_.
- **Pemisahan inferensi & presentasi:** Repo ini menampilkan skor numerik. Tidak ada laporan naratif. Maka kita harus membangun lapisan presentasi yang benar-benar terpisah.

### face-rating

- **Banyak fitur terpisah:** Geometri, landmark, rasio. Setiap fitur bisa diberi skor sendiri-sendiri. Ini sesuai dengan FaceAI yang menghasilkan skor per region.
- **Interpretabilitas fitur geometris:** Karena fitur geometris mudah dijelaskan (mis. "lebar hidung vs lebar wajah"), laporan bisa menyertakan penjelasan singkat untuk setiap skor. Ini menjadikan laporan lebih transparan.
- **Kelemahan:** Tidak ada mekanisme otomatis mengubah fitur geometris menjadi saran perbaikan. Itu harus kita rancang secara terpisah.

### MEBeauty

- **Preprocessing konsisten = confidence lebih tinggi:** Laporan harus mencantumkan informasi kualitas input? Tidak perlu, karena kualitas sudah dijamin oleh Milestone 5. Namun, jika preprocessing gagal, backend akan menolak gambar. Jadi confidence laporan berasal dari confidence model, bukan dari preprocessing.
- **Multi-etnis:** Hasil analisis mungkin sensitif terhadap etnis. Di masa depan, laporan bisa disesuaikan. Untuk v1, kita tidak perlu, tetapi arsitektur harus mendukung penambahan konteks demografis (dari DeepFace) jika diperlukan nanti.

### DeepFace

- **Representasi hasil terstruktur:** DeepFace mengembalikan dictionary dengan key yang jelas (age, gender, race, emotion, embedding). Laporan harus mengambil struktur serupa: output Milestone 9 adalah dictionary besar, dan report generator membaca dictionary itu.
- **Confidence & threshold:** DeepFace memiliki threshold per model. Untuk laporan, setiap skor harus memiliki confidence. Kita sudah punya confidence placeholder; kita bisa menampilkannya sebagai "accuracy indicator".
- **Modularitas:** Setiap atribut dianalisis terpisah, sehingga laporan bisa menampilkan per kategori tanpa saling ketergantungan. Ini memungkinkan kita menambah/ mengurangi kategori tanpa mengubah format laporan secara keseluruhan.

---

## Langkah 2 — Evaluasi Milestone 10

### 1. Apakah objective milestone ini sudah benar?

**Ya.** "Mengubah hasil AI menjadi laporan yang mudah dipahami" adalah deskripsi tepat untuk presentation layer. Objective tidak menyebutkan perhitungan ulang, hanya transformasi data → informasi → laporan.

### 2. Apakah urutannya sudah tepat?

**Ya.** Setelah analisis AI (M9), laporan dibangun (M10) lalu ditampilkan (M10 bagian frontend). Urutan sesuai pipeline.

### 3. Apakah ada bagian yang masih kurang?

- **Interpretasi strengths & improvement suggestions:** Menerjemahkan skor numerik menjadi teks naratif (misal "Strong jawline") memerlukan aturan. Saat ini hanya disebutkan sebagai output, tetapi belum ada mekanisme. Perlu modul khusus (rule engine) atau template.
- **Confidence:** Sudah ada di output analisis, tetapi belum dijelaskan bagaimana ditampilkan (misal: "Confidence: 88%" atau "High confidence").
- **Format output:** Apakah laporan berupa JSON, HTML, atau teks? Untuk frontend, sebaiknya JSON terstruktur yang bisa dirender oleh UI. Jadi kita perlu definisi skema respons.
- **Lokalisasi:** Tidak disebutkan, tapi untuk v1 bisa diabaikan.

### 4. Apakah ada bagian yang terlalu cepat?

**Tidak.** Milestone ini tepat setelah AI selesai. Tidak ada yang prematur.

### 5. Apakah ada bagian yang seharusnya dipindahkan ke milestone lain?

**Tidak.** Semua deliverables (overall score, feature scores, strengths, suggestions, confidence) adalah tanggung jawab report generator. Namun, "Strengths & Improvement Suggestions" memerlukan aturan yang bisa sangat kompleks. Untuk mencegah over-engineering, kita bisa membuatnya berbasis threshold sederhana di M10, lalu ditingkatkan di milestone berikutnya (M12 UI/Performance).

### 6. Apakah desain ini sudah sesuai dengan hasil pembelajaran dari keempat repository?

**Ya.** Desain ini memisahkan inference (M9) dari presentasi (M10). Mengadopsi struktur modular seperti DeepFace: output M9 adalah dictionary yang kaya, lalu M10 membacanya dan menghasilkan laporan. Confidence dari setiap skor ditampilkan. Saran perbaikan dapat dihasilkan oleh rule engine yang meniru interpretasi geometris face-rating.

---

## Langkah 3 — Rekomendasi Perbaikan (Tanpa Kode)

1. **Definisikan skema input/output yang ketat.**  
   Input ke Report Generator adalah dictionary hasil Milestone 9. Output adalah dictionary laporan yang siap dikirim ke frontend.

2. **Buat aturan sederhana untuk Strengths & Suggestions.**  
   Contoh: Jika `jawline > 80`, tambahkan ke strengths "Strong Jawline". Jika `skin_quality < 40`, suggestion "Improve skincare". Aturan disimpan di file konfigurasi terpisah agar mudah diubah tanpa menyentuh kode inti.

3. **Gunakan template string untuk narasi.**  
   Untuk menghindari hardcode teks di kode, gunakan template yang menerima nama kategori dan skor.

4. **Confidence setiap skor dihitung di M9, bukan M10.**  
   M10 hanya meneruskan confidence yang sudah ada. Jika belum ada (placeholder), kita siapkan field kosong atau default.

5. **Pisahkan Report Generator menjadi dua sub-layer:**
   - **Content builder:** Menyusun struktur laporan (aggregasi skor, pemilihan strengths/suggestions).
   - **Formatter:** Mengubah struktur tersebut menjadi format tertentu (JSON untuk API, nanti bisa HTML/PDF). Untuk sekarang, JSON formatter.

---

## Langkah 4 — Pemecahan Milestone 10 Menjadi Stage Kecil

### Stage 10.1 — Report Schema & Data Contract

**Objective:**  
Mendefinisikan skema input (dari Milestone 9) dan skema output (laporan) yang akan digunakan oleh frontend. Menjamin konsistensi data.

**Mengapa stage ini diperlukan:**  
Tanpa kontrak data yang jelas, integrasi antara backend dan frontend akan rapuh. Skema juga menjadi dokumentasi hidup.

**Input:**  
Hasil analisis dari Milestone 9 dalam bentuk dictionary (contoh: `face_structure`, `eyes`, `skin`, dll).

**Process:**

- Definisikan kelas Pydantic atau JSON Schema untuk:
  - `AnalysisResult` (input)
  - `Report` (output)
- Diskusikan dengan frontend (jika ada) struktur yang diinginkan.
- Simpan sebagai `backend/app/schemas/report.py` atau cukup sebagai definisi model di `analysis.py`.

**Output:**  
File skema yang mendokumentasikan kontrak. Belum ada implementasi logika.

**Deliverables:**

- `backend/app/schemas/report.py` dengan model Pydantic: `FeatureScore`, `CategoryReport`, `Report`.
- Konfirmasi bahwa skema ini cocok untuk frontend.

**Dependency:**  
Tidak ada. Dapat dilakukan paralel dengan M9.

**Definition of Done:**  
Skema Pydantic terdefinisi dan lulus validasi JSON.

**Testing Checklist:**

- Buat instance model dengan data dummy, pastikan serialisasi berhasil.
- Uji edge case: field kosong, skor di luar rentang.

**Risiko:**  
Perubahan skema di kemudian hari; mitigasi dengan versioning (misal `v1/report`).

**Catatan Engineering:**  
Gunakan Pydantic untuk validasi otomatis. Hindari coupling dengan logika bisnis.

---

### Stage 10.2 — Content Builder (Strengths & Suggestions Engine)

**Objective:**  
Membangun modul yang menerjemahkan skor numerik menjadi daftar kekuatan dan saran perbaikan.

**Mengapa stage ini diperlukan:**  
Ini adalah inti dari "laporan yang mudah dipahami". Tanpa ini, laporan hanya sekumpulan angka.

**Input:**  
Dictionary skor dari M9 (misal: `jawline: 85`, `skin_quality: 35`).

**Process:**

- Buat file konfigurasi `backend/app/config/report_rules.yaml` yang berisi aturan:
  ```yaml
  strengths:
    - category: jaw
      field: jawline
      threshold: 80
      message: "Strong Jawline"
    - category: geometry
      field: symmetry
      threshold: 80
      message: "Symmetric Face"
  suggestions:
    - category: skin
      field: skin_quality
      threshold: 40
      comparison: less_than
      message: "Consider improving skin care routine"
  ```
- Implementasikan `backend/app/services/report_builder.py` dengan fungsi `generate_strengths_suggestions(scores)` yang membaca YAML dan mengembalikan dua list.
- Jika tidak ada aturan yang terpicu, kembalikan list kosong.

**Output:**  
Dua list: `strengths: ["Strong Jawline", ...]`, `suggestions: [...]`.

**Deliverables:**

- `backend/app/config/report_rules.yaml`
- `backend/app/services/report_builder.py`

**Dependency:**  
Stage 10.1 (skema input) untuk memastikan format data yang diterima.

**Definition of Done:**

- Untuk input dummy dengan `jawline=85`, output mengandung `"Strong Jawline"`.
- Untuk input di bawah threshold, tidak ada.
- YAML dapat diubah tanpa restart server (reload otomatis atau manual).

**Testing Checklist:**

- Uji dengan berbagai kombinasi skor.
- Uji jika file YAML hilang atau format salah → gunakan default kosong.
- Uji threshold tepat di batas.

**Risiko:**  
Aturan terlalu kaku; iterasi berikutnya bisa menggunakan fuzzy logic. Untuk v1, aturan eksplisit sudah cukup.

**Catatan Engineering:**  
Gunakan library `pyyaml` (tambah ke requirements). Cache aturan di memori, refresh saat file berubah (atau saat request untuk kesederhanaan).

---

### Stage 10.3 — Report Aggregation & Generation Endpoint

**Objective:**  
Mengintegrasikan content builder dengan hasil analisis, menghasilkan laporan lengkap dalam format JSON melalui endpoint API.

**Mengapa stage ini diperlukan:**  
Ini menghubungkan output M9 menjadi respons API yang siap dikonsumsi frontend.

**Input:**

- Data dari Milestone 9 (bisa didapat dari penyimpanan sementara atau dari request ulang). Untuk saat ini, kita akan membuat endpoint `/api/report` yang menerima hasil analisis sebagai input, atau menggabungkannya dengan `/api/analyze`.  
  Karena M9 sudah memiliki endpoint `/api/analyze` yang mengembalikan skor, kita akan **memperluas** endpoint tersebut (atau membuat baru) untuk juga menghasilkan laporan. Untuk menghindari overhead, kita bisa menambahkan query parameter `?format=report` di `/api/analyze` yang setelah analisis selesai langsung memanggil report builder.  
  **Keputusan:** Buat endpoint `/api/report` terpisah yang menerima `analysis_id` (jika hasil disimpan) atau langsung menerima JSON hasil analisis. Untuk MVP, kita akan membuat endpoint `/api/analyze` yang diperkaya: response-nya sudah termasuk laporan. Jadi tidak ada endpoint baru, hanya penambahan di logic `/api/analyze`.

**Process:**

- Di `backend/app/api/analysis.py`, setelah mendapatkan `overall` dan skor lainnya, panggil `generate_strengths_suggestions(scores)`.
- Gabungkan semua ke dalam struktur `Report` sesuai skema.
- Kembalikan sebagai bagian dari response.

**Output:**  
JSON yang berisi `face_structure`, `eyes`, ..., `overall`, `strengths`, `suggestions`, `confidence`.

**Deliverables:**

- Modifikasi `backend/app/api/analysis.py` (atau file terpisah `report.py`).
- Pastikan response model mengikuti `Report` schema.

**Dependency:**  
Stage 10.1 (skema) dan Stage 10.2 (content builder).

**Definition of Done:**  
`curl -F "file=@test.jpg" http://localhost:8000/api/analyze` menghasilkan JSON dengan field `strengths` dan `suggestions` yang terisi berdasarkan aturan.

**Testing Checklist:**

- Kirim gambar dengan skor tinggi di jawline → lihat strengths muncul.
- Kirim gambar dengan skin_quality rendah → suggestions muncul.
- Kirim gambar tanpa wajah → error 422, bukan report.

**Risiko:**  
Performance: pembacaan YAML setiap request? Kita cache di modul.

**Catatan Engineering:**  
Pisahkan logic report dari analysis agar bisa diuji terpisah. Gunakan dependency injection untuk report builder.

---

### Stage 10.4 — Confidence Scoring Integration

**Objective:**  
Memastikan setiap skor dan overall score memiliki confidence yang bermakna, dan ditampilkan dalam laporan.

**Mengapa stage ini diperlukan:**  
Confidence adalah elemen kunci dari laporan yang dapat dipercaya. Saat ini confidence masih placeholder; di stage ini kita setidaknya menyediakan struktur yang benar dan menggunakan nilai yang ada dari model (jika model regresi, bisa menggunakan variance). Untuk placeholder, kita bisa mempertahankan nilai acak tetapi dengan label yang jelas (misal: "confidence": "low").

**Input:**  
Skor dari M9 beserta confidence-nya (jika ada) atau nilai default.

**Process:**

- Di aggregator atau content builder, tambahkan pemetaan confidence untuk setiap kategori.
- Untuk MVP, karena confidence belum nyata, kita gunakan nilai default 0.5 atau label "Not available".
- Tetap cantumkan field `confidence` di setiap bagian laporan.

**Output:**  
Setiap `FeatureScore` memiliki properti `confidence` (0.0–1.0).

**Deliverables:**

- Update skema (jika belum) untuk mencakup confidence di tiap sub-skema.
- Update `aggregator.py` dan `report_builder.py` untuk mempropagasi confidence.

**Dependency:**  
Stage 10.1, 10.3.

**Definition of Done:**  
Response JSON mengandung `confidence` di level overall dan per kategori (jika memungkinkan).

**Testing Checklist:**

- Cek apakah confidence muncul di response.
- Uji jika confidence tidak tersedia → tampilkan null atau default.

**Risiko:**  
Kebingungan pengguna jika confidence rendah; nanti bisa diatasi dengan threshold.

**Catatan Engineering:**  
Jangan membuat perhitungan confidence baru di sini; hanya meneruskan dari model.

---

### Stage 10.5 — Frontend Report Display (Basic)

**Objective:**  
Menyediakan tampilan laporan di frontend setelah upload berhasil (state `RESULT_READY`).

**Mengapa stage ini diperlukan:**  
Laporan harus terlihat oleh pengguna. Tanpa ini, Milestone 10 tidak lengkap.

**Input:**  
Response JSON dari `/api/analyze` yang sudah disimpan di frontend (misal setelah upload, kita langsung panggil `/api/analyze` dengan gambar yang sama, atau kita ubah alur agar setelah upload otomatis analyze dan kembalikan report).  
Untuk meminimalkan perubahan di M7, kita bisa membuat frontend melakukan panggilan kedua ke `/api/analyze` setelah upload sukses, menggunakan filename yang diterima, atau mengirim gambar lagi. Namun karena gambar sudah diunggah, lebih baik backend menyimpan analysis_result dan mengembalikan ID.  
**Penyederhanaan:** Endpoint `/api/analyze` menerima file langsung, sehingga frontend bisa langsung memanggilnya setelah capture, tanpa upload terpisah. Tapi kita sudah punya alur upload → preprocessing → analysis. Agar tidak mengubah banyak, kita akan membuat endpoint `/api/report` yang menerima `filename` (hasil upload) dan mengembalikan laporan. Jadi alur: Upload → dapat filename → frontend panggil `/api/report?file=filename` → dapat laporan.

**Process:**

- Buat endpoint `/api/report` di backend yang membaca file dari `uploads/`, menjalankan pipeline preprocessing + analysis + report generation.
- Di frontend, setelah tombol "Continue" sukses (state `RESULT_READY`), panggil `/api/report` dengan `filename`.
- Tampilkan laporan sederhana: overall score, list strengths, suggestions.

**Output:**  
Halaman frontend menampilkan laporan (bisa menggantikan preview, atau di bawahnya).

**Deliverables:**

- `backend/app/api/report.py` dengan endpoint GET `/api/report?file=...`
- Modifikasi `frontend/js/capture.js` untuk mengambil dan menampilkan laporan.
- Elemen HTML untuk display laporan.

**Dependency:**  
Stage 10.3 (report generation), Stage 7.2 (upload).

**Definition of Done:**  
Alur lengkap: Capture → Upload → Klik Continue → (backend analyze) → frontend menampilkan overall score dan strengths/suggestions.

**Testing Checklist:**

- Uji alur end-to-end dengan gambar wajah.
- Uji error handling jika file tidak ditemukan.
- Uji tampilan responsif.

**Risiko:**  
Menambah kompleksitas frontend; tetap minimalis.

**Catatan Engineering:**  
Gunakan template literal untuk merender laporan di JS. Jangan buat UI terlalu rumit.

---

## Langkah 5 — Urutan Stage yang Direkomendasikan

1. **10.1** (Schema) → fondasi kontrak data.
2. **10.2** (Content Builder) → logika strengths/suggestions.
3. **10.3** (Endpoint & Aggregation) → gabungkan.
4. **10.4** (Confidence Integration) → penyempurnaan.
5. **10.5** (Frontend Display) → tampilkan ke pengguna.

Urutan ini memastikan setiap stage membangun di atas yang sebelumnya.

---

## Langkah 6 — Rekomendasi Praktik Terbaik

- **Separation of Concerns:** Report generator tidak boleh tahu bagaimana skor dihasilkan. Ia hanya membaca dictionary.
- **Config-Driven Rules:** Aturan strengths/suggestions disimpan dalam file YAML, memudahkan non-developer untuk menyesuaikan.
- **Schema Validation:** Gunakan Pydantic untuk memvalidasi input dan output.
- **Immutability:** Report builder tidak mengubah data analisis; ia membuat struktur baru.
- **Testing:** Setiap komponen (rules engine, formatter) harus dapat diuji secara unit.
- **Jangan Over-Engineering:** Untuk saran, gunakan aturan if-else sederhana. Tidak perlu machine learning lagi.
- **Confidence harus transparan:** Tampilkan sebagai persentase atau label (High/Medium/Low) agar pengguna paham keterbatasan.
- **Frontend minimal:** Mulai dengan tampilan teks biasa, tanpa grafik. Tingkatkan di M12.

Dengan desain ini, Milestone 10 akan menghasilkan laporan yang informatif, modular, dan siap untuk ditingkatkan seiring dengan peningkatan model AI. Siap untuk memulai implementasi Stage 10.1. Apakah Anda setuju?
