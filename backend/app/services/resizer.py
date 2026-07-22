import cv2
import numpy as np

def resize_letterbox(image, target_size):
    """
    Resize gambar ke target_size (width, height) dengan letterboxing.
    Menjaga aspek rasio asli, menambahkan padding hitam jika diperlukan.
    
    Args:
        image (np.ndarray): Gambar BGR/grayscale.
        target_size (tuple): (width, height) tujuan.
    
    Returns:
        np.ndarray: Gambar persegi dengan ukuran target_size.
    """
    target_w, target_h = target_size
    h, w = image.shape[:2]

    # Hitung skala yang pas (mempertahankan aspek)
    scale = min(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    # Resize ke ukuran baru
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    # Buat kanvas hitam ukuran target
    if len(image.shape) == 3:
        canvas = np.zeros((target_h, target_w, image.shape[2]), dtype=image.dtype)
    else:
        canvas = np.zeros((target_h, target_w), dtype=image.dtype)

    # Hitung offset untuk menempatkan gambar di tengah
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2

    canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
    return canvas