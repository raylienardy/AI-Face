import sys
sys.path.insert(0, '.')
import cv2
from app.services.landmark_extractor import extract_landmarks
from app.services.skin_analyzer import analyze_skin

img = cv2.imread("test.jpg")
if img is None:
    print("test.jpg not found")
else:
    landmarks = extract_landmarks(img)
    if landmarks is None:
        print("No landmarks")
    else:
        result = analyze_skin(img, landmarks)
        print(result)