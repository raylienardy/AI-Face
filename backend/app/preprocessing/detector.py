import cv2
import numpy as np
import insightface

# ==================================================
#  Singleton Detector (SCRFD)
# ==================================================
_detector = None

def _get_detector(model_name: str = 'buffalo_l'):
    global _detector
    if _detector is None:
        # buffalo_l package contains SCRFD 10g and 2.5g; use the one with landmarks
        _detector = insightface.model_zoo.get_model(model_name)
        _detector.prepare(ctx_id=-1)  # CPU
    return _detector


def detect_faces(
    image: np.ndarray,
    model_name: str = 'buffalo_l',
    det_thresh: float = 0.5
) -> list:
    """
    Deteksi wajah dan landmark 5‑titik menggunakan InsightFace SCRFD.

    Args:
        image: numpy array (BGR, uint8)
        model_name: nama model InsightFace (default 'buffalo_l')
        det_thresh: threshold confidence (0‑1)

    Returns:
        list of dict: setiap dict memiliki keys:
            'bbox'       : (x, y, w, h)
            'confidence' : float
            'landmarks'  : list of (x,y) – 5 titik:
                [left_eye, right_eye, nose, mouth_left, mouth_right]
    """
    if image is None or image.size == 0:
        return []

    # Pastikan input adalah BGR uint8
    if image.dtype != np.uint8:
        image = image.astype(np.uint8)
    if len(image.shape) == 3 and image.shape[2] == 3:
        if image.flags['C_CONTIGUOUS'] is False:
            image = np.ascontiguousarray(image)

    detector = _get_detector(model_name)
    # Deteksi: mengembalikan (bboxes, landmarks) atau None
    result = detector.detect(image, thresh=det_thresh)

    faces = []
    if result is not None and len(result) == 2:
        bboxes, landmarks = result
        if bboxes is not None and len(bboxes) > 0:
            # bboxes: array [N,5] (x1,y1,x2,y2,score)
            # landmarks: array [N,5,2]
            for i in range(len(bboxes)):
                x1, y1, x2, y2, score = bboxes[i]
                w = x2 - x1
                h = y2 - y1
                face = {
                    'bbox': (int(x1), int(y1), int(w), int(h)),
                    'confidence': float(score),
                    'landmarks': [
                        (float(landmarks[i][j][0]), float(landmarks[i][j][1]))
                        for j in range(5)
                    ]
                }
                faces.append(face)
    return faces