"""
Mengekstrak data wajah terstruktur dari gambar yang sudah di-preprocess.
Data ini akan dikirim ke LLM untuk penilaian.
"""
import cv2
import numpy as np
from app.services.landmark_extractor import extract_landmarks
from app.services.geometry_analyzer import analyze_face_structure
from app.services.embedder import extract_embedding
from app.services.region_analyzer import analyze_all_regions
from app.services.skin_analyzer import analyze_skin


def extract_face_data(image: np.ndarray) -> dict:
    """
    Ekstrak semua data wajah yang diperlukan untuk penilaian AI.
    
    Returns:
        dict dengan kunci:
        - geometry: hasil analisis geometri (simetri, harmoni, bentuk wajah)
        - regions: skor per region (mata, hidung, dll.)
        - skin: skor kualitas kulit
        - embedding_summary: ringkasan statistik embedding (mean, std, dll.)
        - facial_measurements: pengukuran wajah kunci (opsional)
    """
    landmarks = extract_landmarks(image)
    if landmarks is None:
        return {"error": "No face detected"}

    geometry = analyze_face_structure(landmarks)
    regions = analyze_all_regions(image, landmarks)
    skin = analyze_skin(image, landmarks)

    # Ringkasan embedding (statistik)
    embedding = extract_embedding(image)
    embedding_stats = {
        "mean": float(np.mean(embedding)),
        "std": float(np.std(embedding)),
        "min": float(np.min(embedding)),
        "max": float(np.max(embedding)),
        "dim": embedding.shape[1] if len(embedding.shape) > 1 else embedding.shape[0]
    }

    # Pengukuran wajah kunci
    measurements = {}
    if landmarks and len(landmarks) >= 68:
        pts = np.array(landmarks)
        # Lebar wajah (jarak antara titik terluar rahang)
        measurements["face_width"] = float(np.linalg.norm(pts[0] - pts[16]))
        # Tinggi wajah (dari dahi ke dagu)
        measurements["face_height"] = float(np.linalg.norm(pts[8] - pts[27]))
        # Jarak antar mata
        measurements["eye_distance"] = float(np.linalg.norm(pts[36] - pts[45]))
        # Lebar hidung
        measurements["nose_width"] = float(np.linalg.norm(pts[31] - pts[35]))
        # Lebar mulut
        measurements["mouth_width"] = float(np.linalg.norm(pts[48] - pts[54]))

    return {
        "geometry": geometry,
        "regions": regions,
        "skin": skin,
        "embedding_summary": embedding_stats,
        "facial_measurements": measurements
    }