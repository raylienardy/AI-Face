import numpy as np
import logging

logger = logging.getLogger("faceai.geometry")

# Indeks landmark untuk region wajah (berdasarkan 106 titik InsightFace)
# Referensi: https://github.com/deepinsight/insightface/tree/master/alignment/coordinateReg
#  0–16  : rahang (jawline)
# 17–21  : alis kanan
# 22–26  : alis kiri
# 27–35  : hidung
# 36–41  : mata kanan
# 42–47  : mata kiri
# 48–67  : mulut
# 68–77  : kontur wajah bagian bawah? (tergantung versi)
# 78–87  : kontur wajah (tambahan)
# 88–95  : iris mata
# 96–105 : bibir bagian dalam

# Untuk geometri dasar, kita gunakan subset:
JAW_POINTS = list(range(0, 17))      # 0-16
RIGHT_EYE = list(range(36, 42))      # 36-41
LEFT_EYE = list(range(42, 48))       # 42-47
NOSE = list(range(27, 36))           # 27-35
MOUTH = list(range(48, 68))          # 48-67
RIGHT_BROW = list(range(17, 22))     # 17-21
LEFT_BROW = list(range(22, 27))      # 22-26


def analyze_face_structure(landmarks):
    """
    Menganalisis struktur wajah dari 106‑titik landmark.
    Returns dict dengan skor 0‑100 untuk: shape, symmetry, harmony.
    """
    if not landmarks or len(landmarks) < 68:
        logger.warning("Landmark tidak cukup, minimal 68 titik")
        return {
            "face_shape": {"oval": 50, "round": 50, "square": 50, "heart": 50},
            "symmetry": 50,
            "harmony": 50
        }

    pts = np.array(landmarks)

    # 1. Face Shape – berdasarkan rasio lebar/tinggi wajah dan bentuk rahang
    shape_scores = _classify_face_shape(pts)

    # 2. Symmetry – perbedaan sisi kiri‑kanan
    symmetry = _compute_symmetry(pts)

    # 3. Harmony – berdasarkan golden ratio (φ)
    harmony = _compute_harmony(pts)

    return {
        "face_shape": shape_scores,
        "symmetry": symmetry,
        "harmony": harmony
    }


def _classify_face_shape(pts):
    """
    Klasifikasi bentuk wajah berdasarkan proporsi.
    Menggunakan rasio lebar/tinggi, lebar dahi/rahang, dan bentuk rahang.
    """
    # Tinggi wajah: dari titik teratas alis (tengah) ke dagu (titik 8)
    brow_top = np.mean([pts[19], pts[24]], axis=0)  # tengah alis
    chin = pts[8]  # dagu
    face_height = np.linalg.norm(brow_top - chin)

    # Lebar wajah: jarak antar titik terluar rahang (0 dan 16)
    face_width = np.linalg.norm(pts[0] - pts[16])

    # Lebar dahi: jarak antar titik terluar alis (17 dan 26)
    forehead_width = np.linalg.norm(pts[17] - pts[26])

    # Lebar rahang: jarak antar titik rahang bawah (5 dan 11)
    jaw_width = np.linalg.norm(pts[5] - pts[11])

    ratio_wh = face_width / max(face_height, 1)
    ratio_fj = forehead_width / max(jaw_width, 1)
    ratio_fw = forehead_width / max(face_width, 1)
    ratio_jw = jaw_width / max(face_width, 1)

    # Heuristik bentuk wajah
    oval_score = 100 * (1 - abs(ratio_wh - 1.33) / 0.4)  # ideal ~1.33 (oval)
    round_score = 100 * (1 - abs(ratio_wh - 1.0) / 0.3)  # round ~1.0
    square_score = 100 * (1 - abs(ratio_jw - 0.85) / 0.2) # square: rahang lebar
    heart_score = 100 * (1 - abs(ratio_fw - 0.95) / 0.15) # heart: dahi lebar, dagu lancip

    # Batasi ke 0‑100
    scores = {
        "oval": max(0, min(100, int(oval_score))),
        "round": max(0, min(100, int(round_score))),
        "square": max(0, min(100, int(square_score))),
        "heart": max(0, min(100, int(heart_score)))
    }
    return scores


def _compute_symmetry(pts):
    """
    Hitung indeks simetri wajah (0‑100).
    Membandingkan landmark sisi kiri dan kanan yang dicerminkan.
    """
    # Titik tengah wajah (hidung atas)
    center = pts[27]  # pangkal hidung

    # Daftar pasangan landmark kiri‑kanan (indeks)
    pairs = [
        (36, 45),  # mata kanan vs kiri (sudut luar)
        (39, 42),  # mata (sudut dalam)
        (17, 26),  # alis ujung luar
        (19, 24),  # alis tengah
        (48, 54),  # mulut sudut
        (31, 35),  # hidung sayap
        (0, 16),   # rahang sudut luar
        (5, 11),   # rahang tengah
        (2, 14),   # rahang bawah
    ]

    diffs = []
    for left_idx, right_idx in pairs:
        left = pts[left_idx]
        right = pts[right_idx]

        # Cerminkan kiri ke kanan: x_kiri_cermin = 2*center_x - x_kiri
        left_mirrored_x = 2 * center[0] - left[0]
        left_mirrored = np.array([left_mirrored_x, left[1]])

        # Jarak Euclidean antara kiri tercermin dan kanan asli
        dist = np.linalg.norm(left_mirrored - right)
        diffs.append(dist)

    # Rata‑rata perbedaan, normalisasi terhadap lebar wajah
    face_width = np.linalg.norm(pts[0] - pts[16])
    if face_width == 0:
        return 50
    avg_diff = np.mean(diffs) / face_width

    # Konversi ke skor 0‑100: semakin kecil perbedaan, semakin simetris
    symmetry = max(0, min(100, int(100 * (1 - avg_diff * 5))))
    return symmetry


def _compute_harmony(pts):
    """
    Hitung skor harmoni wajah berdasarkan golden ratio (φ = 1.618).
    Membandingkan proporsi wajah terhadap golden ratio.
    """
    phi = 1.618

    # 1. Tinggi wajah : lebar wajah (ideal 1.618)
    chin = pts[8]
    brow_top = np.mean([pts[19], pts[24]], axis=0)
    face_h = np.linalg.norm(brow_top - chin)
    face_w = np.linalg.norm(pts[0] - pts[16])
    ratio1 = face_h / max(face_w, 1)

    # 2. Jarak mata‑mulut : jarak mata‑dagu (ideal 0.618 inverse)
    eye_center = np.mean([pts[36], pts[45]], axis=0)
    mouth_center = np.mean([pts[48], pts[54]], axis=0)
    dist_eye_mouth = np.linalg.norm(eye_center - mouth_center)
    dist_eye_chin = np.linalg.norm(eye_center - chin)
    ratio2 = dist_eye_mouth / max(dist_eye_chin, 1)

    # 3. Lebar mulut : lebar hidung (ideal 1.618)
    mouth_w = np.linalg.norm(pts[48] - pts[54])
    nose_w = np.linalg.norm(pts[31] - pts[35])
    ratio3 = mouth_w / max(nose_w, 1)

    # Hitung deviasi dari golden ratio
    ideal_ratios = [phi, 1/phi, phi]
    actual_ratios = [ratio1, ratio2, ratio3]
    deviations = [abs(a - i)/i for a, i in zip(actual_ratios, ideal_ratios)]

    avg_dev = np.mean(deviations)
    harmony = max(0, min(100, int(100 * (1 - avg_dev * 3))))
    return harmony