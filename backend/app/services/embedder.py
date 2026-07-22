import cv2
import numpy as np
from app.services.detector import detector

_embedding_cache = {}

def extract_embedding(aligned_face: np.ndarray) -> np.ndarray:
    """Ekstrak embedding 512‑d dari gambar wajah yang sudah di‑align (BGR)."""
    img_hash = hash(aligned_face.tobytes())
    if img_hash in _embedding_cache:
        return _embedding_cache[img_hash]

    # Ambil model recognition
    rec_model = detector.get_recognition_model()

    # Resize ke 112×112 (ukuran input model)
    img_resized = cv2.resize(aligned_face, (112, 112), interpolation=cv2.INTER_LINEAR)

    # Ekstrak fitur
    embedding = rec_model.get_feat(img_resized)

    _embedding_cache[img_hash] = embedding
    return embedding