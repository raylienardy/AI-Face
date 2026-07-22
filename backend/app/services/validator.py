import logging
from app.services.detector import FaceObject
from app.exceptions import ValidationError

logger = logging.getLogger("faceai.validator")

# Default criteria (can be moved to config later)
MIN_CONFIDENCE = 0.7          # akan sering gagal untuk gambar real; dapat diubah di config
MIN_FACE_HEIGHT = 100         # pixels

def validate_faces(faces: list[FaceObject]) -> FaceObject:
    """
    Validate list of detected faces and return the primary face.
    Criteria:
      - confidence >= MIN_CONFIDENCE
      - landmarks present (at least left and right eye)
      - bounding box height >= MIN_FACE_HEIGHT
    If multiple faces pass, the one with the largest area is chosen.
    Raises ValidationError if no face passes.
    """
    valid_faces = []
    for face in faces:
        # Confidence check
        if face.confidence < MIN_CONFIDENCE:
            logger.debug("Face rejected: low confidence %.2f", face.confidence)
            continue

        # Landmark check: need at least two eye landmarks (index 0 and 1)
        if not face.landmarks or len(face.landmarks) < 2:
            logger.debug("Face rejected: missing eye landmarks")
            continue

        # Size check (height of bounding box)
        x1, y1, x2, y2 = face.bbox
        height = y2 - y1
        if height < MIN_FACE_HEIGHT:
            logger.debug("Face rejected: height %d < %d", height, MIN_FACE_HEIGHT)
            continue

        valid_faces.append(face)

    if not valid_faces:
        raise ValidationError(
            f"No valid face found. Need confidence >= {MIN_CONFIDENCE}, "
            f"height >= {MIN_FACE_HEIGHT}px, and visible eye landmarks."
        )

    # Primary selection: largest area (width * height)
    primary = max(valid_faces, key=lambda f: (f.bbox[2]-f.bbox[0]) * (f.bbox[3]-f.bbox[1]))
    logger.info("Primary face selected: confidence=%.2f, bbox=%s", primary.confidence, primary.bbox)
    return primary