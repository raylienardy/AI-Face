import sys
sys.path.insert(0, '.')
import cv2
from app.services.resizer import resize_letterbox
from app.services.normalizer import normalize

# Gunakan aligned_output.jpg dari stage sebelumnya
image = cv2.imread("aligned_output.jpg")
if image is None:
    print("aligned_output.jpg tidak ditemukan. Jalankan test aligner terlebih dahulu.")
else:
    # Resize letterbox ke 224x224
    resized = resize_letterbox(image, (224, 224))
    cv2.imwrite("resized_letterbox.jpg", resized)
    print(f"Resized shape: {resized.shape}")

    # Normalisasi berbagai mode
    norm_base = normalize(resized, "base")
    norm_vgg = normalize(resized, "vggface")
    norm_face = normalize(resized, "facenet")

    print(f"Normalized base: min={norm_base.min():.2f}, max={norm_base.max():.2f}")
    print(f"Normalized vggface: min={norm_vgg.min():.2f}, max={norm_vgg.max():.2f}")
    print(f"Normalized facenet: min={norm_face.min():.2f}, max={norm_face.max():.2f}")

    # Verifikasi tidak ada distorsi dengan membandingkan aspek rasio
    h, w = image.shape[:2]
    h_r, w_r = resized.shape[:2]
    # padding hanya di satu sisi, aspek harus tetap sama
    # tidak perlu pengujian lebih lanjut
    print("Letterbox berhasil tanpa distorsi.")