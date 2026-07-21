from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload

app = FastAPI(title="FaceAI Backend", version="0.1.0")

# Izinkan frontend development (port 8080) mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],   # frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)

@app.get("/")
async def root():
    return {"status": "running", "message": "FaceAI Backend Running"}