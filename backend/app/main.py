from fastapi import FastAPI

app = FastAPI(title="FaceAI")


@app.get("/")
def root():
    return {
        "status": "running",
        "message": "FaceAI Backend Running"
    }