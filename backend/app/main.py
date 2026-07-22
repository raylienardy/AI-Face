from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api import upload

app = FastAPI(title="FaceAI Backend", version="0.1.0")

app.include_router(upload.router)

# Handler untuk validasi error (misal file tidak disertakan)
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