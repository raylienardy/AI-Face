import cv2
import numpy as np
from app.preprocessing.detector import detect_faces

def test_detect_faces_on_sample():
    # Buat gambar hitam 640x480 dengan wajah tiruan (tidak akan terdeteksi)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    faces = detect_faces(img)
    assert len(faces) == 0  # Tidak ada wajah

def test_detect_faces_with_real_image():
    # Gunakan gambar wajah nyata dari folder tests/ atau uploads/
    # Contoh: img = cv2.imread('tests/sample_face.jpg')
    # faces = detect_faces(img)
    # assert len(faces) > 0
    # assert 'bbox' in faces[0]
    # assert 'landmarks' in faces[0]
    # assert len(faces[0]['landmarks']) == 5
    pass  # Ganti dengan path gambar yang valid