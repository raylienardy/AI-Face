# Laporan Perancangan Milestone 9 — AI Face Analysis

**Versi:** 1.0  
**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer

---

## Step 1 — Recall Knowledge dari Empat Repositori

### Facial Beauty Prediction

- **Tujuan:** Memprediksi skor kecantikan (1–5) dengan distribusi opini, bukan sekadar rata‑rata.
- **Arsitektur:** NIMA (Neural Image Assessment) dengan backbone SqueezeNet1.1 pretrained ImageNet, head softmax 5 kelas.
- **Target:** Distribusi probabilitas rating dari 60 penilai per gambar.
- **Loss:** Earth Mover Distance (EMD) – menghukum kesalahan prediksi dengan mempertimbangkan urutan kelas (skor 4 ke 5 lebih baik daripada 4 ke 1).
- **Inferensi:** Skor akhir dihitung sebagai expected value dari distribusi prediksi.
- **Preprocessing:** Inkonsistensi (tanpa normalisasi ImageNet). Ini harus dihindari di FaceAI.
- **Pelajaran yang diadopsi:**
  - Menggunakan distribusi opini memberikan gradien yang lebih halus dan menghasilkan korelasi Pearson tinggi.
  - Backbone pretrained mempercepat konvergensi dan meningkatkan generalisasi.
  - Konsistensi preprocessing wajib.

### face‑rating

- **Pendekatan ganda:** ML tradisional dengan fitur geometris (11.628 rasio landmark) + PCA → SVR; CNN regresi dari awal.
- **Fitur geometris:** Menangkap proporsi wajah klasik (simetri, golden ratio). Sangat interpretabel.
- **Kelemahan CNN:** Tanpa pretrained backbone dan augmentasi minim, akurasi terbatas.
- **Pelajaran yang diadopsi:**
  - Fitur geometris bisa menjadi input komplementer untuk analisis struktur wajah.
  - Landmark yang presisi adalah syarat mutlak.
  - CNN dari awal tidak cocok untuk dataset kecil; transfer learning lebih baik.

### MEBeauty

- **Dataset:** Multi‑etnis (2550 gambar), skor personal & generik, crop & alignment wajah (DeepFace).
- **Pipeline:** Preprocessing ketat (alignment → resize 224×224, normalisasi [-1,1]) → backbone pretrained (VGG16, DenseNet, dll.) dengan feature extractor dibekukan → MLP regresi (4096→4096→1) + dropout 0.5, dilatih dengan MSE.
- **Shallow features:** Eigenface, Gabor, HOG, geometris → SVR. FaceNet embedding juga dieksplorasi.
- **Pelajaran:**
  - Alignment yang tepat dan preprocessing konsisten adalah kunci.
  - Backbone pretrained + MLP sederhana sudah memberikan hasil baik.
  - Multi‑ethnic dataset penting untuk generalisasi.
  - **Inkonsistensi normalisasi** (training [-1,1], inference tanpa normalisasi) menyebabkan prediksi melenceng. Harus dihindari.

### DeepFace

- **Pipeline standar:** Detect → Align → Normalize → Represent → Verify/Analyze.
- **Represent:** Face embedding dari model recognition (VGG‑Face, Facenet, ArcFace, dll.). Embedding 4096‑d (VGG‑Face) atau 128‑d (Facenet) digunakan sebagai fitur generik wajah.
- **Attribute analysis:** Model demography (Age, Gender, Race) menggunakan backbone VGG‑Face + head minimal, dilatih secara terpisah.
- **Threshold & confidence:** Pre‑tuned per model dan metrik, dengan regresi logistik untuk confidence calibration.
- **Kelebihan arsitektur:** Setiap tahap berdiri sendiri, model dapat diganti tanpa merusak yang lain, cocok untuk produksi.
- **Pelajaran utama untuk FaceAI:**
  - Gunakan embedding sebagai representasi wajah yang kaya.
  - Bangun head terpisah untuk tiap atribut (multi‑head).
  - Preprocessing harus identik dengan training.
  - Modularitas memungkinkan penambahan atribut baru tanpa menyentuh pipeline inti.

---

## Step 2 — Ingat Tujuan FaceAI

Frontend hanya bertugas menangkap foto terbaik. Backend-lah yang melakukan seluruh analisis AI. Oleh karena itu, Milestone 9 harus menghasilkan **beberapa skor independen per aspek wajah**, bukan hanya satu angka. Aspek yang dianalisis meliputi: struktur wajah, mata, alis, hidung, bibir, rahang, pipi, kulit, rambut, dan overall attractiveness. Semua skor akan dihitung di backend, dan frontend hanya menerima JSON hasil akhir.

---

## Step 3 — Evaluasi Milestone 9

Pembagian modul AI saat ini sudah baik karena memisahkan perhatian berdasarkan region wajah. Namun perlu beberapa penyesuaian:

- **Modul "Hair" (rambut)** sebaiknya **ditunda ke versi berikutnya**. Analisis rambut memerlukan segmentasi khusus dan dataset yang berbeda. Untuk v1.0, fokus pada fitur wajah internal.
- **"Overall Attractiveness"** bukanlah modul terpisah, melainkan **agregasi terboboti** dari skor‑skor lainnya, atau bisa juga menggunakan model NIMA terpisah yang dilatih pada dataset kecantikan umum. Akan tetapi, untuk memulai, pendekatan agregasi lebih sederhana dan dapat dijelaskan.
- **Confidence score**: Setiap prediksi harus disertai confidence yang mencerminkan seberapa yakin model terhadap hasilnya (misal dari variance prediksi, atau dari probabilitas softmax).
- Modul‑modul yang ada dapat dikelompokkan menjadi 3 kategori besar:
  1. **Struktur & Harmoni Wajah** (Face Shape, Facial Harmony, Symmetry) – sangat bergantung pada landmark.
  2. **Fitur Wajah** (Eyes, Eyebrows, Nose, Lips, Jaw, Cheek) – bisa menggunakan patch CNN.
  3. **Kulit** (Skin Quality, Texture, Tone) – memerlukan analisis patch kulit dari area pipi/dahi.
- Modul "Skin" perlu preprocessing tambahan: crop area pipi atau dahi, konversi ke color space tertentu, dan mungkin analisis frekuensi untuk tekstur.

---

## Step 4 — Review AI Architecture

Beberapa pendekatan yang dipertimbangkan:

| Pendekatan                                     | Kelebihan                                                                                   | Kekurangan                                                               | Cocok untuk FaceAI?  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------- |
| **Satu model besar multi‑output**              | Simpel, satu kali inferensi                                                                 | Sulit di-debug, tidak modular, perlu dataset besar dengan label lengkap  | ❌                   |
| **Satu model per kategori (10+ model)**        | Sangat modular, bisa dilatih independen                                                     | Beban komputasi tinggi, manajemen model rumit                            | ❌                   |
| **Hybrid: backbone bersama + multi‑head**      | Modular, efisien (satu forward backbone), mudah menambah atribut                            | Perlu fine‑tuning hati‑hati agar head tidak saling mengganggu            | ✅                   |
| **Landmark + aturan geometris**                | Cepat, interpretabel                                                                        | Tidak menangkap tekstur/kulit, memerlukan definisi aturan yang subjektif | Sebagai tambahan     |
| **Embedding (FaceNet/ArcFace) + MLP terpisah** | Modular, memanfaatkan representasi wajah yang kaya, sudah terbukti di MEBeauty dan DeepFace | Memerlukan embedding yang baik, ukuran model sedang                      | ✅ **Pilihan utama** |

**Rekomendasi:**  
Gunakan **backbone bersama** (misalnya InsightFace buffalo_l recognition model, yang menghasilkan embedding 512‑d) yang sudah dilatih pada tugas face recognition. Backbone ini menghasilkan representasi wajah yang sangat diskriminatif. Kemudian, bangun **head terpisah** untuk setiap kelompok atribut:

- **Geometry head:** Menerima landmark dan embedding → memprediksi skor struktur wajah (shape, harmony, symmetry).
- **Region heads:** Menerima patch gambar yang di‑crop berdasarkan landmark (mata, hidung, bibir, dll.) + embedding → memprediksi skor fitur spesifik.
- **Skin head:** Menerima patch kulit (pipi) + embedding → memprediksi skor kualitas kulit.
- **Overall head:** Menerima embedding dan/atau agregasi skor lain → memprediksi overall attractiveness.

Keuntungan arsitektur ini:

- **Modular:** Setiap head bisa dilatih secara terpisah, dengan dataset yang berbeda.
- **Efisien:** Backbone hanya dijalankan sekali.
- **Mudah di-debug:** Jika skor mata tidak masuk akal, kita hanya perlu memeriksa head mata.
- **Production‑ready:** Mirip dengan pendekatan DeepFace untuk atribut.

---

## Step 5 — Review Setiap AI Module

| Modul                                         | Keputusan                               | Alasan                                                                                                                                                                             |
| --------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Face Structure (Shape, Harmony, Symmetry)** | Gabung dalam satu "Geometry Analyzer"   | Ketiganya sangat bergantung pada landmark dan proporsi wajah. Bisa dihitung dengan aturan geometris dan/atau regresi dari embedding.                                               |
| **Eyes (Shape, Spacing, Size)**               | Modul "Eye Analyzer"                    | Membutuhkan crop area mata dari landmark. Bisa menggunakan CNN kecil (misal MobileNet) yang dilatih pada dataset atribut mata.                                                     |
| **Eyebrows (Shape, Thickness, Position)**     | Gabung dengan Eye Analyzer? Atau pisah? | Alis dekat dengan mata, bisa di-crop bersama mata. Namun jika ingin analisis lebih detail, bisa dibuat head sendiri. Awalnya bisa digabung.                                        |
| **Nose (Width, Length, Balance)**             | Modul "Nose Analyzer"                   | Crop area hidung dari landmark.                                                                                                                                                    |
| **Lips (Shape, Fullness, Symmetry)**          | Modul "Mouth Analyzer"                  | Crop area mulut.                                                                                                                                                                   |
| **Jaw & Chin**                                | Gabung dalam "Jaw Analyzer"             | Crop area rahang; mungkin butuh landmark kontur wajah. InsightFace menyediakan 106 landmark, termasuk rahang.                                                                      |
| **Cheek (Cheekbones, Midface)**               | Modul "Cheek Analyzer"                  | Crop area pipi.                                                                                                                                                                    |
| **Skin (Quality, Texture, Tone)**             | Modul "Skin Analyzer"                   | Crop patch dari area pipi atau dahi yang bebas dari bayangan. Memerlukan preprocessing khusus (color space, filter). Bisa menggunakan CNN atau model klasik (GLCM, LBP) + regresi. |
| **Hair**                                      | **Tunda ke Milestone >10**              | Tidak kritikal untuk v1.0. Memerlukan segmentasi rambut.                                                                                                                           |
| **Overall Attractiveness**                    | Modul agregasi + opsional NIMA          | Hitung rata‑rata terboboti dari semua skor, dengan bobot yang bisa disetel. Atau gunakan model NIMA terpisah yang dilatih pada dataset kecantikan untuk memberikan skor holistic.  |

**Catatan:**

- Semua head regresi akan menghasilkan skor numerik (misal 0–100).
- Confidence score dapat dihitung dari variance prediksi (jika kita menggunakan ensemble) atau dari probabilitas softmax jika head menggunakan klasifikasi ordinal.
- Preprocessing untuk setiap head harus konsisten dengan training (ukuran crop, normalisasi).

---

## Step 6 — Pecah Menjadi Stage

### Stage 9.1 — Face Embedding Service

**Objective:** Menyediakan modul yang menghasilkan embedding wajah (vector representasi) dari gambar yang sudah di-preprocess. Embedding ini akan digunakan oleh semua head analisis.

**Deliverables:**

- Modul `backend/app/services/embedder.py` yang memanfaatkan model recognition InsightFace (ArcFace/w600k_r50) untuk mengekstrak embedding 512‑d.
- Cache embedding di memori untuk menghindari ekstraksi ulang.
- Fungsi `extract_embedding(aligned_face) -> np.ndarray`.

**Files:**

- `backend/app/services/embedder.py`
- (Opsional) konfigurasi model embedding di `config.py`.

**Output:** Panggil fungsi dengan gambar hasil alignment → dapatkan vector 512‑d.

**Testing:**

- Berikan dua gambar orang yang sama → embedding memiliki cosine similarity > 0.5.
- Berikan dua gambar orang berbeda → similarity rendah.

**Dependency:** Membutuhkan Stage 8.5 (gambar ter‑preprocess).

---

### Stage 9.2 — Landmark Extraction & Geometry Analyzer

**Objective:** Mengekstrak 106‑titik landmark (dari InsightFace) dan menghitung fitur geometris dasar (simetri, rasio, shape) yang menghasilkan skor struktur wajah.

**Deliverables:**

- Modul `backend/app/services/landmark_extractor.py` untuk mendapatkan 106 landmark.
- Modul `backend/app/services/geometry_analyzer.py` yang menghitung:
  - Face Shape (oval, round, square, dll.) → klasifikasi atau skor untuk tiap bentuk.
  - Facial Symmetry index (berdasarkan perbedaan sisi kiri‑kanan).
  - Facial Harmony score (berdasarkan golden ratio dan proporsi).
- Rule‑based atau model regresi sederhana (Linear Regression) yang dilatih pada dataset kecil berlabel.

**Files:**

- `backend/app/services/landmark_extractor.py`
- `backend/app/services/geometry_analyzer.py`
- Model atau koefisien regresi disimpan di `backend/models/geometry/`.

**Output:** Skor numerik untuk face shape, harmony, symmetry.

**Testing:**

- Wajah simetris → symmetry > 80.
- Wajah asimetris (misal satu mata lebih tinggi) → symmetry < 60.

**Dependency:** Stage 9.1 (embedding mungkin diperlukan untuk prediksi, atau cukup landmark saja). Landmark sudah tersedia dari detector, tapi kita bisa ekstrak ulang dari gambar aligned.

---

### Stage 9.3 — Region Analyzers (Eyes, Nose, Mouth, Jaw, Cheek)

**Objective:** Melatih atau menggunakan model pretrained untuk menganalisis fitur spesifik wajah berdasarkan patch yang di‑crop.

**Deliverables:**

- Modul `backend/app/services/region_analyzer.py` yang berisi kelas untuk setiap region.
- Setiap region analyzer:
  1. Crop patch sesuai landmark.
  2. Resize ke ukuran tetap (misal 64×64).
  3. Forward melalui CNN kecil (misal MobileNetV2 pretrained + head regresi) untuk menghasilkan skor.
- Model akan dilatih di luar pipeline (persiapan dataset di milestone terpisah) dan bobotnya disimpan di `backend/models/regions/`.
- Untuk MVP, kita bisa menggunakan **model dummy** (random score) sebagai placeholder, dan mengembangkannya nanti.

**Files:**

- `backend/app/services/region_analyzer.py`
- Folder `backend/models/regions/` (berisi file .onnx atau .pth)

**Output:** Skor mata, alis, hidung, bibir, rahang, pipi dalam rentang 0–100.

**Testing:**

- Karena model belum dilatih, uji hanya memastikan pipeline berjalan dan menghasilkan angka numerik.
- Validasi crop region sesuai dengan landmark.

**Dependency:** Stage 9.2 (landmark untuk crop), Stage 9.1 (embedding bisa digunakan sebagai tambahan input).

---

### Stage 9.4 — Skin Analyzer

**Objective:** Menganalisis kualitas kulit dari patch pipi.

**Deliverables:**

- Modul `backend/app/services/skin_analyzer.py`.
- Preprocessing: crop area pipi (dari landmark), konversi ke LAB color space, ekstrak fitur tekstur (LBP, GLCM) atau gunakan CNN kecil.
- Model regresi untuk: skin quality, texture, tone.
- Placeholder model (skor acak) untuk saat ini.

**Files:**

- `backend/app/services/skin_analyzer.py`
- `backend/models/skin/`

**Output:** Skor skin quality, texture, tone.

**Testing:** Crop pipi terlihat benar; output numerik.

**Dependency:** Stage 9.2 (landmark untuk crop).

---

### Stage 9.5 — Overall Attractiveness & Score Aggregation

**Objective:** Menggabungkan semua skor dari modul sebelumnya menjadi satu skor overall yang mudah dipahami.

**Deliverables:**

- Modul `backend/app/services/aggregator.py` yang menerima hasil dari geometry, region, skin analyzer dan menghitung:
  - Overall attractiveness score (rata‑rata terboboti, atau menggunakan model NIMA terpisah).
  - Confidence score untuk setiap kategori dan overall.
- Endpoint `POST /api/analyze` yang menerima gambar (atau path gambar yang sudah di‑preprocess), menjalankan seluruh pipeline analisis, dan mengembalikan JSON lengkap.

**Files:**

- `backend/app/services/aggregator.py`
- `backend/app/api/analysis.py`
- `backend/app/main.py` (tambah router)

**Output:** JSON dengan semua skor, misalnya:

```json
{
  "face_structure": { "shape": "oval", "harmony": 78, "symmetry": 85 },
  "eyes": { "size": 70, "spacing": 65, "shape": 80 },
  ...
  "overall_attractiveness": 82,
  "confidence": 0.88
}
```

**Testing:**

- Kirim gambar yang sudah di‑preprocess → dapatkan JSON dengan semua bidang terisi.
- Uji dengan gambar wajah yang berbeda dan pastikan skor bervariasi (walaupun acak).

**Dependency:** Semua Stage 9.1–9.4.

---

### Stage 9.6 — Model Training Pipeline (Optional untuk MVP)

**Objective:** Menyiapkan infrastruktur untuk melatih model‑model head di atas secara independen.

**Deliverables:**

- Skrip pelatihan terpisah di `training/` (di luar backend).
- Dataset annotation format.
- Konfigurasi training (augmentasi, loss, optimizer).

**Files:** Folder `training/` baru.

**Output:** Kemampuan untuk memperbarui model tanpa mengubah kode backend.

**Dependency:** Tidak diperlukan untuk MVP, bisa dilakukan paralel.

---

## Step 7 — Dependency Check

- **Stage 9.1** adalah fondasi semua analisis karena embedding digunakan di banyak tempat.
- **Stage 9.2** (geometry) bisa dimulai setelah kita memiliki landmark, yang sudah ada dari detector (Stage 8.1). Jadi bisa paralel dengan 9.1.
- **Stage 9.3 & 9.4** bergantung pada 9.2 untuk crop region.
- **Stage 9.5** bergantung pada semua stage sebelumnya.
- **Stage 9.6** independen, dapat dimulai kapan saja.

Urutan pengerjaan yang direkomendasikan: 9.1 → (9.2, 9.3, 9.4) → 9.5. Stage 9.6 bisa dijalankan bersamaan.

---

## Step 8 — Future Expansion

Arsitektur ini sangat modular. Penambahan fitur baru seperti Age, Gender, Emotion dapat dilakukan dengan menambah head baru yang menerima embedding atau patch spesifik. Face Recognition tinggal menggunakan embedding yang sudah ada. Hairstyle Recommendation mungkin memerlukan segmentasi rambut, yang bisa ditambahkan sebagai modul terpisah. Karena setiap modul berkomunikasi melalui interface yang jelas (embedding, landmark, patch), perubahan di satu modul tidak akan merusak yang lain.

---

## Step 9 — Engineering Review

- **Apakah mengikuti pelajaran empat repositori?** Ya: embedding dari DeepFace, backbone pretrained dari MEBeauty, distribusi opini dari Facial Beauty Prediction, dan fitur geometris dari face‑rating.
- **Apakah ada over‑engineering?** Tidak, kita memulai dengan placeholder model untuk region dan skin, hanya menyiapkan infrastruktur. Fungsionalitas penuh akan bertambah seiring ketersediaan data.
- **Apakah pipeline AI mudah dilatih?** Ya, setiap head dapat dilatih secara independen dengan dataset yang relevan.
- **Apakah preprocessing konsisten?** Sangat. Semua input ke head berasal dari pipeline preprocessing yang sama (Stage 8), sehingga tidak ada perbedaan training‑inference.
- **Apakah confidence score memiliki dasar?** Untuk model regresi, kita bisa menggunakan variance dari beberapa forward pass dengan dropout (MC Dropout). Untuk rule‑based geometry, confidence bisa berdasarkan seberapa jelas landmark terdeteksi.
- **Apakah hasil dapat dijelaskan?** Ya, setiap skor berasal dari modul yang spesifik, dan kita bisa memberikan penjelasan per kategori.
- **Apakah realistis untuk v1.0?** Dengan pendekatan bertahap dan penggunaan placeholder model, kita bisa memiliki pipeline fungsional yang menghasilkan skor (walaupun belum akurat) dan terus ditingkatkan.

**Kesimpulan:** Milestone 9 dirancang dengan arsitektur hybrid yang modular, mengadopsi praktik terbaik dari keempat repositori, dan memungkinkan pengembangan bertahap hingga mencapai akurasi tinggi untuk analisis kecantikan wajah yang komprehensif.
