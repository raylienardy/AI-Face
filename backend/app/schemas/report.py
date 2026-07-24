from pydantic import BaseModel, Field
from typing import Dict, List, Optional

# ---------------------------------------------------------------
# Sub‑komponen skor
# ---------------------------------------------------------------
class FeatureScore(BaseModel):
    """Skor untuk satu fitur spesifik."""
    value: float = Field(..., ge=0, le=100, description="Nilai skor (0‑100)")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Tingkat keyakinan (0.0‑1.0)")

class ShapeScores(BaseModel):
    """Skor untuk kemiripan bentuk wajah."""
    oval: float = Field(..., ge=0, le=100)
    round: float = Field(..., ge=0, le=100)
    square: float = Field(..., ge=0, le=100)
    heart: float = Field(..., ge=0, le=100)

class FaceStructure(BaseModel):
    """Struktur dan proporsi wajah."""
    shape: ShapeScores
    symmetry: FeatureScore
    harmony: FeatureScore

class EyesReport(BaseModel):
    right_eye: FeatureScore
    left_eye: FeatureScore
    symmetry: FeatureScore

class EyebrowsReport(BaseModel):
    right_eyebrow: FeatureScore
    left_eyebrow: FeatureScore
    symmetry: FeatureScore

class NoseReport(BaseModel):
    nose_width: FeatureScore
    nose_length: FeatureScore
    nose_balance: FeatureScore

class MouthReport(BaseModel):
    lip_shape: FeatureScore
    lip_fullness: FeatureScore
    lip_symmetry: FeatureScore

class JawReport(BaseModel):
    jawline: FeatureScore
    chin: FeatureScore
    mandible: FeatureScore

class CheekReport(BaseModel):
    left_cheek: FeatureScore
    right_cheek: FeatureScore
    cheekbones: FeatureScore

class SkinReport(BaseModel):
    skin_quality: FeatureScore
    skin_texture: FeatureScore
    skin_tone: FeatureScore

# ---------------------------------------------------------------
# Laporan utama
# ---------------------------------------------------------------
class Report(BaseModel):
    """Laporan analisis wajah lengkap untuk dikirim ke frontend."""
    face_structure: FaceStructure
    eyes: EyesReport
    eyebrows: EyebrowsReport
    nose: NoseReport
    mouth: MouthReport
    jaw: JawReport
    cheek: CheekReport
    skin: SkinReport
    overall: FeatureScore
    strengths: List[str] = Field(default_factory=list, description="Daftar kekuatan (belum diisi sebelum Stage 10.2)")
    suggestions: List[str] = Field(default_factory=list, description="Daftar saran perbaikan (belum diisi sebelum Stage 10.2)")

class ReportResponse(Report):
    analysis_id: str
    feature_scores: dict = {}