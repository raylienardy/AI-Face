# backend/app/services/skin_analyzer.py

import random
import cv2
import numpy as np

# ------------------------------------------------------------
# Helper: crop area pipi dari landmark 68‑titik
# ------------------------------------------------------------
def _crop_cheek_patch(image, landmarks, side="left"):
    """
    Crop patch pipi kiri atau kanan.
    side: 'left' atau 'right'
    """
    if landmarks is None or len(landmarks) < 68:
        return None

    # Indeks landmark untuk area pipi
    if side == "left":
        # Gabungkan titik rahang bawah kiri, hidung, mata kiri
        indices = [1, 2, 3, 31, 36, 41, 48]  # sekitar pipi kiri
    else:
        indices = [13, 14, 15, 35, 45, 42, 54]  # sekitar pipi kanan

    pts = np.array([landmarks[i] for i in indices], dtype=np.float32)
    x_min = int(np.min(pts[:, 0])) - 15
    y_min = int(np.min(pts[:, 1])) - 10
    x_max = int(np.max(pts[:, 0])) + 15
    y_max = int(np.max(pts[:, 1])) + 10

    h, w = image.shape[:2]
    x_min = max(0, x_min)
    y_min = max(0, y_min)
    x_max = min(w, x_max)
    y_max = min(h, y_max)

    if x_max <= x_min or y_max <= y_min:
        return None
    return image[y_min:y_max, x_min:x_max]


# ------------------------------------------------------------
# Dummy model (placeholder)
# ------------------------------------------------------------
def _dummy_skin_score():
    """Skor acak antara 40–85."""
    return round(random.uniform(40, 85), 1)


# ------------------------------------------------------------
# Public API
# ------------------------------------------------------------
def analyze_skin(image, landmarks):
    """
    Analisis kualitas kulit wajah dari patch pipi.
    Saat ini menggunakan model dummy.
    Returns dict dengan kunci: quality, texture, tone.
    """
    left_patch = _crop_cheek_patch(image, landmarks, "left")
    right_patch = _crop_cheek_patch(image, landmarks, "right")

    if left_patch is None or right_patch is None:
        return {"error": "Could not crop cheek regions"}

    # Placeholder: skor acak
    return {
        "skin_quality": _dummy_skin_score(),
        "skin_texture": _dummy_skin_score(),
        "skin_tone": _dummy_skin_score()
    }