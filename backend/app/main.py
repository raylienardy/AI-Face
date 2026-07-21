from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api import upload

app = FastAPI(title="FaceAI Backend", version="0.1.0")

# CORS (dari stage sebelumnya)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tangani error validasi request (misal file tidak dikirim)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request: file is required or invalid format."}
    )

app.include_router(upload.router)

@app.get("/")
async def root():
    return {"status": "running", "message": "FaceAI Backend Running"}