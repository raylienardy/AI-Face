# FaceAI Training Pipeline

Folder ini berisi skrip untuk melatih model analisis region (mata, hidung, dll.) dan model kecantikan secara independen.

## Struktur

- `config.py`: Konfigurasi training.
- `dataset.py`: Dataset loader dari file CSV.
- `train_region.py`: Contoh skrip pelatihan untuk satu region.
- `data/`: Letakkan file CSV dan gambar di sini.
- `models/`: Model hasil training disimpan di sini.

## Format Dataset

CSV dengan kolom pertama `image_path` dan kolom berikutnya adalah label numerik (misal `eyes_shape`, `eyes_spacing`, `eyes_size`).

## Cara Memulai

1. Letakkan dataset (gambar + CSV) di folder `data/`.
2. Sesuaikan `config.py` jika diperlukan.
3. Jalankan `python train_region.py` (atau salin dan modifikasi untuk region lain).
4. Model akan tersimpan di `models/`.
