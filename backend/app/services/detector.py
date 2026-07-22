import logging
import numpy as np
import insightface
from app.core import config

logger = logging.getLogger("faceai.detector")

class FaceObject:
    """Data class untuk hasil deteksi wajah."""
    def __init__(self, bbox, confidence, landmarks):
        self.bbox = bbox          # [x1, y1, x2, y2] (int)
        self.confidence = confidence
        self.landmarks = landmarks # array (5,2) atau (6,2) titik landmark

class Detector:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def _initialize(self):
        if self._initialized:
            return
        logger.info("Loading InsightFace detection model: %s", config.DETECTION_MODEL_NAME)
        # InsightFace akan mengunduh model jika belum ada di ~/.insightface
        self.model = insightface.app.FaceAnalysis(
            name=config.DETECTION_MODEL_NAME,
            providers=['CPUExecutionProvider']  # gunakan CPU; jika ada GPU bisa 'CUDAExecutionProvider'
        )
        ctx_id = -1  # CPU
        self.model.prepare(ctx_id=ctx_id)
        self._initialized = True
        logger.info("Detection model loaded successfully")

    def detect(self, image: np.ndarray) -> list[FaceObject]:
        """
        Deteksi wajah dalam gambar (BGR numpy array).
        Returns list of FaceObject.
        """
        self._initialize()
        faces = self.model.get(image)
        results = []
        for face in faces:
            if face.det_score >= config.DETECTION_CONFIDENCE_THRESHOLD:
                bbox = face.bbox.astype(int).tolist()  # [x1,y1,x2,y2]
                landmarks = face.kps                  # (5,2) 5 titik landmark
                results.append(FaceObject(
                    bbox=bbox,
                    confidence=float(face.det_score),
                    landmarks=landmarks.tolist() if landmarks is not None else None
                ))
        return results
    
    def get_recognition_model(self):
        """Mengembalikan model recognition (ArcFace/w600k_r50)."""
        self._initialize()
        return self.model.models['recognition']
      
    def get_landmark_model(self):
        """Mengembalikan model landmark 106‑titik (2d106det)."""
        self._initialize()
        return self.model.models.get('landmark_2d_106', None)

# Singleton instance
detector = Detector()