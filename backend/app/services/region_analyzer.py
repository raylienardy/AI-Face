import random
import cv2
import numpy as np

# =====================================================
# Crop helper
# =====================================================
def crop_region(image, landmarks, indices, padding=10):
    """
    Crop area dari image berdasarkan indeks landmark.
    Args:
        image: array BGR
        landmarks: list of (x,y) minimal 68 titik
        indices: list of int, indeks landmark yang akan dijadikan bounding box
        padding: tambahan piksel di sekeliling bounding box
    Returns:
        patch (numpy array) atau None jika landmark invalid
    """
    if landmarks is None or len(landmarks) < max(indices)+1:
        return None
    pts = np.array([landmarks[i] for i in indices], dtype=np.float32)
    x_min = int(np.min(pts[:, 0])) - padding
    y_min = int(np.min(pts[:, 1])) - padding
    x_max = int(np.max(pts[:, 0])) + padding
    y_max = int(np.max(pts[:, 1])) + padding
    h, w = image.shape[:2]
    x_min = max(0, x_min)
    y_min = max(0, y_min)
    x_max = min(w, x_max)
    y_max = min(h, y_max)
    if x_max <= x_min or y_max <= y_min:
        return None
    return image[y_min:y_max, x_min:x_max]


# =====================================================
# Dummy model – nanti diganti dengan CNN sebenarnya
# =====================================================
def _dummy_score():
    """Skor acak antara 40–80 agar terlihat realistis."""
    return round(random.uniform(40, 80), 1)


# =====================================================
# Region analyzers
# =====================================================
def analyze_eyes(image, landmarks):
    """Analisis mata (bentuk, ukuran, jarak)."""
    patch_right = crop_region(image, landmarks, list(range(36, 42)))  # mata kanan
    patch_left  = crop_region(image, landmarks, list(range(42, 48)))  # mata kiri
    if patch_right is None or patch_left is None:
        return {"error": "Could not crop eye regions"}
    # Placeholder: skor acak
    return {
        "right_eye": _dummy_score(),
        "left_eye": _dummy_score(),
        "symmetry": _dummy_score()
    }


def analyze_eyebrows(image, landmarks):
    """Analisis alis (bentuk, ketebalan, posisi)."""
    patch_right = crop_region(image, landmarks, list(range(17, 22)))
    patch_left  = crop_region(image, landmarks, list(range(22, 27)))
    if patch_right is None or patch_left is None:
        return {"error": "Could not crop eyebrow regions"}
    return {
        "right_eyebrow": _dummy_score(),
        "left_eyebrow": _dummy_score(),
        "symmetry": _dummy_score()
    }


def analyze_nose(image, landmarks):
    """Analisis hidung (lebar, panjang, keseimbangan)."""
    patch = crop_region(image, landmarks, list(range(27, 36)))
    if patch is None:
        return {"error": "Could not crop nose region"}
    return {
        "nose_width": _dummy_score(),
        "nose_length": _dummy_score(),
        "nose_balance": _dummy_score()
    }


def analyze_mouth(image, landmarks):
    """Analisis mulut (bentuk, kepenuhan, simetri)."""
    patch = crop_region(image, landmarks, list(range(48, 68)))
    if patch is None:
        return {"error": "Could not crop mouth region"}
    return {
        "lip_shape": _dummy_score(),
        "lip_fullness": _dummy_score(),
        "lip_symmetry": _dummy_score()
    }


def analyze_jaw(image, landmarks):
    """Analisis rahang (jawline, dagu, mandible)."""
    # Gabungkan titik rahang dan dagu
    indices = list(range(0, 17))  # jawline
    patch = crop_region(image, landmarks, indices)
    if patch is None:
        return {"error": "Could not crop jaw region"}
    return {
        "jawline": _dummy_score(),
        "chin": _dummy_score(),
        "mandible": _dummy_score()
    }


def analyze_cheek(image, landmarks):
    """Analisis pipi (cheekbones, midface)."""
    # Perkiraan area pipi: antara mata dan mulut, di samping hidung
    # Kita buat dua patch: kiri & kanan dari titik tengah
    left_indices = [1, 2, 3, 31, 48]   # beberapa titik kiri
    right_indices = [15, 14, 13, 35, 54] # beberapa titik kanan
    patch_left = crop_region(image, landmarks, left_indices)
    patch_right = crop_region(image, landmarks, right_indices)
    if patch_left is None or patch_right is None:
        return {"error": "Could not crop cheek regions"}
    return {
        "left_cheek": _dummy_score(),
        "right_cheek": _dummy_score(),
        "cheekbones": _dummy_score()
    }


def analyze_all_regions(image, landmarks):
    """Jalankan semua region analyzer dan kembalikan dict."""
    return {
        "eyes": analyze_eyes(image, landmarks),
        "eyebrows": analyze_eyebrows(image, landmarks),
        "nose": analyze_nose(image, landmarks),
        "mouth": analyze_mouth(image, landmarks),
        "jaw": analyze_jaw(image, landmarks),
        "cheek": analyze_cheek(image, landmarks)
    }