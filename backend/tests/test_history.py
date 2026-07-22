import sys
sys.path.insert(0, '.')
from app.database import init_db, get_connection
from app.services.history_service import HistoryService
from app.schemas.report import (
    Report, FeatureScore, FaceStructure, ShapeScores,
    EyesReport, EyebrowsReport, NoseReport, MouthReport,
    JawReport, CheekReport, SkinReport
)

# ==========================================
# Inisialisasi database
# ==========================================
init_db()

# ==========================================
# Buat instance service
# ==========================================
service = HistoryService()

# ==========================================
# Bangun Report dummy langsung di sini
# ==========================================
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
    strengths=["Strong Jawline", "Well-Balanced Eyes"],
    suggestions=["Consider improving skin care routine"]
)

# ==========================================
# Uji operasi CRUD
# ==========================================
# 1. Create
analysis_id = service.create(
    image_path='uploads/test_dummy.jpg',
    report=dummy,
    model_version='insightface-buffalo_l-v1',
    preprocessing_version='align-eyes-letterbox-224-v1'
)
print(f"✅ Created: {analysis_id}")

# 2. Get All
all_records = service.get_all()
print(f"✅ Total records: {len(all_records)}")
for rec in all_records:
    print(f"   - {rec['id'][:8]}... | Score: {rec['overall_score']} | {rec['timestamp']}")

# 3. Get By ID
one = service.get_by_id(analysis_id)
if one:
    print(f"✅ Retrieved: {one['id']}")
else:
    print("❌ Not found")

# 4. Search (contoh: cari "jawline")
search_results = service.search("jawline")
print(f"✅ Search for 'jawline': {len(search_results)} result(s)")

# 5. Delete
deleted = service.delete(analysis_id)
print(f"✅ Deleted: {deleted}")

# Verifikasi setelah delete
after_delete = service.get_by_id(analysis_id)
print(f"   After delete, exists: {after_delete is not None}")