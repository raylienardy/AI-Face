import sys
sys.path.insert(0, '.')
from app.services.report_builder import generate_strengths_suggestions

# Contoh skor dari M9 (simulasi)
scores = {
    "face_structure": {
        "shape": {"oval": 70, "round": 50, "square": 30, "heart": 40},
        "symmetry": 85,
        "harmony": 78
    },
    "eyes": {
        "right_eye": 72,
        "left_eye": 70,
        "symmetry": 90
    },
    "eyebrows": {
        "right_eyebrow": 65,
        "left_eyebrow": 68,
        "symmetry": 88
    },
    "nose": {
        "nose_width": 75,
        "nose_length": 60,
        "nose_balance": 70
    },
    "mouth": {
        "lip_shape": 80,
        "lip_fullness": 45,
        "lip_symmetry": 85
    },
    "jaw": {
        "jawline": 85,
        "chin": 70,
        "mandible": 55
    },
    "cheek": {
        "left_cheek": 60,
        "right_cheek": 65,
        "cheekbones": 82
    },
    "skin": {
        "skin_quality": 45,
        "skin_texture": 60,
        "skin_tone": 75
    }
}

strengths, suggestions = generate_strengths_suggestions(scores)
print("Strengths:", strengths)
print("Suggestions:", suggestions)