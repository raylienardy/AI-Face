import sys
sys.path.insert(0, '.')
import cv2
from app.services.embedder import extract_embedding

img = cv2.imread("aligned_output.jpg")
if img is None:
    print("aligned_output.jpg tidak ditemukan")
else:
    emb = extract_embedding(img)
    print(f"Embedding shape: {emb.shape}")
    print(f"Embedding sample (5 first dims): {emb.flatten()[:5]}")
    print("Embedding berhasil diekstrak.")