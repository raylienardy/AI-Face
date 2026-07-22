import os
from dotenv import load_dotenv

load_dotenv()  # membaca .env dari folder backend/ (working directory)

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024  # dalam bytes
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}