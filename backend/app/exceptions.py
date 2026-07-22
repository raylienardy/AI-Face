class FaceAIServiceError(Exception):
    """Base exception for FaceAI services."""
    pass

class ValidationError(FaceAIServiceError):
    """Raised when input validation fails (e.g., no valid face)."""
    pass