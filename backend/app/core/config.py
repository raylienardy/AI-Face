import os
from dotenv import load_dotenv

# Load .env file yang terletak di folder backend/
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

MAX_UPLOAD_SIZE_MB = int(os.getenv('MAX_UPLOAD_SIZE_MB', '10'))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

# Preprocessing – Face Detection
FACE_DETECTION_MODEL = os.getenv('FACE_DETECTION_MODEL', 'buffalo_l')