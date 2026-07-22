# backend/tests/test_schema.py

import sys
sys.path.insert(0, '.')
from app.schemas.report import (
    Report,
    FeatureScore,
    FaceStructure,
    ShapeScores,
    EyesReport,
    EyebrowsReport,
    NoseReport,
    MouthReport,
    JawReport,
    CheekReport,
    SkinReport,
)

# Bangun data dummy
dummy = Report(
    face_structure=FaceStructure(
        shape=ShapeScores(oval=70, round=50, square=30, heart=40),
        symmetry=FeatureScore(value=85, confidence=0.9),
        harmony=FeatureScore(value=78, confidence=0.85)
    ),
    eyes=EyesReport(
        right_eye=FeatureScore(value=72, confidence=0.8),
        left_eye=FeatureScore(value=70, confidence=0.8),
        symmetry=FeatureScore(value=90, confidence=0.9)
    ),
    eyebrows=EyebrowsReport(
        right_eyebrow=FeatureScore(value=65, confidence=0.7),
        left_eyebrow=FeatureScore(value=68, confidence=0.7),
        symmetry=FeatureScore(value=88, confidence=0.8)
    ),
    nose=NoseReport(
        nose_width=FeatureScore(value=75, confidence=0.85),
        nose_length=FeatureScore(value=60, confidence=0.8),
        nose_balance=FeatureScore(value=70, confidence=0.8)
    ),
    mouth=MouthReport(
        lip_shape=FeatureScore(value=80, confidence=0.9),
        lip_fullness=FeatureScore(value=65, confidence=0.8),
        lip_symmetry=FeatureScore(value=85, confidence=0.9)
    ),
    jaw=JawReport(
        jawline=FeatureScore(value=82, confidence=0.9),
        chin=FeatureScore(value=70, confidence=0.8),
        mandible=FeatureScore(value=55, confidence=0.7)
    ),
    cheek=CheekReport(
        left_cheek=FeatureScore(value=60, confidence=0.75),
        right_cheek=FeatureScore(value=65, confidence=0.75),
        cheekbones=FeatureScore(value=78, confidence=0.85)
    ),
    skin=SkinReport(
        skin_quality=FeatureScore(value=70, confidence=0.8),
        skin_texture=FeatureScore(value=65, confidence=0.7),
        skin_tone=FeatureScore(value=75, confidence=0.8)
    ),
    overall=FeatureScore(value=80, confidence=0.88),
    strengths=[],
    suggestions=[]
)

# Serialisasi ke JSON (Pydantic V2)
print(dummy.model_dump_json(indent=2))