import sys
sys.path.insert(0, '.')
import cv2
from app.services.embedder import extract_embedding
from sklearn.metrics.pairwise import cosine_similarity

# Muat dua gambar: satu orang yang sama (gambar A dan A'), satu orang berbeda
img1 = cv2.imread("aligned_output.jpg")  # hasil alignment
img2 = cv2.imread("aligned_output2.jpg") # gambar lain dari orang yang sama, atau crop lain
img3 = cv2.imread("test.jpg")            # orang berbeda

if img1 is None or img2 is None or img3 is None:
    print("Gambar uji tidak lengkap")
else:
    emb1 = extract_embedding(img1)
    emb2 = extract_embedding(img2)
    emb3 = extract_embedding(img3)
    sim_same = cosine_similarity([emb1], [emb2])[0][0]
    sim_diff = cosine_similarity([emb1], [emb3])[0][0]
    print(f"Similarity (same person): {sim_same:.3f}")
    print(f"Similarity (different): {sim_diff:.3f}")
    print("Test passed" if sim_same > 0.5 and sim_diff < 0.5 else "Test not ideal")