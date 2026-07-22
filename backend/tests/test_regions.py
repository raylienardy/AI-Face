import sys
sys.path.insert(0, '.')
import cv2
from app.services.landmark_extractor import extract_landmarks
from app.services.region_analyzer import analyze_all_regions

img = cv2.imread("test.jpg")
if img is None:
    print("test.jpg not found")
else:
    landmarks = extract_landmarks(img)
    if landmarks is None:
        print("No landmarks extracted")
    else:
        results = analyze_all_regions(img, landmarks)
        for region, scores in results.items():
            print(f"{region}: {scores}")