import os
import cv2
import logging
from fastapi import APIRouter, Query, HTTPException
from app.services.landmark_extractor import extract_landmarks
from app.services.geometry_analyzer import analyze_face_structure
from app.services.region_analyzer import (
    analyze_eyes, analyze_eyebrows, analyze_nose,
    analyze_mouth, analyze_jaw, analyze_cheek
)
from app.services.skin_analyzer import analyze_skin
from app.services.aggregator import aggregate_scores
from app.services.report_builder import generate_strengths_suggestions
from app.services.history_service import HistoryService
from app.schemas.report import (
    Report, FeatureScore, FaceStructure, ShapeScores,
    EyesReport, EyebrowsReport, NoseReport, MouthReport,
    JawReport, CheekReport, SkinReport, ReportResponse
)
from app.core import config
from app.services.face_data_extractor import extract_face_data


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

def generate_report_from_file(file_path: str) -> (Report, dict):
    img = cv2.imread(file_path)
    if img is None:
        raise HTTPException(400, "Cannot read image file")

    # Ekstrak data wajah untuk AI (geometry, regions, skin, embedding, measurements)
    face_data = extract_face_data(img)
    if "error" in face_data:
        raise HTTPException(422, face_data["error"])

    # Panggil AI provider untuk mendapatkan analisis lengkap
    overall = aggregate_scores(
        face_data.get("geometry", {}),
        face_data.get("regions", {}),
        face_data.get("skin", {}),
        face_data
    )

    # Ambil feature_scores dari hasil AI
    feature_scores = overall.get("feature_scores", {})
    strengths = overall.get("strengths", [])
    suggestions = overall.get("suggestions", [])

    def make_feature(val, conf=None):
        return FeatureScore(value=_num(val), confidence=conf)

    # Bangun Report menggunakan data dari AI
    report = Report(
        face_structure=FaceStructure(
            shape=ShapeScores(
                oval=_num(face_data["geometry"]["face_shape"].get("oval", 50)),
                round=_num(face_data["geometry"]["face_shape"].get("round", 50)),
                square=_num(face_data["geometry"]["face_shape"].get("square", 50)),
                heart=_num(face_data["geometry"]["face_shape"].get("heart", 50))
            ),
            symmetry=make_feature(feature_scores.get("facial_symmetry", {}).get("score", 50)),
            harmony=make_feature(feature_scores.get("facial_harmony", {}).get("score", 50))
        ),
        eyes=EyesReport(
            right_eye=make_feature(feature_scores.get("eyes", {}).get("score", 50)),
            left_eye=make_feature(feature_scores.get("eyes", {}).get("score", 50)),
            symmetry=make_feature(feature_scores.get("eyes", {}).get("score", 50))
        ),
        eyebrows=EyebrowsReport(
            right_eyebrow=make_feature(feature_scores.get("eyebrows", {}).get("score", 50)),
            left_eyebrow=make_feature(feature_scores.get("eyebrows", {}).get("score", 50)),
            symmetry=make_feature(feature_scores.get("eyebrows", {}).get("score", 50))
        ),
        nose=NoseReport(
            nose_width=make_feature(feature_scores.get("nose", {}).get("score", 50)),
            nose_length=make_feature(feature_scores.get("nose", {}).get("score", 50)),
            nose_balance=make_feature(feature_scores.get("nose", {}).get("score", 50))
        ),
        mouth=MouthReport(
            lip_shape=make_feature(feature_scores.get("lips", {}).get("score", 50)),
            lip_fullness=make_feature(feature_scores.get("lips", {}).get("score", 50)),
            lip_symmetry=make_feature(feature_scores.get("lips", {}).get("score", 50))
        ),
        jaw=JawReport(
            jawline=make_feature(feature_scores.get("jaw", {}).get("score", 50)),
            chin=make_feature(feature_scores.get("jaw", {}).get("score", 50)),
            mandible=make_feature(feature_scores.get("jaw", {}).get("score", 50))
        ),
        cheek=CheekReport(
            left_cheek=make_feature(feature_scores.get("cheekbones", {}).get("score", 50)),
            right_cheek=make_feature(feature_scores.get("cheekbones", {}).get("score", 50)),
            cheekbones=make_feature(feature_scores.get("cheekbones", {}).get("score", 50))
        ),
        skin=SkinReport(
            skin_quality=make_feature(feature_scores.get("skin", {}).get("score", 50)),
            skin_texture=make_feature(feature_scores.get("skin", {}).get("score", 50)),
            skin_tone=make_feature(feature_scores.get("skin", {}).get("score", 50))
        ),
        overall=FeatureScore(
            value=_num(overall.get("overall_score")),
            confidence=_num(overall.get("confidence"), 0.7)
        )
    )

    report.strengths = strengths
    report.suggestions = suggestions
    return report, feature_scores

@router.get("/report", response_model=ReportResponse)
async def get_report(file: str = Query(..., description="Filename hasil upload")):
    file_path = os.path.join(UPLOAD_DIR, file)
    if not os.path.exists(file_path):
        raise HTTPException(404, f"File '{file}' tidak ditemukan di server")

    try:
        report, feature_scores = generate_report_from_file(file_path)

        analysis_id = ""
        if config.ENABLE_HISTORY:
            history_service = HistoryService()
            image_path_for_db = file_path if config.ENABLE_HISTORY_IMAGES else ""
            analysis_id = history_service.create(
                image_path=image_path_for_db,
                report=report,
                model_version=config.MODEL_VERSION,
                preprocessing_version=config.PREPROCESSING_VERSION
            )

        if not config.ENABLE_HISTORY_IMAGES:
            try:
                os.remove(file_path)
                logger.info("Image removed after analysis")
            except Exception as e:
                logger.warning(f"Failed to remove uploaded image: {e}")

        response = ReportResponse(
            **report.model_dump(),
            analysis_id=analysis_id,
            feature_scores=feature_scores
        )
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating report")
        raise HTTPException(500, str(e))