import sys
sys.path.insert(0, '.')
import cv2
from app.services.detector import detector
from app.services.validator import validate_faces
from app.exceptions import ValidationError

# Gunakan gambar yang sama seperti test sebelumnya
image = cv2.imread("test.jpg")
if image is None:
    print("Gambar tidak ditemukan")
else:
    faces = detector.detect(image)
    print(f"Ditemukan {len(faces)} wajah")
    try:
        primary = validate_faces(faces)
        print(f"Wajah primer: bbox={primary.bbox}, confidence={primary.confidence:.2f}")
    except ValidationError as e:
        print(f"Validasi gagal: {e}")