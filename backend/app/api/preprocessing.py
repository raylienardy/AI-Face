import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services.preprocessing import preprocess_image
from app.exceptions import ValidationError

logger = logging.getLogger("faceai.api.preprocessing")

router = APIRouter(prefix="/api")

class PreprocessResponse(BaseModel):
    status: str
    png_path: str | None = None
    npy_path: str | None = None
    message: str

@router.post("/preprocess", response_model=PreprocessResponse)
async def preprocess(file: UploadFile = File(...)):
    # Simpan file sementara
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Jalankan pipeline
        output_path = preprocess_image(temp_path)

        # Path NPY
        npy_path = output_path.with_suffix('.npy')

        return PreprocessResponse(
            status="ok",
            png_path=str(output_path),
            npy_path=str(npy_path),
            message="Preprocessing completed successfully."
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during preprocessing")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        # Bersihkan file sementara
        import os
        if os.path.exists(temp_path):
            os.remove(temp_path)