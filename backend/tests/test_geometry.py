import sys
sys.path.insert(0, '.')
import cv2
from app.services.geometry_analyzer import analyze_face_structure
from app.services.detector import detector

img = cv2.imread("aligned_output.jpg")
if img is None:
    print("aligned_output.jpg tidak ditemukan")
else:
    # Dapatkan landmark 106 titik (jika tersedia)
    faces = detector.detect(img)
    if not faces:
        print("Tidak ada wajah terdeteksi")
    else:
        primary = max(faces, key=lambda f: f.confidence)
        if primary.landmarks and len(primary.landmarks) >= 68:
            result = analyze_face_structure(primary.landmarks)
            print("Face Shape:", result["face_shape"])
            print("Symmetry:", result["symmetry"])
            print("Harmony:", result["harmony"])
        else:
            print(f"Landmark hanya {len(primary.landmarks)} titik, butuh minimal 68")