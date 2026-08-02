"""
Aggregator yang menggunakan AI Provider Router.
"""
import logging
from app.services.ai_providers import router

logger = logging.getLogger("faceai.aggregator")


def aggregate_scores(geometry, regions, skin, face_data: dict = None):
    if face_data is None:
        face_data = {"geometry": geometry, "regions": regions, "skin": skin}

    logger.info("=== Memulai AI Analysis ===")
    result = router.analyze(face_data)
    logger.info(f"=== AI Analysis Selesai (overall: {result.get('overall_score')}) ===")

    return {
        "overall_score": result.get("overall_score", 50),
        "confidence": result.get("confidence", 0.7),
        "feature_scores": result.get("feature_scores", {}),
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "suggestions": result.get("suggestions", []),
        "raw_analysis": result
    }