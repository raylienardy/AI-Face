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

# Preprocessing pipeline (Stage 8.5)
PREPROCESS_TARGET_SIZE = (224, 224)       # width, height
PREPROCESS_NORMALIZATION_MODE = "base"    # "base", "vggface", "facenet"
PREPROCESS_OUTPUT_DIR = "processed"

# Model & Pipeline versioning (Stage 11.2)
MODEL_VERSION = "insightface-buffalo_l-v1"
PREPROCESSING_VERSION = "align-eyes-letterbox-224-v1"

# History images (Fase 12.12)
ENABLE_HISTORY_IMAGES = False