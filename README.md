# FaceAI

FaceAI adalah proyek pembelajaran dan pengembangan Artificial Intelligence yang dibangun secara bertahap dengan pendekatan modular.

Tujuan utama proyek ini adalah membangun sistem yang mampu:

- mendeteksi wajah,
- mengenali wajah yang pernah didaftarkan,
- mengumpulkan dataset wajah,
- kemudian dikembangkan menjadi sistem analisis wajah dan rekomendasi di masa depan.

Pada versi saat ini, proyek masih berada pada tahap **Project Initialization**.

---

# Current Version

**Version:** v0.1

**Milestone:** Project Initialization

Status:

- Backend berhasil dijalankan menggunakan FastAPI.
- Struktur proyek telah dibuat.
- Virtual Environment telah dikonfigurasi.
- Git Repository telah diinisialisasi.

Belum ada implementasi AI pada versi ini.

---

# Project Structure

```text
FaceAI/
│
├── backend/
├── frontend/
├── datasets/
├── docs/
├── scripts/
│
├── README.md
├── LICENSE
└── .gitignore
```

---

# Technology Stack

## Backend

- Python 3.10
- FastAPI
- Uvicorn

## Frontend

- HTML
- CSS
- JavaScript

---

# Current Features

- Struktur proyek
- Backend FastAPI
- Endpoint `/`
- Dokumentasi API (`/docs`)

---

# Getting Started

## 1. Clone Repository

```bash
git clone <repository-url>
```

## 2. Masuk ke Folder Project

```bash
cd FaceAI
```

## 3. Masuk ke Folder Backend

```bash
cd backend
```

## 4. Aktifkan Virtual Environment

Windows (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

Git Bash:

```bash
source .venv/Scripts/activate
```

## 5. Install Dependency

```bash
pip install -r requirements.txt
```

## 6. Jalankan Backend

```bash
uvicorn app.main:app --reload
```

Backend akan berjalan di:

```
http://127.0.0.1:8000
```

Dokumentasi API:

```
http://127.0.0.1:8000/docs
```

---

# Milestone Progress

- ✅ Milestone 1 — Project Initialization
- ⏳ Milestone 2 — Not Started
- ⏳ Milestone 3 — Not Started

---

# License

Lisensi proyek akan ditentukan pada tahap selanjutnya.
