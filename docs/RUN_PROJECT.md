# FaceAI

## Cara Menjalankan Project

---

## 1. Jalankan Backend

Buka PowerShell

Masuk ke folder backend

```powershell
cd E:\AIC\FaceAI\backend
```

Aktifkan Virtual Environment

```powershell
.\.venv\Scripts\Activate.ps1
```

Jalankan FastAPI

```powershell
uvicorn app.main:app --reload
```

Jika berhasil akan muncul

```
INFO: Uvicorn running on http://127.0.0.1:8000
```

---

## 2. Jalankan Frontend

Buka PowerShell baru

Masuk ke folder frontend

```powershell
cd E:\AIC\FaceAI\frontend
```

Jalankan HTTP Server

```powershell
python -m http.server 5500
```

---

## 3. Buka Browser

```
http://localhost:5500
```

---

## 4. Mulai Kamera

Klik

```
Start Camera
```

Izinkan akses kamera.

---

## Hasil yang Diharapkan

- Website terbuka
- Kamera aktif
- Preview video muncul
- Placeholder hilang

Catatan:

Pada Milestone 3:

- Backend Status belum aktif
- Face Status belum aktif

Karena kedua fitur tersebut akan dibuat pada milestone berikutnya.

---

## Menghentikan Project

Frontend

Tekan

```
CTRL + C
```

Backend

Tekan

```
CTRL + C
```

Virtual Environment (opsional)

```
deactivate
```
