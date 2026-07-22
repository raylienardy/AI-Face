import os
from dotenv import load_dotenv

load_dotenv()

# Upload
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Detection (Stage 8.1)
DETECTION_MODEL_NAME = "buffalo_l"   # model bawaan InsightFace (deteksi + landmark)
DETECTION_CONFIDENCE_THRESHOLD = 0.5