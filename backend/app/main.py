from fastapi import FastAPI
from app.api import upload

app = FastAPI(title="FaceAI Backend", version="0.1.0")

app.include_router(upload.router)

@app.get("/")
async def root():
    return {"status": "running", "message": "FaceAI Backend Running"}