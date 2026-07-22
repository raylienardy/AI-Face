import numpy as np
import cv2
from insightface.app import FaceAnalysis

# Inisialisasi hanya untuk deteksi + landmark (buffalo_sc punya det_500m.onnx + 5‑titik landmark)
# Kita nonaktifkan recognition dengan mengambil model deteksi saja.
_detector = None

def _get_detector():
    global _detector
    if _detector is None:
        # Buat FaceAnalysis tanpa recognition
        _detector = FaceAnalysis(
            name='buffalo_sc',
            providers=['CPUExecutionProvider']
        )
        # Nonaktifkan recognition agar tidak memuat model besar
        _detector.prepare(ctx_id=0, det_size=(640, 640), det_thresh=0.5)
        # Hapus model recognition dari internal untuk mencegah crash
        if hasattr(_detector, 'models'):
            _detector.models.pop('recognition', None)
    return _detector

def detect_faces(image, threshold=0.5):
    """
    Deteksi wajah pada gambar (BGR numpy array atau path file).
    Mengembalikan list of dict:
        {
            'bbox': (x1, y1, x2, y2),       # koordinat absolut
            'landmarks': [                   # 5 titik (x,y)
                (left_eye_x, left_eye_y),
                (right_eye_x, right_eye_y),
                (nose_x, nose_y),
                (mouth_left_x, mouth_left_y),
                (mouth_right_x, mouth_right_y)
            ],
            'confidence': float
        }
    Jika tidak ada wajah, return [].
    """
    if isinstance(image, str):
        img = cv2.imread(image)
        if img is None:
            raise FileNotFoundError(f"Image not found: {image}")
        image = img

    detector = _get_detector()
    faces = detector.get(image)

    results = []
    for face in faces:
        if face.det_score < threshold:
            continue
        bbox = face.bbox.astype(int)  # (x1,y1,x2,y2)
        landmarks = face.kps.astype(int) if hasattr(face, 'kps') and face.kps is not None else None
        if landmarks is not None:
            landmarks = [(int(pt[0]), int(pt[1])) for pt in landmarks]
        else:
            landmarks = []

        results.append({
            'bbox': tuple(bbox),
            'landmarks': landmarks,
            'confidence': float(face.det_score)
        })

    return results