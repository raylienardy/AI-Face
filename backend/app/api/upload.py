import uuid
import imghdr
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.core import config

# Setup logger
logger = logging.getLogger("faceai.upload")
logger.setLevel(logging.INFO)

router = APIRouter(prefix="/api")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Pydantic model untuk response standar
class UploadResponse(BaseModel):
    status: str
    filename: str | None = None
    message: str

@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    # Validasi ekstensi
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()
    if suffix not in config.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(config.ALLOWED_EXTENSIONS)}"
        )

    # Baca isi dan validasi ukuran
    content = await file.read()
    file_size = len(content)
    if file_size > config.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {config.MAX_UPLOAD_SIZE_MB} MB"
        )

    # Validasi gambar menggunakan imghdr
    if not imghdr.what(None, h=content):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image"
        )

    # Simpan dengan nama unik
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(content)

    # Logging
    logger.info(
        "File uploaded: name=%s, size=%d bytes, path=%s",
        unique_name, file_size, file_path
    )

    return UploadResponse(
        status="ok",
        filename=unique_name,
        message="File uploaded successfully"
    )