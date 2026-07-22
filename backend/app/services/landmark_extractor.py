import logging
from app.services.detector import detector

logger = logging.getLogger("faceai.landmarks")

def extract_landmarks(image):
    """
    Ekstrak 106‑titik landmark dari gambar BGR.
    Model 2d106det harus sudah termuat (buffalo_l menyediakannya).
    Returns list of (x, y) dalam pixel, atau None jika wajah tidak terdeteksi.
    """
    faces = detector.detect(image)
    if not faces:
        logger.warning("No face detected for landmark extraction")
        return None

    # Gunakan wajah primer (confidence tertinggi)
    primary = max(faces, key=lambda f: f.confidence)
    if not primary.landmarks:
        logger.warning("Landmarks not available")
        return None

    # InsightFace buffalo_l menyediakan 5 titik dari model deteksi,
    # tetapi model 2d106det memberikan 106 titik. Kita ambil dari FaceObject.
    # FaceObject.landmarks berisi 5 titik standar. Untuk 106 titik,
    # kita perlu menggunakan model landmark langsung.
    # Karena 2d106det sudah dimuat oleh buffalo_l, kita bisa akses melalui detector.
    lm_model = detector.get_landmark_model()
    if lm_model is None:
        # Fallback: gunakan 5 titik dari FaceObject
        logger.warning("106‑point landmark model not loaded, using 5‑point")
        return primary.landmarks

    # Dapatkan landmark 106 titik
    landmarks_106 = lm_model.get(image, primary.bbox)
    if landmarks_106 is None or len(landmarks_106) == 0:
        return primary.landmarks  # fallback

    return landmarks_106[0].tolist()  # list of (x, y)