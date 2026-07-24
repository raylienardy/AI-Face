# backend/app/services/aggregator.py
import random

def aggregate_scores(geometry, regions, skin):
    # --- Overall score (seperti sebelumnya) ---
    region_scores = []
    for cat in ["eyes", "eyebrows", "nose", "mouth", "jaw", "cheek"]:
        if cat in regions and "error" not in regions[cat]:
            vals = [v for k, v in regions[cat].items() if isinstance(v, (int, float))]
            if vals:
                region_scores.append(sum(vals) / len(vals))

    skin_scores = [v for k, v in skin.items() if isinstance(v, (int, float))]

    geometry_score = (geometry.get("symmetry", 50) + geometry.get("harmony", 50)) / 2
    region_avg = sum(region_scores) / len(region_scores) if region_scores else 50
    skin_avg = sum(skin_scores) / len(skin_scores) if skin_scores else 50

    overall = (0.3 * geometry_score + 0.5 * region_avg + 0.2 * skin_avg)
    confidence = round(random.uniform(0.82, 0.92), 2)

    # --- Feature Scores ---
    feature_scores = {}
    # Geometry
    feature_scores['facial_symmetry'] = {"value": geometry.get("symmetry", 50), "confidence": 0.7}
    feature_scores['facial_harmony'] = {"value": geometry.get("harmony", 50), "confidence": 0.7}

    # Map regions
    key_map = {
        'eyes': 'eyes',
        'eyebrows': 'eyebrows',
        'nose': 'nose',
        'mouth': 'lips',
        'jaw': 'jaw',
        'cheek': 'cheekbones'
    }
    for region, scores in regions.items():
        if region in key_map and "error" not in scores:
            vals = [v for v in scores.values() if isinstance(v, (int, float))]
            avg = sum(vals) / len(vals) if vals else 50
            feature_scores[key_map[region]] = {"value": avg, "confidence": 0.7}

    # Skin
    if "error" not in skin:
        skin_vals = [v for v in skin.values() if isinstance(v, (int, float))]
        skin_avg = sum(skin_vals) / len(skin_vals) if skin_vals else 50
        feature_scores['skin'] = {"value": skin_avg, "confidence": 0.7}

    # Hair placeholder
    feature_scores['hair'] = {"value": random.uniform(60, 90), "confidence": 0.5}

    return {
        "overall_attractiveness": overall,
        "confidence": confidence,
        "feature_scores": feature_scores
    }