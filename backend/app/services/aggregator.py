import random

def aggregate_scores(geometry, regions, skin):
    """
    Menggabungkan skor dari semua modul menjadi satu skor overall.
    Saat ini menggunakan rata‑rata terboboti sederhana.
    """
    # Ambil skor utama dari setiap region (placeholder rata‑rata)
    region_scores = []
    for cat in ["eyes", "eyebrows", "nose", "mouth", "jaw", "cheek"]:
        if cat in regions and "error" not in regions[cat]:
            vals = [v for k, v in regions[cat].items() if isinstance(v, (int, float))]
            if vals:
                region_scores.append(sum(vals) / len(vals))

    skin_scores = [v for k, v in skin.items() if isinstance(v, (int, float))]

    # Bobot untuk setiap kelompok
    weight_geometry = 0.3
    weight_regions = 0.5
    weight_skin = 0.2

    geometry_score = (geometry.get("symmetry", 50) + geometry.get("harmony", 50)) / 2
    region_avg = sum(region_scores) / len(region_scores) if region_scores else 50
    skin_avg = sum(skin_scores) / len(skin_scores) if skin_scores else 50

    overall = (weight_geometry * geometry_score +
               weight_regions * region_avg +
               weight_skin * skin_avg)

    # Confidence sementara (placeholder)
    confidence = round(random.uniform(0.82, 0.92), 2)

    return {
        "overall_attractiveness": round(overall, 1),
        "confidence": confidence
    }