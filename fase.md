# Rencana Fase: User-Friendly UI & Developer Mode

Kita akan mengubah tampilan FaceAI menjadi dua mode: **Normal** (pengguna awam) dan **Developer** (Founder). Fase-fase berikut memastikan implementasi bertahap, mudah diuji, dan tidak merusak fungsionalitas yang sudah berjalan.

---

## Fase 12.8 – Menyederhanakan Tampilan Normal (Hide Debug Elements)

**Objective:**  
Menyembunyikan semua elemen teknis/debug dari pengguna biasa. Hanya menampilkan alur intuitif: kamera → countdown → capture → preview → hasil akhir.

**Mengapa diperlukan:**  
Pengguna akhir hanya peduli pada skor kecantikan, bukan detail quality check atau alignment. Tampilan harus fokus dan tidak membingungkan.

**Apa yang akan diubah:**

- Sembunyikan secara default: `#quality-debug`, `#align-preview`, `#ready-indicator` (atau hanya tampilkan indikator singkat), `#backend-status`, `#status-backend`, `#status-camera` (cukup indikator Face tetap).
- Bounding box tetap ada sebagai feedback visual, tetapi bisa diatur propertinya (misal lebih tipis, warna lebih halus) – opsional.
- Tombol "View History" tetap ada, tetapi panel history tetap sederhana.
- **Tidak ada perubahan pada logika JS**, hanya visibility CSS atau penghapusan dari DOM dengan class.

**Deliverables:**

- CSS class `.dev-only` untuk elemen yang hanya muncul di mode developer.
- Di `ui.js`, tambahkan fungsi `setDevMode(bool)` yang menambahkan/menghapus class pada container utama (`body`) atau elemen spesifik.
- Default: `body.dev-mode` tidak ada → elemen debug tersembunyi.

**Testing:**

- Buka aplikasi tanpa mode developer → pastikan quality debug, alignment preview, ready indicator tidak terlihat.
- Lakukan capture hingga laporan muncul → hanya lihat kamera, countdown, preview, tombol, dan laporan akhir.
- History panel tetap berfungsi seperti biasa (tidak tersembunyi).

**Dependency:** Tidak ada, dapat dikerjakan langsung.

---

## Fase 12.9 – Mekanisme Aktivasi Mode Developer

**Objective:**  
Menyediakan cara rahasia bagi Founder untuk mengaktifkan mode developer, yang akan menampilkan semua elemen debug dan informasi teknis.

**Mengapa diperlukan:**  
Founder perlu mengakses data rinci untuk debugging dan pengembangan, tetapi pengguna biasa tidak boleh mengaksesnya.

**Apa yang akan diubah:**

- Tambahkan event listener di `app.js` untuk mendeteksi kombinasi tombol `Ctrl+Shift+D`. Saat ditekan, toggle mode developer.
- Simpan status di `localStorage` dengan key `faceai_dev_mode` agar persisten.
- Saat mode aktif:
  - Tambahkan class `dev-mode` pada `<body>`.
  - Tampilkan semua elemen `.dev-only` (quality debug, alignment preview, status backend/camera, ready indicator verbose, mungkin tambahan info skor detail di laporan).
  - Tampilkan toast notifikasi kecil: "Developer mode enabled".
- Saat mode nonaktif, hapus class dan sembunyikan kembali.
- Alternatif akses: jika pengguna mencoba mengakses dengan parameter URL `?dev`, hanya berfungsi jika `localStorage` sudah diaktifkan sebelumnya (agar tidak mudah ditebak). Untuk kemudahan, cukup kombinasi tombol.

**Deliverables:**

- Modifikasi `app.js` (atau file baru `devmode.js`) yang menangani logika toggle.
- Modifikasi `ui.js`: fungsi `setDevMode(bool)` yang mengatur class `body.dev-mode`.
- CSS: tampilkan `.dev-only` hanya saat `body.dev-mode`.

**Testing:**

- Buka aplikasi, tekan `Ctrl+Shift+D` → toast muncul, elemen debug tampil.
- Refresh halaman → mode developer tetap aktif (dari localStorage).
- Tekan lagi → mode mati, elemen hilang.
- Coba akses tanpa kombinasi, pastikan elemen debug tidak bisa dimunculkan.

**Dependency:** Fase 12.8 (elemen sudah diberi class `.dev-only`).

---

## Fase 12.10 – Perbaikan Tampilan Laporan untuk Pengguna Awam

**Objective:**  
Menyajikan hasil analisis dengan cara yang menarik, ringkas, dan mudah dipahami: skor utama besar, strengths/suggestions jelas, tanpa detail per fitur yang membingungkan.

**Mengapa diperlukan:**  
Pengguna hanya ingin tahu "seberapa cantik?" dan "apa yang bisa ditingkatkan?" tanpa melihat puluhan sub-skor.

**Apa yang akan diubah:**

- Pada mode **normal**, laporan hanya menampilkan:
  - Overall score dengan angka besar, mungkin dengan indikator visual (progress bar).
  - Daftar strengths dan suggestions.
  - **Sembunyikan** kategori detail (face_structure, eyes, dll.) atau tampilkan sebagai accordion yang collapsed.
- Pada mode **developer**, laporan tetap menampilkan semua detail seperti sekarang.
- Modifikasi `displayReport` di `capture.js` untuk memeriksa apakah mode developer aktif (`document.body.classList.contains('dev-mode')`). Jika tidak, render versi sederhana.
- CSS tambahan untuk tampilan skor utama yang menarik (misal lingkaran atau gauge).

**Deliverables:**

- Perubahan pada `displayReport` dan mungkin `history.js` (untuk konsistensi tampilan detail di history).
- CSS untuk `overall-score` besar.

**Testing:**

- Mode normal: setelah analisis, hanya muncul skor besar + strengths + suggestions. Klik history → detail juga disederhanakan (atau tetap detail? untuk history mungkin tetap detail karena pengguna jarang mengakses).
- Mode developer: semua detail muncul seperti sebelumnya.

**Dependency:** Fase 12.9 (deteksi mode developer).

---

## Fase 12.11 – UI Polish & Transisi Akhir

**Objective:**  
Menambahkan sentuhan visual akhir: animasi masuknya skor, perbaikan tombol, dan memastikan responsif di semua mode.

**Mengapa diperlukan:**  
Aplikasi harus terlihat profesional dan modern.

**Apa yang akan diubah:**

- Animasi fade‑in dan scale untuk overall score.
- Tombol "Retake" dan "Continue" mungkin diganti dengan ikon yang lebih intuitif.
- Pada mode normal, mungkin tidak perlu bounding box (opsi di config). Kita beri opsi `SHOW_BOUNDING_BOX` di `config.js` yang bisa diatur. Default true, tapi di masa depan bisa dimatikan.
- Pastikan padding, margin, dan warna selaras.
- Uji di beberapa ukuran layar.

**Deliverables:**

- Tambahan CSS animasi.
- Penyesuaian kecil di `config.js` jika diperlukan.
- Update `capture.js` untuk conditional bounding box? (biarkan default, tidak perlu diubah sekarang).

**Testing:**

- Lihat tampilan akhir di mode normal dan developer.
- Uji di mobile (responsive).

**Dependency:** Semua fase sebelumnya.

---

## Fase 12.12 – Final Testing & Lockdown

**Objective:**  
Memastikan mode developer benar-benar tidak bisa diakses tanpa kombinasi tombol, dan semua fitur berjalan mulus untuk pengguna biasa.

**Mengapa diperlukan:**  
Keamanan informasi teknis dan kenyamanan pengguna.

**Apa yang akan dilakukan:**

- Uji coba menyeluruh alur normal oleh orang lain (tester).
- Pastikan tidak ada error di console pada mode normal.
- Hapus semua `console.log` yang tidak perlu dari production (kita bisa menyimpannya di mode developer saja dengan wrapper).
- Buat script build sederhana? Tidak perlu, kita masih development.
- Dokumentasikan cara mengakses mode developer hanya untuk Founder.

**Deliverables:**

- Mungkin menambahkan wrapper `log()` yang hanya mencetak saat `dev-mode` aktif.

**Testing:**

- Acceptance test oleh Founder.

**Dependency:** Fase 12.11.

---

Urutan pengerjaan yang direkomendasikan: 12.8 → 12.9 → 12.10 → 12.11 → 12.12.

Dengan fase-fase ini, FaceAI akan memiliki dua wajah: sederhana untuk dunia, dan lengkap untuk pengembang. Siap untuk dimulai.
