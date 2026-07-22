from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api import upload, preprocessing  # tambah preprocessing
from app.api import upload, preprocessing, analysis

app = FastAPI(title="FaceAI Backend", version="0.1.0")

app.include_router(upload.router)
app.include_router(preprocessing.router)   # tambah
app.include_router(analysis.router)

# Handler untuk validasi error (sudah ada)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"status": "error", "message": "Validation error: " + ", ".join(
            f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()
        )}
    )

@app.get("/")
async def root():
    return {"status": "running", "message": "FaceAI Backend Running"}