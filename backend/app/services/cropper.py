import cv2

def crop_face(image, bbox):
    """
    Crop persegi panjang dari image berdasarkan bbox.
    bbox: [x1, y1, x2, y2] (int)
    """
    x1, y1, x2, y2 = [int(v) for v in bbox]
    h, w = image.shape[:2]
    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w, x2)
    y2 = min(h, y2)
    return image[y1:y2, x1:x2]