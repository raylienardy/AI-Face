import os
import cv2
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.preprocessing import preprocess_image
from app.services.landmark_extractor import extract_landmarks
from app.services.geometry_analyzer import analyze_face_structure
from app.services.region_analyzer import (
    analyze_eyes, analyze_eyebrows, analyze_nose,
    analyze_mouth, analyze_jaw, analyze_cheek, analyze_all_regions
)
from app.services.skin_analyzer import analyze_skin
from app.services.aggregator import aggregate_scores
from app.services.report_builder import generate_strengths_suggestions
from app.schemas.report import (
    Report, FeatureScore, FaceStructure, ShapeScores,
    EyesReport, EyebrowsReport, NoseReport, MouthReport,
    JawReport, CheekReport, SkinReport
)

logger = logging.getLogger("faceai.api.analysis")
router = APIRouter(prefix="/api")

def _safe_region_analysis(image, landmarks, region_func):
    """Jalankan fungsi region, jika gagal kembalikan dict error."""
    try:
        return region_func(image, landmarks)
    except Exception as e:
        logger.warning(f"Region analysis failed: {e}")
        return {"error": str(e)}

def _num(value, default=50.0):
    """Ambil nilai numerik, jika bukan angka kembalikan default."""
    try:
        return float(value)
    except:
        return default

@router.post("/analyze", response_model=Report)
async def analyze_image(file: UploadFile = File(...)):
    temp_path = f"temp_analysis_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        img_orig = cv2.imread(temp_path)
        if img_orig is None:
            raise HTTPException(400, "Cannot read image")

        landmarks = extract_landmarks(img_orig)
        if landmarks is None:
            raise HTTPException(422, "No face detected")

        # --- 1. Geometry ---
        geometry = analyze_face_structure(landmarks)

        # --- 2. Regions ---
        regions = {
            "eyes": _safe_region_analysis(img_orig, landmarks, analyze_eyes),
            "eyebrows": _safe_region_analysis(img_orig, landmarks, analyze_eyebrows),
            "nose": _safe_region_analysis(img_orig, landmarks, analyze_nose),
            "mouth": _safe_region_analysis(img_orig, landmarks, analyze_mouth),
            "jaw": _safe_region_analysis(img_orig, landmarks, analyze_jaw),
            "cheek": _safe_region_analysis(img_orig, landmarks, analyze_cheek),
        }

        # --- 3. Skin ---
        skin = _safe_region_analysis(img_orig, landmarks, analyze_skin)

        # --- 4. Aggregate overall ---
        overall = aggregate_scores(geometry, regions, skin)

        # --- 5. Build report data sesuai skema ---
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

        # --- 6. Generate strengths & suggestions ---
        # Siapkan dictionary skor untuk report builder
        score_dict = {
            "face_structure": {
                "symmetry": report.face_structure.symmetry.value,
                "harmony": report.face_structure.harmony.value
            },
            "eyes": { "symmetry": report.eyes.symmetry.value },
            "eyebrows": { "symmetry": report.eyebrows.symmetry.value },
            "nose": {},
            "mouth": { "lip_fullness": report.mouth.lip_fullness.value },
            "jaw": { "jawline": report.jaw.jawline.value },
            "cheek": { "cheekbones": report.cheek.cheekbones.value },
            "skin": {
                "skin_quality": report.skin.skin_quality.value,
                "skin_texture": report.skin.skin_texture.value,
                "skin_tone": report.skin.skin_tone.value
            }
        }
        # Tambahkan semua field dari region (untuk aturan yang mungkin menggunakan field spesifik)
        for cat in ["eyes", "eyebrows", "nose", "mouth", "jaw", "cheek"]:
            if cat in regions and "error" not in regions[cat]:
                for k, v in regions[cat].items():
                    if isinstance(v, (int, float)):
                        score_dict.setdefault(cat, {})[k] = v
        # Untuk skin, tambahkan juga dari skin dict
        if "error" not in skin:
            for k, v in skin.items():
                if isinstance(v, (int, float)):
                    score_dict["skin"][k] = v

        strengths, suggestions = generate_strengths_suggestions(score_dict)
        report.strengths = strengths
        report.suggestions = suggestions

        return report

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in /analyze")
        raise HTTPException(500, str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)