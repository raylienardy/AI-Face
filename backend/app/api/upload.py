import uuid
import imghdr
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/api")

# Konfigurasi (bisa dipindahkan ke config nanti)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB

# Pastikan folder upload ada
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # 1. Validasi ekstensi
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Baca isi file untuk validasi ukuran & penyimpanan
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE // (1024*1024)} MB"
        )

    # 3. Verifikasi ulang tipe gambar menggunakan imghdr (opsional)
    if not imghdr.what(None, h=content):
        raise HTTPException(
            status_code=400,
            detail="File is not a valid image"
        )

    # 4. Buat nama unik dan simpan
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / unique_name
    file_path.write_bytes(content)

    return {
        "status": "ok",
        "filename": unique_name,
        "message": "File uploaded successfully"
    }