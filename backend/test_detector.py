from app.preprocessing.detector import detect_faces

results = detect_faces("test.jpg")
for r in results:
    print("BBox:", r['bbox'])
    print("Landmarks:", r['landmarks'])
    print("Confidence:", r['confidence'])