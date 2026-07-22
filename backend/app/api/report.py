import os
import cv2
import logging
from fastapi import APIRouter, Query, HTTPException
from app.services.landmark_extractor import extract_landmarks
from app.services.geometry_analyzer import analyze_face_structure
from app.services.region_analyzer import analyze_eyes, analyze_eyebrows, analyze_nose, analyze_mouth, analyze_jaw, analyze_cheek
from app.services.skin_analyzer import analyze_skin
from app.services.aggregator import aggregate_scores
from app.services.report_builder import generate_strengths_suggestions
from app.schemas.report import (
    Report, FeatureScore, FaceStructure, ShapeScores,
    EyesReport, EyebrowsReport, NoseReport, MouthReport,
    JawReport, CheekReport, SkinReport
)

logger = logging.getLogger("faceai.api.report")
router = APIRouter(prefix="/api")

UPLOAD_DIR = "uploads"

def _safe_region_analysis(image, landmarks, region_func):
    try:
        return region_func(image, landmarks)
    except Exception as e:
        logger.warning(f"Region analysis failed: {e}")
        return {"error": str(e)}

def _num(value, default=50.0):
    try:
        return float(value)
    except:
        return default

def generate_report_from_file(file_path: str) -> Report:
    img = cv2.imread(file_path)
    if img is None:
        raise HTTPException(400, "Cannot read image file")

    landmarks = extract_landmarks(img)
    if landmarks is None:
        raise HTTPException(422, "No face detected in the uploaded image")

    # Geometry
    geometry = analyze_face_structure(landmarks)

    # Regions
    regions = {
        "eyes": _safe_region_analysis(img, landmarks, analyze_eyes),
        "eyebrows": _safe_region_analysis(img, landmarks, analyze_eyebrows),
        "nose": _safe_region_analysis(img, landmarks, analyze_nose),
        "mouth": _safe_region_analysis(img, landmarks, analyze_mouth),
        "jaw": _safe_region_analysis(img, landmarks, analyze_jaw),
        "cheek": _safe_region_analysis(img, landmarks, analyze_cheek),
    }
    skin = _safe_region_analysis(img, landmarks, analyze_skin)

    overall = aggregate_scores(geometry, regions, skin)

    def make_feature(val, conf=None):
        return FeatureScore(value=_num(val), confidence=conf)

    report = Report(
        face_structure=FaceStructure(
            shape=ShapeScores(
                oval=_num(geometry["face_shape"].get("oval")),
                round=_num(geometry["face_shape"].get("round")),
                square=_num(geometry["face_shape"].get("square")),
                heart=_num(geometry["face_shape"].get("heart"))
            ),
            symmetry=make_feature(geometry.get("symmetry")),
            harmony=make_feature(geometry.get("harmony"))
        ),
        eyes=EyesReport(
            right_eye=make_feature(regions["eyes"].get("right_eye")),
            left_eye=make_feature(regions["eyes"].get("left_eye")),
            symmetry=make_feature(regions["eyes"].get("symmetry"))
        ),
        eyebrows=EyebrowsReport(
            right_eyebrow=make_feature(regions["eyebrows"].get("right_eyebrow")),
            left_eyebrow=make_feature(regions["eyebrows"].get("left_eyebrow")),
            symmetry=make_feature(regions["eyebrows"].get("symmetry"))
        ),
        nose=NoseReport(
            nose_width=make_feature(regions["nose"].get("nose_width")),
            nose_length=make_feature(regions["nose"].get("nose_length")),
            nose_balance=make_feature(regions["nose"].get("nose_balance"))
        ),
        mouth=MouthReport(
            lip_shape=make_feature(regions["mouth"].get("lip_shape")),
            lip_fullness=make_feature(regions["mouth"].get("lip_fullness")),
            lip_symmetry=make_feature(regions["mouth"].get("lip_symmetry"))
        ),
        jaw=JawReport(
            jawline=make_feature(regions["jaw"].get("jawline")),
            chin=make_feature(regions["jaw"].get("chin")),
            mandible=make_feature(regions["jaw"].get("mandible"))
        ),
        cheek=CheekReport(
            left_cheek=make_feature(regions["cheek"].get("left_cheek")),
            right_cheek=make_feature(regions["cheek"].get("right_cheek")),
            cheekbones=make_feature(regions["cheek"].get("cheekbones"))
        ),
        skin=SkinReport(
            skin_quality=make_feature(skin.get("skin_quality")),
            skin_texture=make_feature(skin.get("skin_texture")),
            skin_tone=make_feature(skin.get("skin_tone"))
        ),
        overall=FeatureScore(value=_num(overall.get("overall_attractiveness")),
                             confidence=_num(overall.get("confidence"), 0.7))
    )

    # Strengths & suggestions
    score_dict = {
        "face_structure": {"symmetry": report.face_structure.symmetry.value, "harmony": report.face_structure.harmony.value},
        "eyes": {"symmetry": report.eyes.symmetry.value},
        "eyebrows": {"symmetry": report.eyebrows.symmetry.value},
        "mouth": {"lip_fullness": report.mouth.lip_fullness.value},
        "jaw": {"jawline": report.jaw.jawline.value},
        "cheek": {"cheekbones": report.cheek.cheekbones.value},
        "skin": {"skin_quality": report.skin.skin_quality.value, "skin_texture": report.skin.skin_texture.value, "skin_tone": report.skin.skin_tone.value}
    }
    # tambahkan field lain
    for cat in ["eyes","eyebrows","nose","mouth","jaw","cheek"]:
        if cat in regions and "error" not in regions[cat]:
            for k,v in regions[cat].items():
                if isinstance(v, (int,float)):
                    score_dict.setdefault(cat, {})[k] = v
    if "error" not in skin:
        for k,v in skin.items():
            if isinstance(v, (int,float)):
                score_dict["skin"][k] = v

    strengths, suggestions = generate_strengths_suggestions(score_dict)
    report.strengths = strengths
    report.suggestions = suggestions
    return report

@router.get("/report", response_model=Report)
async def get_report(file: str = Query(..., description="Filename hasil upload")):
    file_path = os.path.join(UPLOAD_DIR, file)
    if not os.path.exists(file_path):
        raise HTTPException(404, f"File '{file}' tidak ditemukan di server")
    try:
        report = generate_report_from_file(file_path)
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating report")
        raise HTTPException(500, str(e))