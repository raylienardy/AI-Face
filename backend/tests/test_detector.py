import cv2
from app.services.detector import detector
import sys
sys.path.insert(0, '.')
# Baca gambar uji (ganti dengan path gambar wajah)
image_path = "test.jpg"  # letakkan gambar di folder backend/
image = cv2.imread(image_path)  # BGR

if image is None:
    print("Gambar tidak ditemukan")
else:
    faces = detector.detect(image)
    print(f"Ditemukan {len(faces)} wajah")
    for i, face in enumerate(faces):
        print(f"Wajah {i+1}: bbox={face.bbox}, confidence={face.confidence:.2f}")
        if face.landmarks:
            print(f"  Landmarks: {face.landmarks}")