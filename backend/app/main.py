from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware          # ← TAMBAHKAN IMPORT INI

from app.api import upload, preprocessing, analysis, report

app = FastAPI(title="FaceAI Backend", version="0.1.0")

# ----------------------------------------------------------------
# CORS Middleware – Ijinkan frontend dari port 8080
# ----------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],   # dapat diubah ke ["*"] untuk development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router
app.include_router(upload.router)
app.include_router(preprocessing.router)
app.include_router(analysis.router)
app.include_router(report.router)

# Exception handler (sudah ada)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Validation error: " + ", ".join(
                f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()
            )
        }
    )

@app.get("/")
async def root():
    return {"status": "running", "message": "FaceAI Backend Running"}