# Dokumen Perencanaan Milestone 6 — Auto Capture (Workflow Fotografi Cerdas)

**Versi:** 1.0  
**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer

---

## 1. Evaluasi Deliverables Milestone 6

| Deliverable                               | Keputusan      | Alasan Teknis & Pengalaman Repositori                                                                                                                                                                       |
| ----------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Countdown**                             | ✅ Pertahankan | Memberi waktu pengguna untuk stabilisasi akhir. Durasi pendek (3 detik) sudah cukup. Semua repositori menekankan konsistensi gambar; countdown mengurangi variasi gerakan mendadak.                         |
| **Auto Capture**                          | ✅ Pertahankan | Inti milestone. Dari DeepFace dan MEBeauty: gambar diam dipilih secara otomatis setelah kondisi ideal tercapai, bukan manual. Mengurangi human error.                                                       |
| **Cancel Countdown**                      | ✅ Pertahankan | Sangat penting. Jika kualitas turun di tengah countdown, gambar yang dihasilkan tidak akan optimal. Logika pembatalan harus ketat dan instan, seperti yang diterapkan pada sistem biometrik modern (e‑KYC). |
| **Freeze Frame**                          | ✅ Pertahankan | Harus ada preview beku agar pengguna bisa menilai hasilnya. Mirip dengan preview hasil scan di aplikasi dokumen.                                                                                            |
| **Preview Image**                         | ✅ Pertahankan | Konfirmasi visual pengguna. DeepFace tidak memproses frame mentah; ia membutuhkan input gambar. Preview memungkinkan pengguna memastikan wajah tertangkap dengan baik.                                      |
| **Retake Button**                         | ✅ Pertahankan | Memberi kontrol penuh. Jika pengguna tidak puas (ekspresi, kedipan, dll.), bisa langsung mengulang tanpa harus kembali ke layar awal. UX standar aplikasi kamera.                                           |
| **Continue Button**                       | ✅ Pertahankan | Gerbang menuju milestone backend. Hanya setelah pengguna menekan "Continue", gambar dikirim untuk analisis. Ini menjaga prinsip "capture then analyze".                                                     |
| _(Tambahan)_ **Capture Source Selection** | ❌ Tunda       | Tidak perlu di Milestone 6. Kita hanya menggunakan kamera default. Jika nanti mau tambah upload gambar dari file, bisa di milestone terpisah.                                                               |
| _(Tambahan)_ **Exposure/Focus Lock**      | ❌ Tunda       | Terlalu dini. Bisa menjadi perbaikan di Milestone 12 (UI/Performance). Saat ini kamera otomatis sudah cukup baik.                                                                                           |

**Kesimpulan:** Semua deliverables asli dipertahankan. Tidak ada yang perlu dihapus atau digeser. Milestone ini sudah terdefinisi dengan baik.

---

## 2. Pemecahan Milestone 6 Menjadi Stage

### Stage 6.1 — Capture Service (Freeze Frame)

**Tujuan:**  
Menyediakan fungsi untuk mengambil frame statis dari elemen video dan mengembalikannya sebagai objek gambar (canvas/data URL).

**Alasan:**  
Memisahkan logika capture dari alur countdown dan UI. Memungkinkan pengujian independen tanpa mengganggu pipeline deteksi.

**Deliverables:**

- Modul baru `capture.js` dengan method `takeSnapshot(videoElement)` yang menghasilkan `HTMLCanvasElement`.
- Method `toDataURL()` untuk mendapatkan gambar dalam format yang bisa ditampilkan.

**Definition of Done:**

- `FaceAI.capture.takeSnapshot(video)` mengembalikan canvas yang berisi frame video saat itu.
- Canvas tidak terpengaruh oleh overlay (bounding box, countdown) karena diambil dari elemen video, bukan dari layar.

**Test:**

- Panggil `FaceAI.capture.takeSnapshot(FaceAI.ui.getVideoElement())` dari console, lalu `canvas.toDataURL()` untuk menampilkan gambar di tab baru.

**Edge Case:**

- Video belum siap (dimensi 0) → return null.

**Risiko:**

- Canvas mungkin kosong jika video tidak memiliki metadata. Kita sudah menunggu `readyState >= 2` di modul kamera, jadi aman.

**Catatan Engineering:**

- Gunakan `canvas.width = video.videoWidth; canvas.height = video.videoHeight; ctx.drawImage(video, 0, 0);`. Tidak perlu resize, agar gambar asli penuh. Resize akan dilakukan di backend.

**File yang berubah:**

- `frontend/js/modules/capture.js` (file baru)
- `frontend/index.html` – tambahkan script `capture.js`

---

### Stage 6.2 — Countdown Timer & UI

**Tujuan:**  
Menampilkan countdown visual di atas video saat status mencapai `FACE_READY`, dan membatalkannya jika kualitas turun.

**Alasan:**  
Memberi waktu pengguna untuk bersiap dan memastikan stabilitas akhir. Countdown yang terlihat jelas mengurangi ketidakpastian.

**Deliverables:**

- Elemen overlay countdown di HTML (misal, `<div id="countdown-overlay">` dengan teks besar).
- Modul `countdown.js` (atau terintegrasi ke `capture.js`) yang mendengarkan perubahan state dan mengelola timer 3 detik.
- Logika pembatalan: setiap perubahan state dari `FACE_READY` ke selain itu, countdown dibatalkan, overlay disembunyikan.
- Visual hitung mundur: "3", "2", "1" setiap detik.

**Definition of Done:**

- Saat state `FACE_READY` bertahan, countdown muncul dan berjalan dari 3 ke 1.
- Jika state berubah menjadi selain `FACE_READY` sebelum countdown selesai, overlay menghilang dan timer direset.

**Test:**

- Biarkan wajah ready → countdown muncul.
- Gerakkan wajah saat countdown → countdown batal, hilang.
- Setelah batal, kembali ready → countdown mulai dari awal (reset).

**Edge Case:**

- Koneksi lambat? Tidak relevan, semua local.
- Countdown selesai tapi tepat saat itu wajah bergerak → capture boleh gagal? Kita akan verifikasi ulang quality tepat sebelum capture. Jadi di Stage 6.3 kita cek lagi.

**Risiko:**

- Overlay countdown dapat menutupi indikator lain. Letakkan di tengah area video dengan z-index tinggi.

**File yang berubah:**

- `frontend/index.html` – tambah `<div id="countdown-overlay">`
- `frontend/css/style.css` – gaya overlay
- `frontend/js/modules/capture.js` – logika countdown
- `frontend/js/ui/ui.js` – tambah method `showCountdown`, `hideCountdown`

---

### Stage 6.3 — Auto Capture Trigger

**Tujuan:**  
Mengambil gambar secara otomatis segera setelah countdown selesai, dengan verifikasi ulang kualitas pada detik terakhir.

**Alasan:**  
Ini adalah inti milestone. Gambar diambil tanpa intervensi manual, memastikan momen yang tepat.

**Deliverables:**

- Di akhir countdown (setelah menampilkan "1" dan jeda), panggil `FaceAI.capture.takeSnapshot(videoElement)`.
- Simpan canvas hasil capture di properti internal (misal `lastCapture`).
- Hentikan loop deteksi untuk membebaskan sumber daya? Tidak perlu, kita hanya freeze tampilan. Loop deteksi tetap berjalan untuk mendeteksi perubahan (tapi video akan kita ganti dengan gambar statis di stage berikutnya).

**Definition of Done:**

- Setelah countdown habis, frame video saat itu diambil menjadi canvas.
- Canvas disimpan dan dapat diakses oleh modul lain.

**Test:**

- Saat ready, setelah countdown "3,2,1", console log atau tampilkan gambar capture.

**Edge Case:**

- Jika tepat sebelum capture kualitas turun (misal wajah hilang), countdown seharusnya sudah batal. Kita tambahkan pengecekan `FaceAI.state.is('FACE_READY')` tepat sebelum mengambil snapshot; jika tidak, batalkan capture.

**Risiko:**

- Capture mungkin mengambil frame dengan countdown masih terlihat jika timing tidak pas. Kita sembunyikan overlay countdown sebelum mengambil snapshot (delay 100ms setelah overlay hilang).

**File yang berubah:**

- `frontend/js/modules/capture.js` – trigger capture.

---

### Stage 6.4 — Preview & Confirm UI

**Tujuan:**  
Menampilkan hasil capture sebagai gambar diam, dan memberikan pilihan kepada pengguna untuk mengulangi atau melanjutkan.

**Alasan:**  
Memberi kendali penuh kepada pengguna sebelum gambar dikirim ke backend. Sesuai dengan filosofi FaceAI: human-in-the-loop.

**Deliverables:**

- Sembunyikan video stream, tampilkan canvas hasil capture di area yang sama (atau di atasnya).
- Tampilkan dua tombol: "Retake" dan "Continue".
- Tombol "Retake": menghapus preview, menampilkan kembali video stream, mengaktifkan kembali deteksi, mereset state ke `IDLE` atau langsung ke `CAMERA_READY`.
- Tombol "Continue": (untuk Milestone 7) akan men-trigger unggahan gambar. Saat ini cukup set state `CAPTURED` dan simulasikan logika lanjutan.

**Definition of Done:**

- Preview muncul, video tersembunyi, tombol berfungsi.
- Klik "Retake" → kembali ke kamera live, bisa capture lagi.
- Klik "Continue" → state `CAPTURED`, gambar siap (bisa diakses via `FaceAI.capture.getLastCapture()`).

**Test:**

- Lakukan capture, verifikasi preview, klik retake, pastikan kamera kembali normal.

**Edge Case:**

- Pengguna klik "Retake" berkali-kali → tidak ada efek negatif, hanya reset state.
- Tab tidak aktif saat preview → tidak masalah.

**File yang berubah:**

- `frontend/index.html` – tombol "Retake" dan "Continue" (disembunyikan awalnya)
- `frontend/css/style.css` – gaya tombol
- `frontend/js/ui/ui.js` – method `showPreview`, `hidePreview`, `showCaptureButtons`, dll.
- `frontend/js/modules/capture.js` – logika state dan penyimpanan hasil.

---

### Stage 6.5 — Workflow Integration & Edge Cases

**Tujuan:**  
Menggabungkan seluruh alur dari deteksi → quality → ready → countdown → capture → preview → konfirmasi, serta menangani situasi tak terduga.

**Alasan:**  
Memastikan tidak ada celah yang menyebabkan crash atau freeze.

**Deliverables:**

- Alur lengkap terintegrasi di `app.js` atau modul orchestrator kecil.
- Penanganan: kamera dicabut saat countdown, WebGL context loss, multiple faces muncul saat countdown.
- State machine diperbarui dengan state baru: `COUNTDOWN`, `CAPTURING`, `CAPTURED`.

**Definition of Done:**

- Semua test case berhasil.
- Tidak ada error console dalam skenario normal dan abnormal.

**Test:**

- Jalankan alur normal beberapa kali.
- Cabut kamera saat countdown → kembali ke IDLE.
- Munculkan dua wajah saat countdown → countdown batal.
- Tutup tab saat preview → tidak ada memory leak.

**Risiko:**

- Kompleksitas state machine meningkat. Kita akan menambah state `COUNTDOWN`, `CAPTURING`, `CAPTURED` di `state.js`. Ini perubahan terstruktur.

**File yang berubah:**

- `frontend/js/core/state.js` – tambah state baru
- `frontend/js/app.js` – koordinasi alur
- `frontend/js/modules/capture.js` – integrasi penuh

---

## 3. Urutan Pengerjaan yang Direkomendasikan

1. **6.1** – Capture service (fondasi teknis)
2. **6.2** – Countdown UI & timer (feedback pengguna)
3. **6.3** – Auto capture trigger (logika inti)
4. **6.4** – Preview & confirm UI (interaksi pengguna)
5. **6.5** – Integration & hardening (pemantapan)

Setiap stage membangun di atas stage sebelumnya secara bertahap.

---

## 4. Catatan Tambahan dari Sudut Pandang Pengguna

- **Countdown singkat (3 detik)** cukup untuk pengguna menahan posisi tanpa merasa lama.
- **Pembatalan countdown harus instan**; pengguna tidak perlu menunggu jika wajah berubah.
- **Preview harus jelas**, dengan tombol "Retake" dan "Continue" kontras. "Retake" di sebelah kiri (warna netral), "Continue" di kanan (warna hijau) mengikuti kebiasaan UI mobile.
- **Jika pengguna diam tapi countdown tidak muncul**, berarti salah satu syarat quality belum terpenuhi. Idealnya kita bisa menampilkan penyebabnya, tetapi itu sudah dicakup oleh panel debug. Untuk production nanti, akan ada indikator minimalis.
- **Tidak ada timeout paksa** setelah preview; pengguna boleh menunda selama yang diinginkan.

---

## 5. Kesimpulan

Milestone 6 akan mengubah FaceAI dari sistem deteksi pasif menjadi aplikasi yang bisa menghasilkan foto siap analisis. Dengan membagi menjadi stage kecil, kita menjaga pengembangan tetap terkendali dan setiap komponen dapat diuji secara mandiri. Seluruh desain mengikuti prinsip "Capture then Analyze" yang telah terbukti di keempat repositori acuan.

Saya menunggu persetujuan Anda untuk memulai implementasi Stage 6.1.
