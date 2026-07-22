# Dokumen Desain Teknis Milestone 12 — UI & Performance

**Versi:** 1.0  
**Status:** Draft untuk persetujuan Founder  
**Peran:** Senior AI Engineer, Software Architect & Frontend Engineer

---

## Langkah 1 — Insight dari Empat Repositori yang Relevan

### Facial Beauty Prediction

- **Pipeline inference dijalankan pada gambar statis**, bukan real‑time. Waktu inferensi bisa memakan beberapa detik; pengguna perlu diberi indikator progres yang jelas.
- **Hasil ditampilkan sebagai skor numerik** tanpa visualisasi yang rumit. Insight: UI FaceAI harus menyajikan laporan dengan hierarki yang jelas—skor utama menonjol, detail dapat diakses dengan scroll.

### face‑rating

- **Setiap fitur wajah diberi skor terpisah**, lalu ditampilkan dalam bentuk tabel sederhana. Tidak ada animasi berlebihan. Insight: tampilan skor per‑kategori yang kita miliki sudah mirip; kita hanya perlu meningkatkan keterbacaan dengan typography yang lebih baik dan spasi yang cukup.

### MEBeauty

- **Preprocessing pipeline (crop, align, normalization) adalah bagian paling berat.** Pengguna tidak melihat proses ini, tetapi latensi total bisa mencapai beberapa detik. Insight: frontend harus menampilkan indikator “Analyzing…” yang jelas setelah upload, dan backend harus memberikan response secepat mungkin dengan mengoptimalkan pipeline.
- **Bug normalisasi** menunjukkan bahwa konsistensi antar‑tahap harus dijaga, tetapi tidak berdampak langsung pada UI.

### DeepFace

- **Pemisahan tegas antara detection, alignment, normalization, representation, dan analysis.** Setiap tahap bisa berjalan independen. Insight: UI tidak perlu memblokir seluruh aplikasi saat satu tahap berjalan. Misalnya, setelah capture, kita bisa langsung menampilkan preview sementara backend bekerja.
- **Confidence dan threshold** ditampilkan sebagai metrik tambahan. Insight: laporan kita sudah mencantumkan confidence; pastikan font dan warnanya mudah dibaca.

---

## Langkah 2 — Evaluasi Milestone 12

### 1. Objective sudah tepat

Meningkatkan pengalaman pengguna setelah semua fitur selesai adalah pendekatan yang benar. Fokus pada UI dan performa tanpa menambah fitur baru.

### 2. UI improvements sudah cukup?

- **Responsive**: wajib, karena pengguna bisa membuka dari berbagai perangkat.
- **Better Typography**: perlu; saat ini teks laporan masih default.
- **Better Animation**: animasi mikro untuk transisi (misal countdown, fade in/out) akan membuat aplikasi terasa lebih halus. Tidak perlu berlebihan.
- **Better Loading**: indikator saat upload dan analisis masih minimal; perlu ditingkatkan.
- **Better Empty State**: belum ada pesan ketika tidak ada history atau hasil.
- **Better Error Message**: sudah ada, tetapi bisa dibuat lebih terstruktur dan ramah pengguna.

### 3. Performance improvements sudah cukup?

- **Lazy Loading**: tidak kritis untuk ukuran kode kita saat ini, tetapi untuk model AI di backend bisa di‑warm‑up.
- **Camera Optimization**: resolusi bisa disesuaikan, stream dihentikan saat tidak digunakan.
- **Detection Optimization**: throttle FPS sudah ada, bisa diturunkan ke 15–20 FPS.
- **Memory Optimization**: membersihkan canvas dan stream secara eksplisit.
- **Cache**: backend embedding (jika dipakai) bisa di‑cache; frontend bisa cache hasil history untuk mengurangi fetch.

### 4. Tidak ada bagian yang hilang, tetapi…

Satu area yang mungkin kurang adalah **aksesibilitas** (contrast, label aria). Itu bisa menjadi perbaikan kecil di tahap ini.

### 5. Tidak ada yang perlu dipindahkan ke milestone lain.

Semua yang tercantum adalah penyempurnaan yang tepat setelah fitur lengkap.

### 6. Urutan pekerjaan sudah benar.

Optimasi performa bisa dilakukan paralel dengan UI, tetapi sebaiknya UI dasar diperbaiki terlebih dahulu agar pengujian lebih mudah.

### 7. Sesuai dengan pembelajaran?

Ya. Pendekatan bertahap tanpa mengubah logika bisnis selaras dengan filosofi DeepFace yang modular. Peningkatan UI dan performa dilakukan setelah fitur stabil, seperti yang terlihat di MEBeauty yang lebih fokus pada pipeline daripada UI.

---

## Langkah 3 — Filosofi UI FaceAI

Filosofi yang diinginkan sudah tepat. Saya tambahkan satu poin:

- **Dark theme sebagai default** — sudah diterapkan, profesional, nyaman di mata.
- **Hirarki visual yang jelas** — overall score paling menonjol, kemudian kategori utama, lalu detail.
- **Konsistensi dengan state machine** — UI selalu mencerminkan state saat ini (idle, detecting, ready, capturing, result) tanpa membingungkan.
- **Minimalis namun informatif** — tidak ada elemen dekoratif yang tidak perlu.

Tidak ada yang perlu diubah.

---

## Langkah 4 — Evaluasi Performa Seluruh Pipeline

| Tahap                 | Potensi Bottleneck                                                                 | CPU                                          | RAM                       | Jaringan                        | Latency (perkiraan)                           | UX Impact                                        |
| --------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------- | ------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Camera                | Resolusi tinggi, format tidak terkompresi                                          | Rendah                                       | Rendah                    | -                               | 100–500 ms startup                            | Pengguna menunggu kamera siap                    |
| Face Detection        | MediaPipe inferensi setiap frame (CPU)                                             | Sedang (10‑15% per core)                     | ~50 MB                    | -                               | < 50 ms per frame                             | Tidak terasa jika FPS cukup                      |
| Quality Assessment    | Pengecekan blur (Laplacian), lighting sampling                                     | Rendah‑sedang (tergantung ukuran bbox)       | Rendah                    | -                               | < 10 ms per check (setiap 3 frame)            | Tidak terasa                                     |
| Auto Capture          | `takeSnapshot` (drawImage)                                                         | Rendah                                       | Rendah                    | -                               | < 10 ms                                       | Instan                                           |
| Upload                | Ukuran gambar (1280×720 JPEG ~100‑200 KB)                                          | Rendah                                       | Rendah                    | ~1‑2 detik (tergantung koneksi) | Perlu indikator “Uploading…”                  |
| Backend Preprocessing | InsightFace model load (sekali), detection+landmark (CPU), alignment (CPU), resize | Sedang (detection ~100 ms, alignment ~20 ms) | ~500 MB untuk semua model | -                               | 1–3 detik (pertama kali, model sudah di‑load) | Backend bisa memberikan response dalam 2‑4 detik |
| AI Analysis           | Placeholder (dummy random) → ringan                                                | Sangat rendah                                | Rendah                    | -                               | < 10 ms                                       | Instan                                           |
| Report Generator      | Pembacaan YAML, string formatting                                                  | Rendah                                       | Rendah                    | -                               | < 5 ms                                        | Instan                                           |
| History               | SQLite query                                                                       | Rendah                                       | Rendah                    | -                               | < 10 ms                                       | Instan                                           |

**Kesimpulan:** Bottleneck utama adalah **upload jaringan** dan **backend preprocessing (deteksi+alignment)**. Frontend detection dan quality sudah ringan. Fokus optimasi di backend dan feedback UI selama menunggu.

---

## Langkah 5 — Rancang Strategi Optimasi

### Frontend

- **Lazy Loading**: tidak diperlukan karena semua script sudah kecil. Pertahankan.
- **Asset Loading**: model MediaPipe di‑cache oleh browser. Tambahkan `crossorigin` dan pastikan CDN mendukung caching.
- **Script Loading**: sudah menggunakan urutan yang benar, tanpa `defer`/`async` yang bisa merusak dependensi. Biarkan.
- **CSS**: kompresi? Tidak perlu untuk development. Gunakan variabel yang sudah ada.
- **Image Loading**: thumbnail untuk history? Belum ada, tidak perlu sekarang.
- **Font Loading**: gunakan font sistem (`system-ui`) yang sudah diterapkan—tanpa unduhan tambahan.

### Camera

- **Startup**: minta resolusi ideal (`ideal: 1280x720`) bukan rentang. Kurangi `ideal` ke `640x480` jika performa rendah? Untuk laptop modern 720p sudah ringan.
- **Stream management**: sudah ada `stop()` di `camera.js` dan saat tab hidden. Pertahankan.
- **Restart**: pastikan `stop()` dipanggil sebelum `start()` baru agar tidak ada stream ganda.

### Face Detection

- **Detection interval**: turunkan `FPS_LIMIT` dari 30 ke 20 (cukup untuk bounding box mulus). Ubah di `config.js`.
- **Bounding box rendering**: sudah optimal menggunakan `requestAnimationFrame` dan canvas terpisah.
- **Canvas optimization**: gunakan `willReadFrequently: true` hanya untuk canvas quality (sudah dilakukan). Untuk drawing, tidak perlu.

### Backend

- **Upload optimization**: frontend bisa mengompres gambar menjadi JPEG kualitas 0.8 sebelum upload? Itu akan memperkecil ukuran tanpa kehilangan detail signifikan. Implementasikan di `upload.js` saat konversi canvas ke blob (ubah kualitas menjadi 0.8).
- **Image compression**: backend tidak perlu kompres ulang.
- **Request optimization**: backend sudah menerima multipart, tidak perlu diubah.
- **Queue**: tidak diperlukan untuk beban rendah.
- **Response size**: laporan JSON bisa mencapai beberapa KB. Gunakan kompresi GZip di FastAPI? Sudah otomatis untuk response besar. Aman.

### AI (Backend)

- **Model loading**: InsightFace sudah singleton, hanya di‑load sekali. Tidak ada masalah.
- **Warm‑up**: lakukan dummy inference saat startup untuk mengurangi latensi permintaan pertama. Dapat dilakukan di `startup_event` FastAPI.
- **Caching**: embedding belum digunakan, tetapi jika nanti dipakai, embedding bisa di‑cache per gambar.
- **Inference optimization**: sudah menggunakan onnxruntime dengan CPU execution provider. Tidak bisa dioptimalkan lebih jauh tanpa GPU.

### Memory

- **Object cleanup**: panggil `URL.revokeObjectURL()` setelah preview (jika pakai object URL). Saat ini kita pakai canvas dan data URL, tidak ada object URL yang perlu dibersihkan.
- **Canvas cleanup**: `drawing.clear()` sudah ada. Pastikan `clearFaceBox` dipanggil sebelum menggambar ulang.
- **Video cleanup**: `camera.stop()` menghentikan track. Sudah benar.
- **Cache strategy**: history service bisa menyimpan hasil query di memori untuk waktu singkat (tidak perlu).

### UI

- **Loading animation**: spinner CSS sederhana saat upload (tombol berubah jadi spinner). Saat analisis, kita bisa menampilkan “Analyzing…” di area laporan sebelum data muncul.
- **Skeleton**: tidak perlu.
- **Empty state**: untuk history kosong, tampilkan pesan “No analyses yet”.
- **Error handling**: ganti `alert` dengan elemen error di UI yang lebih halus.
- **Success feedback**: setelah laporan muncul, animasi fade‑in.
- **Progress indicator**: untuk upload, kita bisa gunakan `XMLHttpRequest` dengan event `progress` untuk menampilkan persentase, tetapi untuk kesederhanaan, spinner sudah cukup.

---

## Langkah 6 — Pemecahan Menjadi Stage Kecil

### Stage 12.1 — Typography & Responsive Layout

**Objective:** Meningkatkan keterbacaan teks dan memastikan tampilan optimal di berbagai ukuran layar.

**Mengapa diperlukan:** Saat ini teks laporan masih mentah; tata letak belum diuji pada layar kecil.

**Input:** Tidak ada.

**Process:**

- Definisikan ukuran font responsif menggunakan unit `rem` atau `clamp()`.
- Atur `max-width` container utama menjadi 800px, tengah.
- Pada laporan, gunakan grid 2‑kolom untuk kategori.
- Uji dengan Chrome DevTools device toolbar.

**Output:** Tampilan lebih rapi, tidak pecah di layar 1366×768 hingga 1920×1080.

**Deliverables:**

- Modifikasi `frontend/css/style.css` (penambahan media queries, perbaikan grid).
- Penyesuaian kecil di `index.html` jika diperlukan.

**Dependency:** Tidak ada.

**Definition of Done:**

- Teks terbaca jelas, tidak terlalu kecil/besar.
- Di lebar 1280px dan 1920px, tata letak tetap proporsional.
- Panel laporan menggunakan dua kolom untuk kategori.

**Testing Checklist:**

- Buka di resolusi berbeda, periksa kerapihan.
- Pastikan tidak ada elemen yang bertabrakan.

**Risiko:** Menambah kompleksitas CSS; mitigasi dengan pendekatan mobile‑first.

**Catatan Engineering:** Gunakan variabel CSS yang sudah ada untuk warna dan border.

---

### Stage 12.2 — Loading States & Empty States

**Objective:** Menampilkan indikator progres selama upload/analisis dan pesan informatif saat data kosong.

**Mengapa diperlukan:** Pengguna harus mendapat umpan balik bahwa aplikasi sedang bekerja, bukan error.

**Input:** Status dari `capture.js` dan `history.js`.

**Process:**

- Ubah tombol “Uploading…” menjadi spinner + teks.
- Setelah report dipanggil, di area laporan tampilkan “Analyzing…” sampai data muncul.
- Di panel history, jika daftar kosong, tampilkan “No analysis history yet.”
- Di history detail, jika gagal memuat, tampilkan pesan error terstruktur.

**Output:** Tidak ada layar kosong tanpa informasi; pengguna tahu apa yang terjadi.

**Deliverables:**

- Modifikasi `frontend/js/modules/capture.js` (onContinue, fetchReport).
- Modifikasi `frontend/js/modules/history.js` (renderList, showDetail).
- CSS tambahan untuk spinner (dapat dibuat dengan animasi CSS).

**Dependency:** Stage 12.1 (agar tampilan spinner rapi).

**Definition of Done:**

- Saat upload dimulai, tombol berubah spinner.
- Saat menunggu report, muncul teks “Analyzing…”.
- History kosong menampilkan pesan yang sesuai.

**Testing Checklist:**

- Lakukan analisis, perhatikan tombol dan area laporan.
- Hapus semua history, buka panel history.
- Putuskan koneksi, coba fetch history.

**Risiko:** Timing penggantian teks; gunakan flag state.

**Catatan Engineering:** Spinner dapat dibuat dengan CSS `@keyframes`. Hanya tambahkan class `spinner` ke tombol.

---

### Stage 12.3 — Micro‑Interactions & Smooth Transitions

**Objective:** Menambahkan animasi ringan untuk memperhalus pengalaman pengguna.

**Mengapa diperlukan:** Aplikasi terasa lebih modern dan responsif dengan transisi halus.

**Input:** Perubahan state, tampil/sembunyi elemen.

**Process:**

- Tambahkan transisi CSS (`transition: opacity 0.3s`) pada panel laporan, history, dan indikator.
- Untuk countdown, tambahkan animasi scale-up/scale-down setiap angka.
- Saat bounding box muncul/hilang, gunakan transisi opacity untuk mengurangi flicker.
- Preview gambar setelah capture: fade‑in.

**Output:** Pergerakan elemen terasa halus, tidak kaku.

**Deliverables:**

- `frontend/css/style.css` (tambahan transisi dan keyframes sederhana).
- Modifikasi `frontend/js/ui/ui.js` (untuk menambah/menghapus class transisi).

**Dependency:** Stage 12.2 (indikator loading sudah ada, transisi akan meningkatkan).

**Definition of Done:**

- Panel laporan dan history muncul dengan fade‑in.
- Countdown angka membesar dan mengecil secara halus.
- Bounding box tidak langsung hilang, tetapi memudar dalam 100ms.

**Testing Checklist:**

- Amati muncul/hilangnya laporan dan history.
- Perhatikan countdown.
- Perhatikan bounding box saat wajah keluar-masuk.

**Risiko:** Animasi berlebihan mengganggu; jaga durasi singkat (≤300ms).

**Catatan Engineering:** Gunakan `will-change` atau `transform` untuk performa GPU.

---

### Stage 12.4 — Camera & Detection Performance Tuning

**Objective:** Menurunkan beban CPU tanpa mengorbankan pengalaman deteksi.

**Mengapa diperlukan:** Pengguna mungkin memiliki laptop dengan spesifikasi rendah; kita harus menjaga FPS dan responsivitas UI.

**Input:** Konfigurasi camera dan detection.

**Process:**

- Di `config.js`, ubah `FPS_LIMIT` menjadi 20.
- Di `camera.js`, ubah ideal resolution menjadi `width: 1280, height: 720` (sudah). Tidak perlu diubah.
- Di `detection.js`, pastikan throttle diterapkan.
- Nonaktifkan deteksi saat tidak diperlukan (sudah ada di `app.js` saat tab hidden).
- Di `quality.js`, pertahankan throttle 3 frame.

**Output:** CPU usage turun ~10‑15%, deteksi tetap responsif.

**Deliverables:**

- Perubahan konstanta di `config.js`.

**Dependency:** Stage 12.1‑12.3 (UI sudah rapi, tidak terpengaruh).

**Definition of Done:**

- Pada laptop i5 generasi ke‑8, CPU usage saat deteksi di bawah 20%.
- Bounding box masih mulus.

**Testing Checklist:**

- Buka Task Manager, pantau CPU usage sebelum dan sesudah.
- Bandingkan FPS deteksi (subjektif).

**Risiko:** FPS terlalu rendah menyebabkan bounding box patah‑patah; uji dengan 20 FPS, jika kurang nyaman naikkan ke 25.

**Catatan Engineering:** FPS limit adalah `1000 / FPS_LIMIT` ms antar frame. Semakin kecil, semakin berat.

---

### Stage 12.5 — Backend Warm‑Up & Caching

**Objective:** Mengurangi latensi permintaan pertama dengan memanaskan model AI.

**Mengapa diperlukan:** Pengguna pertama setelah server restart akan menunggu 2‑3 detik lebih lama karena model belum dimuat. Warming‑up menghilangkan kejutan ini.

**Input:** Server startup.

**Process:**

- Di event `startup` FastAPI, lakukan `detector._initialize()` dan `detector.model.get()` dengan gambar dummy (gambar hitam kecil) untuk memicu loading semua model.
- Simpan embedding cache jika nanti digunakan.
- Jangan tambahkan logging berlebihan.

**Output:** Setiap permintaan pertama setelah restart memiliki latensi yang sama dengan permintaan berikutnya.

**Deliverables:**

- Modifikasi `backend/app/main.py` untuk menambahkan `@app.on_event("startup")`.

**Dependency:** Stage 8.1 (detector harus sudah ada).

**Definition of Done:**

- Setelah server restart, permintaan `/api/upload` + `/api/report` selesai dalam waktu < 3 detik.
- Tanpa warm‑up, permintaan pertama bisa memakan waktu 4‑5 detik.

**Testing Checklist:**

- Restart server, lalu segera kirim gambar. Catat waktu.
- Restart server, tunggu beberapa detik, kirim gambar. Bandingkan.

**Risiko:** Gambar dummy mungkin tidak cukup untuk memuat semua model; gunakan `detector._initialize()` yang sudah memuat semua model.

**Catatan Engineering:** Pastikan warm‑up tidak gagal meskipun gambar dummy tidak valid; gunakan try‑except.

---

### Stage 12.6 — Memory & Resource Cleanup

**Objective:** Memastikan tidak ada kebocoran memori setelah penggunaan jangka panjang.

**Mengapa diperlukan:** Pengguna dapat melakukan beberapa analisis berturut‑turut; akumulasi objek yang tidak dibersihkan dapat menyebabkan crash.

**Input:** Event retake, tab close, window unload.

**Process:**

- Di `capture.js` saat retake, pastikan `lastCapture` dihapus, canvas preview dibersihkan.
- Di `camera.js`, saat `stop()`, set `videoElement.srcObject = null`.
- Di `detection.js`, saat `stop()`, jangan hanya menghentikan loop, tapi juga pastikan tidak ada callback tertunda.
- Di `history.js`, saat panel ditutup, hapus referensi DOM yang besar.
- Di `app.js` event `beforeunload`, panggil `cleanup()`.

**Output:** Setelah 10 kali analisis, penggunaan memori tetap stabil.

**Deliverables:**

- Modifikasi kecil di beberapa file.

**Dependency:** Stage 12.4 (performa sudah dioptimasi, bersihkan setelah).

**Definition of Done:**

- Profil memori di Chrome DevTools menunjukkan tidak ada peningkatan yang signifikan setelah penggunaan berulang.

**Testing Checklist:**

- Gunakan tab Performance, lakukan capture beberapa kali, periksa heap.

**Risiko:** Over‑cleanup menyebabkan variabel tidak terdefinisi; uji retake dengan hati‑hati.

**Catatan Engineering:** Jangan menghapus objek yang mungkin masih digunakan.

---

### Stage 12.7 — Final Performance Audit & Accessibility Tweaks

**Objective:** Melakukan pengujian menyeluruh, menambahkan atribut aksesibilitas dasar, dan memastikan kesiapan rilis.

**Mengapa diperlukan:** Sebelum melanjutkan ke dokumentasi dan rilis, kita harus memastikan kualitas.

**Input:** Semua stage sebelumnya.

**Process:**

- Audit dengan Lighthouse (Performance, Accessibility).
- Tambahkan `aria-label` pada tombol utama.
- Pastikan kontras warna mencukupi (teks pada latar belakang gelap).
- Perbaiki peringatan yang mungkin muncul.
- Uji di beberapa browser (Chrome, Edge, Firefox).

**Output:** Skor Lighthouse minimal 90 untuk Performance, 100 untuk Accessibility.

**Deliverables:**

- Perbaikan kecil di `index.html` dan `style.css`.

**Dependency:** Stage 12.1‑12.6.

**Definition of Done:**

- Lighthouse report menunjukkan tidak ada masalah kritis.
- Tidak ada error di console.

**Testing Checklist:**

- Jalankan Lighthouse di tab Incognito.
- Uji di browser berbeda.

**Risiko:** Perubahan aksesibilitas mungkin memerlukan penyesuaian struktur HTML; minimal saja.

**Catatan Engineering:** Gunakan alat bantu seperti axe DevTools.

---

## Langkah 7 — Urutan Stage yang Direkomendasikan

12.1 → 12.2 → 12.3 → 12.4 → 12.5 → 12.6 → 12.7

Urutan ini didasarkan pada: perbaiki tampilan terlebih dahulu agar pengujian lebih nyaman, lalu optimasi beban, lalu pengujian akhir.

---

## Langkah 8 — Best Practices & Risiko Jangka Panjang

- **Jangan mengorbankan kualitas gambar** demi performa upload; gunakan kompresi JPEG yang masih menghasilkan gambar tajam (kualitas 0.8–0.9).
- **Pertahankan modularitas** — setiap perbaikan UI hanya mengubah CSS atau JS terkait, tidak merusak pipeline.
- **Uji dengan throttling jaringan** untuk memastikan indikator loading bekerja.
- **Pertimbangkan penggunaan Service Worker** di masa depan untuk caching offline (tidak untuk sekarang).
- **Jangan menambahkan library eksternal** — semua animasi dan spinner dibuat dengan CSS murni.
- **Risiko utama**: perubahan performa mungkin menyebabkan deteksi melambat; jika FPS < 15, naikkan batas FPS kembali.

Dengan desain ini, Milestone 12 akan menghasilkan aplikasi FaceAI yang tidak hanya berfungsi, tetapi juga nyaman dan profesional untuk digunakan. Saya mohon persetujuan untuk memulai implementasi Stage 12.1.
