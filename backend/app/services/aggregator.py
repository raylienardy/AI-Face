"""
Aggregator yang menggunakan AI Provider Router.
"""
from app.services.ai_providers import router


def aggregate_scores(geometry, regions, skin, face_data: dict = None):
    """
    Menggunakan AI provider untuk menganalisis data wajah.
    """
    if face_data is None:
        face_data = {"geometry": geometry, "regions": regions, "skin": skin}
    
    result = router.analyze(face_data)
    
    return {
        "overall_attractiveness": result.get("overall_score", 50),
        "confidence": result.get("confidence", 0.7),
        "feature_scores": result.get("feature_scores", {}),
        "summary": result.get("summary", ""),
        "strengths": result.get("strengths", []),
        "suggestions": result.get("suggestions", []),
        "raw_analysis": result  # untuk mode developer
    }