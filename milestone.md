# FaceAI Development Milestones

> Versi 0.1 – Roadmap dari deteksi wajah hingga rilis v1.0  
> Status: ⬜ Planned | 🟡 In Progress | ✅ Completed

---

## Milestone 4 — Face Detection & Alignment

**Status:** ⬜ Planned

### Tujuan

Mendeteksi wajah secara real-time dari webcam serta menyelaraskan posisi wajah (alignment) untuk mendapatkan orientasi yang konsisten.

### Teknologi

- MediaPipe Face Detection (BlazeFace short‑range)
- Canvas API (bounding box)

### Deliverables

- [ ] Load model AI (BlazeFace via CDN)
- [ ] Start/Stop detection
- [ ] Bounding box real‑time (koordinat relatif → persentase)
- [ ] Multiple face detection (minimal threshold)
- [ ] Confidence score untuk setiap deteksi
- [ ] Face alignment berdasarkan 6‑titik landmark (rotasi mata)
- [ ] Indikator status wajah pada UI (abu‑abu / hijau)

### Folder yang Berubah

```

frontend/
js/
modules/
detection.js (baru)
ui/
drawing.js (update)
core/
state.js (tambah state DETECTING, FACE_FOUND)

```

### Output

- Kotak pembatas muncul mengelilingi wajah yang terdeteksi.
- Wajah terorientasi tegak (alignment aktif).
- Indikator `Face` berubah hijau saat wajah terdeteksi.

### Catatan Teknis

- BlazeFace menyediakan landmark mata sehingga rotasi dapat dihitung tanpa detektor tambahan (berdasarkan pengalaman DeepFace: alignment +6% akurasi).
- Gunakan `object-fit: cover` pada video karena FaceAI berfokus pada wajah, bukan latar belakang.
- Threshold confidence default 0.5; dapat disesuaikan di `config.js`.

---

## Milestone 5 — Face Quality Assessment

**Status:** ⬜ Planned

### Tujuan

Menentukan apakah kualitas wajah yang terdeteksi memenuhi syarat untuk di‑capture.

### Parameter yang Dicek

- Posisi wajah (center of frame)
- Ukuran wajah (min/maks persentase dari tinggi frame)
- Rotasi kepala (sudut yaw/pitch kasar dari landmark)
- Blur detection (Laplacian variance)
- Pencahayaan (rata‑rata brightness)
- Stabilitas (perubahan posisi antar frame)

### Deliverables

- [ ] Module `quality.js` berisi fungsi evaluasi
- [ ] Indikator real‑time: posisi, ukuran, blur, cahaya
- [ ] Feedback visual langsung di UI (ikon warning/check)
- [ ] State transisi: `FACE_STABLE` → `READY_TO_CAPTURE`

### Folder yang Berubah

```

frontend/
js/
modules/
quality.js (baru)
ui/
ui.js (tambah elemen feedback)
core/
state.js (tambah state baru)

```

### Output

Sistem dapat memberi tahu pengguna kapan wajah sudah ideal untuk pengambilan gambar.

### Catatan Teknis

- Blur detection dengan varian Laplacian (>100 dianggap tajam, berdasarkan eksperimen MEBeauty/face-rating).
- Pencahayaan minimum 80 (dari 255) untuk menghindari underexposure.
- Toleransi kemiringan ≤15° agar embedding konsisten.

---

## Milestone 6 — Auto Capture

**Status:** ⬜ Planned

### Tujuan

Mengambil gambar secara otomatis begitu kualitas wajah dinyatakan ideal.

### Deliverables

- [ ] Countdown timer (3 detik, tampil di UI)
- [ ] Auto capture saat countdown selesai
- [ ] Cancel countdown jika kualitas turun
- [ ] Snapshot dari video (canvas → data URL)
- [ ] Preview hasil capture (overlay)
- [ ] Tombol retake / save

### Folder yang Berubah

```

frontend/
js/
modules/
capture.js (baru)
ui/
ui.js (tambah preview & countdown)

```

### Output

Pengguna tidak perlu menekan tombol capture; sistem melakukannya otomatis.

### Catatan Teknis

- Gunakan `ctx.drawImage(video, 0, 0)` pada canvas tersembunyi untuk mengambil frame resolusi asli.
- Countdown harus dibatalkan jika wajah tidak stabil (gerakan > threshold) atau metrik lain turun di bawah ambang.

---

## Milestone 7 — Backend Integration

**Status:** ⬜ Planned

### Tujuan

Menghubungkan frontend dengan backend FastAPI.

### Deliverables

- [ ] Endpoint `/health` (sudah ada)
- [ ] Endpoint `POST /api/upload` terima gambar (multipart)
- [ ] Koneksi dari frontend (`fetch` / `axios`)
- [ ] JSON response standar (`{ status, data, error }`)
- [ ] Error handling (network error, timeout, server error)

### Folder yang Berubah

```

backend/
app/
api/
upload.py (baru)
frontend/
js/
core/
api.js (baru)

```

### Output

Frontend dapat mengirimkan gambar wajah ke backend dan menerima respons.

---

## Milestone 8 — Face Registration

**Status:** ⬜ Planned

### Tujuan

Mendaftarkan identitas pengguna beserta gambar wajah ke dalam dataset.

### Deliverables

- [ ] Form input nama (frontend)
- [ ] Kirim gambar + nama ke backend
- [ ] Backend: simpan metadata (JSON) + gambar di `datasets/person_xxxx/`
- [ ] Generate ID unik (`person_000001`, …)
- [ ] Response berisi ID & status sukses

### Backend

FastAPI, SQLite (opsional untuk indeks), file system untuk gambar.

### Output

Dataset wajah mulai terbentuk dengan struktur yang terorganisir.

### Catatan Teknis

- Struktur dataset mengikuti SDD: `person_id/capture_xxx.jpg` + `metadata.json`.
- Metadata mencakup timestamp, kualitas capture, kondisi pencahayaan, dll.

---

## Milestone 9 — Face Recognition

**Status:** ⬜ Planned

### Tujuan

Mengenali identitas seseorang dengan membandingkan embedding wajah.

### AI

Backend: InsightFace (buffalo_l) atau DeepFace (VGG‑Face) → ekstraksi embedding 512‑d / 4096‑d.

### Deliverables

- [ ] Ekstraksi embedding wajah (backend)
- [ ] Simpan embedding ke database / file
- [ ] Bandingkan embedding (cosine, euclidean)
- [ ] Pre‑tuned threshold per metrik
- [ ] Confidence scoring (0–100) menggunakan regresi logistik (opsional)
- [ ] Return prediksi: nama, similarity, confidence

### Folder yang Berubah

```

backend/
app/
services/
recognition.py (baru)
models/ (tempat model InsightFace)

```

### Output

Sistem dapat mengenali pengguna yang sudah terdaftar.

### Catatan Teknis

- Pipeline recognition mengadopsi DeepFace: detect → align → normalize → embed → distance → threshold → confidence.
- L2 normalization embedding wajib agar jarak euclidean valid.
- Confidence score memudahkan pengguna memahami tingkat keyakinan.

---

## Milestone 10 — Dataset Management

**Status:** ⬜ Planned

### Tujuan

Mengelola dataset wajah (tambah, hapus, sunting, cari).

### Deliverables

- [ ] API list semua person
- [ ] API get detail person (metadata + gambar)
- [ ] API hapus person
- [ ] API rename person
- [ ] API search by name
- [ ] Dataset statistics (jumlah person, total gambar)

### Output

Admin atau developer dapat mengelola dataset dengan mudah.

---

## Milestone 11 — UI Polish

**Status:** ⬜ Planned

### Tujuan

Meningkatkan kualitas antarmuka agar terlihat profesional.

### Deliverables

- [ ] Layout responsif (mobile‑friendly)
- [ ] Tipografi lebih baik (ukuran, spacing)
- [ ] Warna konsisten (palette modern)
- [ ] Animasi loading, sukses, error
- [ ] Empty state (belum ada data, belum ada wajah)
- [ ] Pesan error yang informatif
- [ ] Tampilan preview capture lebih halus

### Output

Aplikasi terlihat layak untuk demo atau portofolio.

---

## Milestone 12 — Performance Optimization

**Status:** ⬜ Planned

### Tujuan

Memastikan aplikasi berjalan ringan dan stabil.

### Deliverables

- [ ] Batasi FPS deteksi (pakai `DETECTION_INTERVAL_MS`)
- [ ] Optimasi canvas (hapus dan gambar ulang hanya jika perlu)
- [ ] Memory leak check (hentikan stream saat tidak aktif)
- [ ] Lazy loading model (muat hanya setelah izin kamera)
- [ ] Cache model (hindari unduh berulang)

### Output

Aplikasi berjalan stabil tanpa lag, bahkan di laptop menengah.

---

## Milestone 13 — Documentation

**Status:** ⬜ Planned

### Tujuan

Melengkapi dokumentasi teknis agar proyek mudah dipahami dan dikembangkan.

### Deliverables

- [ ] `README.md` (deskripsi, setup, penggunaan)
- [ ] `ARCHITECTURE.md` (diagram, alur data)
- [ ] `API.md` (daftar endpoint, request/response)
- [ ] `PROJECT_STRUCTURE.md`
- [ ] `ENVIRONMENT.md` (cara setup environment)
- [ ] Panduan developer (how to contribute)

### Output

Developer baru dapat menjalankan dan mengembangkan FaceAI dalam waktu singkat.

---

## Milestone 14 — Release v1.0

**Status:** ⬜ Planned

### Tujuan

Menyiapkan rilis stabil pertama.

### Deliverables

- [ ] Bug fixing (semua issue yang diketahui)
- [ ] Code cleanup (hapus console.log, komentar tidak perlu)
- [ ] Final testing (semua milestone terintegrasi)
- [ ] Git tag `v1.0.0`
- [ ] Release notes (fitur, perbaikan)
- [ ] Demo video / screenshot

### Output

FaceAI v1.0 siap dipublikasikan.

---

## Referensi Teknis

Seluruh keputusan di atas didasari oleh pembelajaran dari tiga repositori yang telah dianalisis:

1. **Facial Beauty Prediction** – Penggunaan EMD loss, distribusi rating, backbone pretrained.
2. **face-rating** – Feature engineering geometris (rasio landmark), PCA+SVR, CNN regresi.
3. **MEBeauty** – Multi‑ethnic dataset, pipeline crop+align, ekstraksi embedding FaceNet, bug normalisasi.
4. **DeepFace** – Blueprint face recognition lengkap: deteksi, alignment, normalisasi, threshold tuning, confidence calibration.
