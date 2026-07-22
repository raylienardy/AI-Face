import sys
sys.path.insert(0, '.')
import cv2
from app.services.detector import detector
from app.services.validator import validate_faces
from app.services.aligner import align_face

image = cv2.imread("test.jpg")
if image is None:
    print("Gambar tidak ditemukan")
else:
    faces = detector.detect(image)
    try:
        primary = validate_faces(faces)
        aligned = align_face(image, primary.landmarks, primary.bbox)
        cv2.imwrite("aligned_output.jpg", aligned)
        print("Hasil alignment disimpan sebagai aligned_output.jpg")
        print(f"Ukuran hasil: {aligned.shape[1]}x{aligned.shape[0]}")
    except Exception as e:
        print(f"Gagal: {e}")