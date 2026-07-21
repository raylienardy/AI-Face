## 2. Pemecahan Milestone 5 Menjadi Stage

### Stage 5.1 — Face Data Extraction & Landmark Activation

**Tujuan:**  
Menyediakan data mentah (bounding box, confidence, landmark) dari hasil deteksi untuk digunakan oleh modul quality assessment.

**Alasan:**  
Semua pemeriksaan quality membutuhkan informasi area wajah, posisi, dan landmark. Stage ini memastikan data tersedia tanpa mengubah perilaku deteksi secara fundamental.

**Deliverables:**

- `detection.js` menyediakan callback baru `onFaceData` (atau mengembalikan data via event) yang berisi `{ bbox, confidence, landmarks }` untuk wajah primer.
- `config.js` menambahkan `DETECTION_OUTPUT_LANDMARKS: true`.
- `quality.js` (modul baru) menerima data wajah dan memulai pipeline penilaian.

**Definition of Done:**

- Setiap frame, data wajah primer (bbox + landmark) dapat diakses oleh modul lain.
- Tidak ada perubahan visual pada bounding box atau UI.

**Test:**

- Console log data wajah (bbox, landmarks) setiap frame.

**Edge Case:**

- Jika landmark tidak tersedia (BlazeFace tidak mengeluarkan), objek landmarks bernilai `null`.

**Risiko:**

- Aktifasi `outputLandmarks` sedikit menambah beban komputasi; tidak signifikan karena model tetap ringan.

**Catatan Engineering:**

- Data wajah akan dikirim melalui mekanisme observer atau fungsi `onFaceData` yang dipanggil di dalam `onResults`. Tidak mengubah state machine.

**File yang berubah:**

- `frontend/js/modules/detection.js` – mengekspos data wajah dan mengaktifkan landmark.
- `frontend/js/core/config.js` – menambahkan `DETECTION_OUTPUT_LANDMARKS`.
- `frontend/js/modules/quality.js` – file baru (placeholder untuk stage berikutnya).

---

### Stage 5.2 — Face Position & Size Check

**Tujuan:**  
Memeriksa apakah wajah berada di tengah frame dan ukurannya sesuai (tidak terlalu kecil/besar).

**Alasan:**  
Posisi dan ukuran adalah syarat paling dasar untuk crop yang baik. Tanpa ini, backend akan menerima gambar yang mungkin terpotong atau terlalu rendah resolusinya.

**Deliverables:**

- Fungsi `checkPosition(bbox, videoWidth, videoHeight)` mengembalikan `{ centered: bool, tooHigh: bool, tooLow: bool }`.
- Fungsi `checkSize(bbox, videoHeight)` mengembalikan `{ tooSmall: bool, tooClose: bool, good: bool }`.
- Integrasi ke `quality.js` untuk menggabungkan hasil.

**Definition of Done:**

- Wajah di tengah (toleransi ±15% dari pusat) → `centered = true`.
- Tinggi bounding box antara 30%–70% tinggi video → `good = true`.

**Test:**

- Gerakkan wajah ke kiri/kanan/atas/bawah, amati flag.
- Dekatkan/jauhkan wajah, amati flag ukuran.

**Edge Case:**

- Wajah sangat dekat sehingga bounding box melebihi frame → `tooClose = true`.
- Wajah terlalu jauh sehingga tinggi < 20% frame → `tooSmall = true`.

**Risiko:**

- Threshold perlu dikalibrasi; akan diatur di `config.js` untuk kemudahan penyesuaian.

**File yang berubah:**

- `frontend/js/modules/quality.js` – implementasi fungsi.
- `frontend/js/core/config.js` – tambah `MIN_FACE_HEIGHT_RATIO`, `MAX_FACE_HEIGHT_RATIO`, `CENTER_TOLERANCE`.

---

### Stage 5.3 — Lighting Check

**Tujuan:**  
Memastikan pencahayaan pada area wajah tidak terlalu gelap atau terlalu terang.

**Alasan:**  
Pencahayaan ekstrem menghilangkan detail wajah, membuat analisis beauty tidak akurat.

**Deliverables:**

- Fungsi `checkLighting(video, bbox)` yang mengambil rata‑rata intensitas piksel di area wajah (grayscale). Mengembalikan `{ tooDark: bool, tooBright: bool, good: bool }`.

**Definition of Done:**

- Rata‑rata intensitas antara 40–220 (dari 255) → `good`.
- Di luar rentang tersebut → peringatan.

**Test:**

- Sorotkan cahaya terang ke wajah → `tooBright`.
- Tutup lampu → `tooDark`.

**Edge Case:**

- Area wajah kecil mungkin memberikan rata‑rata tidak representatif. Gunakan sample piksel yang cukup (misal, ambil 100 titik acak di dalam bbox untuk efisiensi).

**Risiko:**

- Bisa false positive jika latar belakang sangat kontras tapi area wajah normal. Fokus hanya pada piksel di dalam bounding box.

**File yang berubah:**

- `frontend/js/modules/quality.js` – tambah fungsi.
- `frontend/js/core/config.js` – tambah `MIN_BRIGHTNESS`, `MAX_BRIGHTNESS`.

---

### Stage 5.4 — Blur Check

**Tujuan:**  
Mendeteksi apakah wajah tampak blur (tidak tajam).

**Alasan:**  
Gambar blur menyebabkan landmark tidak akurat dan analisis tekstur gagal.

**Deliverables:**

- Fungsi `checkBlur(video, bbox)` yang menghitung varians Laplacian pada area wajah (grayscale). Mengembalikan `{ blurry: bool, sharp: bool }`.

**Definition of Done:**

- Varians Laplacian < threshold → `blurry`.

**Test:**

- Goyangkan kepala cepat → `blurry`.
- Diam → `sharp`.

**Edge Case:**

- Wajah terlalu kecil → varians tidak valid. Jika tinggi bbox < 100px, lewati pemeriksaan atau langsung anggap blur.

**File yang berubah:**

- `frontend/js/modules/quality.js` – tambah fungsi.
- `frontend/js/core/config.js` – tambah `BLUR_THRESHOLD`.

---

### Stage 5.5 — Stability Check

**Tujuan:**  
Memastikan wajah tidak banyak bergerak (stabil) selama beberapa frame.

**Alasan:**  
Gerakan menyebabkan motion blur dan menyulitkan auto‑capture. Stabilitas juga indikasi pengguna siap.

**Deliverables:**

- Buffer posisi wajah (pusat x,y) dari N frame terakhir.
- Fungsi `checkStability(centerX, centerY)` yang menghitung deviasi standar atau jarak maksimum. Mengembalikan `{ stable: bool, moving: bool }`.

**Definition of Done:**

- Jika pergerakan pusat wajah < 5% lebar frame selama 10 frame berturut‑turut → `stable`.

**Test:**

- Gerakkan kepala perlahan → tidak stabil.
- Tahan posisi → stabil setelah 10 frame.

**Edge Case:**

- Perubahan ukuran bounding box juga bisa dianggap gerakan, tapi untuk sederhana kita hanya lacak pusat.

**File yang berubah:**

- `frontend/js/modules/quality.js` – buffer dan fungsi stabilitas.
- `frontend/js/core/config.js` – `STABILITY_FRAME_COUNT`, `STABILITY_MOVEMENT_THRESHOLD`.

---

### Stage 5.6 — Visibility Check (Landmark‑Based)

**Tujuan:**  
Memastikan fitur wajah utama (mata, hidung, mulut) terlihat.

**Alasan:**  
Jika fitur terhalang (rambut, masker, kacamata hitam), analisis beauty tidak mungkin dilakukan.

**Deliverables:**

- Fungsi `checkVisibility(landmarks)` yang memeriksa apakah landmark mata kiri, kanan, hidung, dan mulut ada dan tidak null. Mengembalikan `{ eyesVisible, noseVisible, mouthVisible }`.

**Definition of Done:**

- Landmark mata kiri (indeks 0) dan kanan (1) terdefinisi → eyesVisible.
- Landmark hidung (2) → noseVisible.
- Landmark mulut (3) → mouthVisible.

**Test:**

- Tutup mata dengan tangan → eyesVisible false.
- Pakai masker → mouthVisible false.

**Edge Case:**

- BlazeFace mungkin tidak memberikan landmark sama sekali; maka semua false.

**Risiko:**

- Landmark bisa tidak akurat; kita tidak memvalidasi posisi, hanya keberadaan.

**File yang berubah:**

- `frontend/js/modules/quality.js` – implementasi.
- Tidak perlu tambahan config.

---

### Stage 5.7 — Quality Aggregator & Visual Feedback

**Tujuan:**  
Menggabungkan semua pemeriksaan, menentukan apakah wajah "Ready to Capture", dan menampilkan indikator visual kepada pengguna.

**Alasan:**  
Pengguna perlu tahu apa yang harus diperbaiki sebelum countdown dimulai (M6). Ini juga menjadi sinyal resmi ke state machine bahwa kualitas terpenuhi.

**Deliverables:**

- Fungsi `assessQuality(faceData)` yang menjalankan semua checker dan menghasilkan objek `{ ready: bool, checks: {...} }`.
- Modul `quality.js` memperbarui UI dengan indikator per parameter (misal, ikon centang/silang di area status).
- State machine bertransisi ke `FACE_READY` jika semua syarat terpenuhi, jika tidak tetap `FACE_FOUND`.
- Jika multiple faces terdeteksi (`FaceAI.detection.hasMultipleFaces()`), otomatis tidak ready.

**Definition of Done:**

- Semua parameter hijau → indikator "Ready" muncul, state `FACE_READY`.
- Satu saja merah → indikator "Not Ready", state tetap `FACE_FOUND`.

**Test:**

- Penuhi semua syarat → "Ready".
- Buat salah satu gagal (misal terlalu gelap) → "Not Ready", periksa parameter yang gagal.

**Edge Case:**

- Transisi cepat antara ready dan not ready bisa menyebabkan flicker. Akan ditambahkan debounce sederhana (misal, harus stabil 0.5 detik dalam status ready).

**Risiko:**

- UI tambahan mungkin memerlukan penyesuaian layout; kita akan menambah elemen di bawah status indicator.

**File yang berubah:**

- `frontend/js/modules/quality.js` – agregator dan pemanggilan UI.
- `frontend/js/ui/ui.js` – tambah method untuk menampilkan quality status.
- `frontend/index.html` – mungkin tambah div untuk quality checklist.
- `frontend/css/style.css` – gaya untuk checklist.

---
