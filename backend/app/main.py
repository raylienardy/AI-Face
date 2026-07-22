from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, preprocessing, analysis, report, history
from app.database import init_db
from app.services.detector import detector   # ← import detector singleton

app = FastAPI(title="FaceAI Backend", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(upload.router)
app.include_router(preprocessing.router)
app.include_router(analysis.router)
app.include_router(report.router)
app.include_router(history.router)

# ------------------------------------------------------------------
# Startup event – warm‑up model AI agar request pertama tidak lambat
# ------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    # Inisialisasi database
    init_db()
    try:
        # Memaksa detector memuat semua model (detection, recognition, dll.)
        detector._initialize()
        print("Model AI warmed up successfully")
    except Exception as e:
        print(f"Warning: Model warm‑up failed ({e}), will load on first request")


# Exception handler (422)
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