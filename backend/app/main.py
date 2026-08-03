from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api import upload, preprocessing, analysis, report, history
from app.database import init_db
from app.services.detector import detector

app = FastAPI(title="FaceAI Backend", version="0.1.0")

# Custom CORS middleware (menggantikan CORSMiddleware)
class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(CustomCORSMiddleware)

# Routers
app.include_router(upload.router)
app.include_router(preprocessing.router)
app.include_router(analysis.router)
app.include_router(report.router)
app.include_router(history.router)

# Startup event – warm‑up model AI
@app.on_event("startup")
async def startup_event():
    init_db()
    try:
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