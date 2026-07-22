# Milestone 8 — Face Preprocessing: Evaluasi & Perancangan

**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer

---

## Step 1 — Recall Knowledge

### Facial Beauty Prediction

- **Preprocessing pipeline:** Gambar di-resize ke 256 lalu RandomCrop 224 (training), tanpa normalisasi ImageNet (hanya ToTensor). Inkonsistensi ini dapat menurunkan akurasi model pretrained.
- **Pelajaran:** Input harus konsisten antara training dan inference. Hindari resize yang mengubah aspek rasio secara paksa (distorsi). Normalisasi harus sesuai dengan yang diharapkan model.

### face‑rating

- **Preprocessing:** Mengandalkan 68 landmark wajah untuk menghitung 11.628 fitur geometris. Landmark hanya akurat jika wajah sudah di-align dan di-crop dengan baik.
- **Pelajaran:** Alignment yang presisi adalah kunci untuk fitur geometris yang andal. Crop menghilangkan background dan fokus pada wajah.

### MEBeauty

- **Backend preprocessing:** Face crop & alignment menggunakan DeepFace (MTCNN/RetinaFace) sebelum ekstraksi fitur atau inferensi. Menekankan konsistensi preprocessing karena model dilatih dengan data yang sudah di-crop dan di-align.
- **Pelajaran penting:** Preprocessing bukan sekadar langkah opsional—ia menentukan apakah model menerima input yang valid dan seragam. Tanpa alignment yang baik, distribusi data inference akan berbeda dengan training, merusak akurasi.

### DeepFace

- **Pipeline:** Detect → Align → Normalize → Represent → Verify/Analyze
- **Mengapa alignment wajib:** Mengurangi variasi pose dan rotasi, sehingga embedding wajah menjadi lebih diskriminatif. DeepFace melaporkan peningkatan akurasi 6% hanya dari alignment.
- **Mengapa crop wajib:** Memfokuskan model hanya pada wajah, bukan latar belakang. Mencegah model belajar dari noise.
- **Mengapa resize wajib:** Model memerlukan ukuran input tetap. DeepFace menggunakan resize dengan padding (letterboxing) untuk mempertahankan aspek rasio, menghindari distorsi.
- **Mengapa normalisasi wajib:** Setiap model pretrained memiliki ekspektasi rentang nilai tertentu (mis. mean subtraction). Tanpa normalisasi yang tepat, fitur tidak akan optimal.

---

## Step 2 — Ingat Tujuan FaceAI

Frontend hanya bertugas menghasilkan foto terbaik. **Semua preprocessing sekarang dilakukan di backend.** Tujuan Milestone 8 adalah mengubah gambar mentah yang diunggah menjadi satu gambar wajah yang siap dijadikan input model AI.

---

## Step 3 — Evaluasi Milestone 8

Pipeline yang diberikan:

```
Image → Face Detection → Face Alignment → Crop Face → Resize → Normalize → Ready For AI
```

**Apakah pipeline sudah benar?** Ya, ini adalah urutan standar yang digunakan DeepFace dan MEBeauty. Namun ada beberapa tambahan yang diperlukan agar benar‑benar production‑ready:

1. **Validation/Quality Gate** – Setelah detection, kita harus memastikan bahwa wajah terdeteksi dengan confidence tinggi, hanya satu wajah (atau pilih yang primer), dan pose tidak ekstrem. Jika tidak, tolak gambar tersebut dan beri tahu frontend.
2. **Letterboxing / Aspect Ratio Preservation** – DeepFace menggunakan resize dengan padding untuk menjaga proporsi wajah. Distorsi akibat resize paksa akan merusak embedding dan prediksi. Ini penting untuk diadopsi.
3. **Color Space Conversion** – Model tertentu (seperti VGG‑Face) mengharapkan input BGR, sementara yang lain RGB. Kita perlu menyimpan informasi ini sebagai bagian dari normalisasi.
4. **Landmark Extraction** – Diperlukan untuk alignment (berdasarkan posisi mata). Kita sudah memiliki landmark dari BlazeFace di frontend, tetapi backend sebaiknya melakukan deteksi ulang dengan model yang lebih akurat (misalnya RetinaFace atau MTCNN) untuk mendapatkan landmark yang presisi.

**Apakah ada langkah yang berlebihan?** Saat ini tidak; semua langkah di atas memiliki tujuan jelas dan diadopsi dari repositori referensi.

---

## Step 4 — Review Pipeline

Saya mengusulkan pipeline yang sedikit disempurnakan:

```
Uploaded Image
    │
    ▼
Validation (format, size, corruption)
    │
    ▼
Face Detection (with confidence & landmarks)
    │
    ▼
Face Alignment (rotation based on eye landmarks)
    │
    ▼
Face Crop (expanded bounding box)
    │
    ▼
Resize with Letterboxing (preserve aspect ratio)
    │
    ▼
Normalization (model‑specific: mean/std or [0,1])
    │
    ▼
Ready for AI (standardized tensor/array)
```

**Penjelasan tambahan:**

- **Validation** di awal mencegah file corrupt atau tanpa wajah diproses.
- **Letterboxing** alih‑alih resize paksa akan membuat input lebih stabil, sesuai dengan praktik DeepFace.
- **Normalization** akan disesuaikan dengan model AI yang akan digunakan nanti; untuk sekarang kita siapkan modul yang mudah dikonfigurasi.

---

## Step 5 — Pemecahan Menjadi Stage

### Stage 8.1 — Backend Setup & Detector Module

**Objective:** Menyiapkan environment backend untuk image processing (OpenCV, InsightFace/DeepFace) dan membuat modul deteksi wajah yang bisa dipanggil.

**Deliverables:**

- Instalasi `opencv-python-headless`, `insightface` (atau `deepface`), `onnxruntime`.
- Modul `backend/app/services/detector.py` dengan fungsi `detect(image) -> [FaceObject]` (bbox, confidence, landmarks).
- Konfigurasi model deteksi (misal RetinaFace atau SCRFD) di `config.py`.

**Files yang berubah:**

- `backend/requirements.txt`
- `backend/app/services/detector.py`
- `backend/app/core/config.py`

**Output:** Panggil `detect()` dengan gambar uji → dapatkan bounding box dan landmark.

**Testing:**

- Input: gambar wajah frontal → output: 1 wajah dengan confidence > 0.9.
- Input: gambar tanpa wajah → output: list kosong.
- Input: gambar multi‑wajah → output: beberapa wajah.

**Dependency:** Stage 7.5 (backend logging & config sudah siap).

---

### Stage 8.2 — Face Validation & Selection

**Objective:** Setelah deteksi, validasi apakah ada wajah yang memenuhi syarat, dan pilih satu wajah primer jika lebih dari satu.

**Deliverables:**

- Modul `backend/app/services/validator.py` dengan fungsi `validate_faces(faces) -> primary_face`.
- Rule: minimal confidence 0.9, landmark mata tersedia, ukuran wajah minimal 100px.
- Jika tidak ada yang valid, raise `ValidationError`.

**Files:**

- `backend/app/services/validator.py`
- `backend/app/exceptions.py` (custom exception)

**Output:** Dari hasil deteksi, terpilih satu objek wajah yang siap diproses.

**Testing:**

- Berikan dua wajah (satu kecil, satu besar) → pilih yang besar.
- Berikan satu wajah blur / low confidence → tolak.
- Berikan gambar tanpa wajah → tolak dengan error jelas.

**Dependency:** Stage 8.1 (detector berfungsi).

---

### Stage 8.3 — Alignment & Crop

**Objective:** Meluruskan wajah berdasarkan posisi mata, kemudian crop area wajah yang sudah di‑align.

**Deliverables:**

- Modul `backend/app/services/aligner.py` dengan fungsi `align_face(image, landmarks) -> aligned_face`.
- Modul `backend/app/services/cropper.py` dengan fungsi `crop_face(image, bbox) -> cropped_face`.
- Algoritma alignment: hitung sudut rotasi dari mata kiri & kanan, rotasi, lalu crop bounding box yang diperluas.

**Files:**

- `backend/app/services/aligner.py`
- `backend/app/services/cropper.py`

**Output:** Wajah tegak dengan latar belakang minimal.

**Testing:**

- Uji dengan gambar wajah miring 30° → hasil wajah lurus, mata horizontal.
- Uji dengan wajah di pojok gambar → hasil crop tepat di wajah, bukan area kosong.

**Dependency:** Stage 8.2 (validator memberikan primary face dengan landmarks & bbox).

---

### Stage 8.4 — Resize & Normalization

**Objective:** Mengubah ukuran gambar menjadi dimensi tetap dengan tetap menjaga aspek rasio (letterboxing), lalu menormalisasi nilai piksel sesuai kebutuhan model.

**Deliverables:**

- Modul `backend/app/services/resizer.py` dengan fungsi `resize_letterbox(image, target_size) -> resized`.
- Modul `backend/app/services/normalizer.py` dengan fungsi `normalize(image, mode) -> normalized`.
- Mode normalisasi: "base" [0,1], "vggface" (mean subtraction BGR), "facenet" (per‑sample standardization), dll.

**Files:**

- `backend/app/services/resizer.py`
- `backend/app/services/normalizer.py`

**Output:** Gambar berukuran tepat (misal 224x224) dengan piksel dalam rentang yang diharapkan model.

**Testing:**

- Input gambar portrait → output persegi dengan padding hitam di kiri/kanan, tanpa distorsi.
- Uji mode normalisasi yang berbeda; periksa rentang nilai piksel hasil.

**Dependency:** Stage 8.3 (gambar sudah di‑crop).

---

### Stage 8.5 — Pipeline Integration & API Endpoint

**Objective:** Menggabungkan semua langkah menjadi satu pipeline yang dapat dipanggil dari endpoint `/api/preprocess`, menghasilkan gambar siap AI.

**Deliverables:**

- Modul `backend/app/services/preprocessing.py` yang mengorkestrasi: validasi → deteksi → alignment → crop → resize → normalisasi.
- Endpoint `POST /api/preprocess` yang menerima file gambar, menjalankan pipeline, dan mengembalikan gambar hasil preprocessing (atau menyimpannya dan mengembalikan path).
- Response JSON berisi path gambar hasil atau error detail.

**Files:**

- `backend/app/services/preprocessing.py`
- `backend/app/api/preprocessing.py`
- `backend/app/main.py` (tambah router)

**Output:** Kirim gambar via API → dapatkan gambar wajah yang sudah siap untuk AI.

**Testing:**

- Kirim gambar hasil capture dari frontend → dapatkan gambar wajah 224x224 yang tegak, tajam, dan ternormalisasi.
- Kirim gambar tanpa wajah → error 422.
- Kirim gambar dengan dua wajah → hanya satu wajah yang diproses (primer).

**Dependency:** Semua stage sebelumnya (8.1–8.4).

---

## Step 6 — Dependency Check

- **Stage 8.1** adalah fondasi; semua stage lain bergantung padanya.
- **Stage 8.2** membutuhkan 8.1 (detector).
- **Stage 8.3** membutuhkan 8.2 (face object tervalidasi).
- **Stage 8.4** membutuhkan 8.3 (gambar ter‑crop).
- **Stage 8.5** membutuhkan 8.1–8.4.

Urutan pengerjaan harus linier: 8.1 → 8.2 → 8.3 → 8.4 → 8.5.

---

## Step 7 — Engineering Review

- **Apakah preprocessing production‑ready?** Ya, setiap langkah mengikuti best practice dari DeepFace dan MEBeauty. Pipeline ini akan menghasilkan input yang konsisten.
- **Apakah modular?** Setiap langkah adalah modul terpisah yang bisa diuji secara independen. Jika nanti kita ganti model AI, normalizer bisa diubah tanpa menyentuh bagian lain.
- **Apakah bisa digunakan kembali?** Ya, pipeline ini akan menjadi fondasi untuk semua model AI FaceAI (beauty scoring, recognition, atribut).
- **Apakah konsisten antara training dan inference?** Ya, karena backend akan menerapkan preprocessing yang sama persis seperti yang digunakan saat melatih model. (Untuk model yang belum kita latih, kita dokumentasikan normalisasi yang dipilih.)
- **Apakah ada over‑engineering?** Tidak, setiap langkah memiliki justifikasi teknis yang jelas dari repositori referensi.
- **Apakah ada langkah yang tidak perlu?** Saat ini tidak. Semua langkah (validasi, deteksi, alignment, crop, resize, normalisasi) diperlukan untuk menghasilkan input AI yang berkualitas.

**Kesimpulan:** Milestone 8 dirancang mengikuti cetak biru pipeline DeepFace, diperkuat dengan pembelajaran dari MEBeauty, face‑rating, dan Facial Beauty Prediction. Dengan membagi ke dalam 5 stage kecil, kita dapat membangun fondasi backend AI FaceAI secara bertahap, teruji, dan siap mendukung Milestone 9 (AI Face Analysis).
