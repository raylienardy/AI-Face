import os
import cv2
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.preprocessing import preprocess_image   # pipeline deteksi+align+resize+normalize
from app.services.landmark_extractor import extract_landmarks
from app.services.geometry_analyzer import analyze_face_structure
from app.services.region_analyzer import analyze_all_regions
from app.services.skin_analyzer import analyze_skin
from app.services.aggregator import aggregate_scores
from app.core import config

router = APIRouter(prefix="/api")

class AnalysisResponse(BaseModel):
    face_structure: dict
    eyes: dict
    eyebrows: dict
    nose: dict
    mouth: dict
    jaw: dict
    cheek: dict
    skin: dict
    overall: dict

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    # Simpan file sementara
    temp_path = f"temp_analysis_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # --- Preprocessing (dari Milestone 8) ---
        # Hasilkan gambar yang sudah di-crop, aligned, resized (224x224), normalized
        processed_path = preprocess_image(temp_path)  # mengembalikan path PNG

        # Baca gambar hasil preprocessing (untuk keperluan region crop, kita butuh gambar asli BGR)
        # Karena preprocessing mengubah ukuran dan normalisasi, kita perlu landmark dari gambar asli
        # yang sudah di-alignment saja. Oleh karena itu, kita jalankan pipeline manual di sini:
        # 1. Deteksi
        # 2. Alignment & crop (dapatkan aligned_face asli, bukan yang sudah di-resize 224)
        # Untuk efisiensi, kita bisa memanggil fungsi aligner/cropper langsung.
        # Namun, agar sederhana, kita gunakan gambar asli yang sudah di-crop dan di-align oleh preprocess_image.
        # Tapi preprocess_image akhirnya me-resize ke 224 dan normalisasi; kita perlu gambar yang belum di-resize untuk region crop.
        # Oleh karena itu, kita akan memproses ulang gambar asli untuk mendapatkan landmark dan region crop.
        # (Untuk MVP, kita langsung gunakan gambar asli dan ekstrak landmark tanpa preprocessing.)
        
        # Untuk kemudahan, kita gunakan gambar asli (temp_path) untuk ekstrak landmark dan region crop.
        img_orig = cv2.imread(temp_path)
        if img_orig is None:
            raise HTTPException(400, "Cannot read image")

        # Ekstrak landmark
        landmarks = extract_landmarks(img_orig)
        if landmarks is None:
            raise HTTPException(422, "No face detected")

        # Analisis
        geometry = analyze_face_structure(landmarks)
        regions = analyze_all_regions(img_orig, landmarks)
        skin = analyze_skin(img_orig, landmarks)
        overall = aggregate_scores(geometry, regions, skin)

        return {
            "face_structure": {
                "shape": geometry["face_shape"],
                "harmony": geometry["harmony"],
                "symmetry": geometry["symmetry"]
            },
            "eyes": regions["eyes"],
            "eyebrows": regions["eyebrows"],
            "nose": regions["nose"],
            "mouth": regions["mouth"],
            "jaw": regions["jaw"],
            "cheek": regions["cheek"],
            "skin": skin,
            "overall": overall
        }
    except Exception as e:
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)