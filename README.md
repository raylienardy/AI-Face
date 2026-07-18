## Versi Saat Ini

**Version:** v0.1  
**Milestone:** 4 – Face Detection (Stage 4.1)

### Status

- ✅ Backend FastAPI berjalan
- ✅ Struktur proyek modular
- ✅ Kamera berfungsi (webcam)
- ✅ Loading & verifikasi model deteksi (BlazeFace)
- ⏳ Deteksi wajah & bounding box (selanjutnya)

---

## Struktur Proyek

```text
FaceAI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── models/
│   ├── logs/
│   ├── tests/
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── core/
│   │   │   ├── config.js
│   │   │   ├── camera.js
│   │   │   └── state.js
│   │   ├── modules/
│   │   │   ├── detection.js
│   │   │   ├── capture.js
│   │   │   ├── recognition.js
│   │   │   ├── rating.js
│   │   │   └── dataset.js
│   │   ├── ui/
│   │   │   ├── ui.js
│   │   │   └── drawing.js
│   │   └── utils/
│   │       └── helpers.js
│   └── assets/
│       ├── models/
│       ├── icons/
│       └── data/
│
├── datasets/
├── docs/
├── scripts/
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Teknologi

### Backend

- Python 3.10
- FastAPI
- Uvicorn

### Frontend

- HTML5, CSS3, JavaScript (ES6)
- MediaPipe Face Detection (BlazeFace)
- WebGL (untuk inferensi AI di browser)

---

## Fitur Saat Ini

- ✅ Backend API dengan FastAPI (endpoint `/` dan `/docs`)
- ✅ Struktur proyek modular
- ✅ Kamera real‑time (webcam) dengan akses `getUserMedia`
- ✅ State machine aplikasi
- ✅ Konfigurasi terpusat
- ✅ Placeholder modul untuk deteksi, capture, recognition, rating, dataset
- ✅ Inisialisasi model BlazeFace (Stage 4.1)

---

## Cara Menjalankan

### 1. Clone Repository

```bash
git clone <repository-url>
cd FaceAI
```

### 2. Backend (FastAPI)

```bash
cd backend

# Buat virtual environment (jika belum)
python -m venv .venv

# Aktifkan virtual environment
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# Git Bash / Linux / Mac
source .venv/bin/activate

# Install dependency
pip install -r requirements.txt

# Jalankan server
uvicorn app.main:app --reload
```

Buka `http://127.0.0.1:8000` untuk melihat backend, dan `http://127.0.0.1:8000/docs` untuk dokumentasi API.

### 3. Frontend (Webcam & Deteksi)

Karena browser memerlukan konteks aman (`localhost` atau HTTPS) untuk mengakses kamera dan WebGL, frontend **harus dijalankan melalui server HTTP**, tidak bisa langsung dibuka dengan klik dua kali file HTML.

#### Jalankan server lokal di folder `frontend`:

```bash
cd frontend

# Python 3
python -m http.server 8080

# atau dengan Node.js (jika terinstall)
npx http-server -p 8080
```

Lalu buka `http://localhost:8080` di browser (Chrome/Edge/Firefox).

> **Catatan:** Untuk menguji model deteksi (Stage 4.1), buka console browser dan jalankan:
>
> ```js
> FaceAI.detection.init();
> ```

---

## Milestone Progress

| Milestone | Deskripsi                  | Status                                   |
| --------- | -------------------------- | ---------------------------------------- |
| 1         | Project Initialization     | ✅ Selesai                               |
| 2         | Frontend Foundation        | ✅ Selesai                               |
| 3         | Camera Foundation          | ✅ Selesai                               |
| 3.5       | Project Foundation for AI  | ✅ Selesai                               |
| 4         | Face Detection & Alignment | 🔄 Sedang dikerjakan (Stage 4.1 selesai) |
| 5         | Face Validation            | ⏳ Belum dimulai                         |
| 6         | Face Capture               | ⏳ Belum dimulai                         |
| 7         | Dataset Storage            | ⏳ Belum dimulai                         |
| 8         | Face Recognition           | ⏳ Belum dimulai                         |
| 9         | Face Rating                | ⏳ Belum dimulai                         |
| 10        | Face Recommendation        | ⏳ Belum dimulai                         |
| 11        | AI Makeup                  | ⏳ Belum dimulai                         |

---

## Lisensi

MIT License – lihat file [LICENSE](LICENSE) untuk detail.

```

---

**Perubahan utama:**
- Menambahkan instruksi rinci untuk menjalankan frontend dengan server HTTP lokal.
- Memperbarui status milestone, termasuk penambahan milestone 3.5 dan progres milestone 4.
- Menyesuaikan struktur folder di README dengan yang terbaru.
- Menambahkan fitur saat ini, termasuk Stage 4.1.
- Menghapus daftar milestone lama yang hanya menampilkan Milestone 1–3 belum dimulai.

README kini siap digunakan dan memudahkan siapa pun untuk menjalankan proyek FaceAI.
```
