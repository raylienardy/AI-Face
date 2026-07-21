import uuid
import imghdr
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.core.config import MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB

router = APIRouter(prefix="/api")

# Tentukan folder upload (absolut, seperti sebelumnya)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Logger
logger = logging.getLogger("faceai.upload")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
logger.addHandler(handler)

# Model respons
class UploadResponse(BaseModel):
    status: str
    filename: str
    message: str

class ErrorResponse(BaseModel):
    detail: str

@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    # 1. Validasi ekstensi
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()
    allowed = {".jpg", ".jpeg", ".png"}
    if suffix not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed)}"
        )

    # 2. Baca konten & validasi ukuran
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE_MB} MB"
        )

    # 3. Verifikasi konten gambar (opsional)
    if not imghdr.what(None, h=content):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image"
        )

    # 4. Simpan dengan nama unik
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(content)

    # 5. Logging
    logger.info(f"Uploaded: {unique_name} ({file_size} bytes)")

    return UploadResponse(
        status="ok",
        filename=unique_name,
        message="File uploaded successfully"
    )