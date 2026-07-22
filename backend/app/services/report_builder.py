import yaml
import logging
from pathlib import Path

logger = logging.getLogger("faceai.report_builder")

# Cache untuk aturan (dimuat pertama kali)
_rules_cache = None

def _load_rules():
    """Memuat file YAML dan menyimpannya di cache."""
    global _rules_cache
    if _rules_cache is not None:
        return _rules_cache

    rules_path = Path("app/config/report_rules.yaml")
    if not rules_path.exists():
        logger.warning("Rules file not found: %s", rules_path)
        _rules_cache = {"strengths": [], "suggestions": []}
        return _rules_cache

    try:
        with open(rules_path, "r") as f:
            _rules_cache = yaml.safe_load(f)
    except Exception as e:
        logger.error("Failed to load rules YAML: %s", e)
        _rules_cache = {"strengths": [], "suggestions": []}
    return _rules_cache

def generate_strengths_suggestions(scores):
    """
    Menghasilkan daftar strengths dan suggestions berdasarkan skor.
    scores: dict dengan struktur seperti output Milestone 9.
    """
    rules = _load_rules()
    strengths = []
    suggestions = []

    # Fungsi untuk mengekstrak nilai dari scores berdasarkan category.field
    def get_nested(data, path):
        keys = path.split(".")
        current = data
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            else:
                return None
        return current

    # Proses strengths
    for rule in rules.get("strengths", []):
        category = rule["category"]
        field = rule["field"]
        threshold = rule["threshold"]
        comparison = rule.get("comparison", "greater_equal")
        message = rule["message"]

        # Dapatkan nilai skor
        category_data = scores.get(category)
        if category_data is None:
            continue
        # Untuk face_structure, field mungkin "symmetry" atau "harmony"
        value = category_data.get(field)
        if value is None:
            continue

        # Bandingkan
        if comparison == "greater_equal" and value >= threshold:
            strengths.append(message)
        elif comparison == "less_than" and value < threshold:
            strengths.append(message)

    # Proses suggestions
    for rule in rules.get("suggestions", []):
        category = rule["category"]
        field = rule["field"]
        threshold = rule["threshold"]
        comparison = rule.get("comparison", "less_than")
        message = rule["message"]

        value = scores.get(category, {}).get(field)
        if value is None:
            continue

        if comparison == "less_than" and value < threshold:
            suggestions.append(message)

    return strengths, suggestions