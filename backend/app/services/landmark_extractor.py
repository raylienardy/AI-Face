import logging
import numpy as np
from app.services.detector import detector

logger = logging.getLogger("faceai.landmarks")

def extract_landmarks(image):
    """
    Extract 68‑point 2D landmarks from a BGR image.
    Uses the 1k3d68 model; falls back to 5‑point if unavailable.
    """
    detector._initialize()
    raw_faces = detector.model.get(image)

    if not raw_faces:
        logger.warning("No face detected")
        return None

    primary = max(raw_faces, key=lambda f: f.det_score)

    # Coba model 68‑titik 3D (1k3d68)
    lm_68_model = detector.model.models.get('landmark_3d_68')
    if lm_68_model is not None:
        landmarks_68_3d = lm_68_model.get(image, primary)
        if landmarks_68_3d is not None and len(landmarks_68_3d) > 0:
            # Bisa berupa list, array, atau bentuk lain
            if isinstance(landmarks_68_3d, list):
                lm_data = np.array(landmarks_68_3d[0])
            else:
                lm_data = np.array(landmarks_68_3d)

            # Jika output berupa vektor 1D, reshape ke (68,3)
            if lm_data.ndim == 1:
                if lm_data.size == 68 * 3:
                    lm_data = lm_data.reshape(68, 3)
                elif lm_data.size == 68 * 2:
                    lm_data = lm_data.reshape(68, 2)
                else:
                    logger.warning("Unexpected 1D landmarks shape: %s", lm_data.shape)
                    return None

            if lm_data.ndim == 2 and lm_data.shape[1] >= 2:
                landmarks_2d = lm_data[:, :2].tolist()
                return landmarks_2d

    # Fallback ke 5‑titik (kps)
    if hasattr(primary, 'kps') and primary.kps is not None:
        return primary.kps.tolist()

    logger.warning("No landmarks available")
    return None