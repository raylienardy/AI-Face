import numpy as np

def normalize(image, mode="base"):
    """
    Normalisasi gambar sesuai mode.
    
    Args:
        image (np.ndarray): Gambar BGR (H,W,3) dengan nilai piksel 0-255.
        mode (str): 'base' → [0,1], 'vggface' → mean subtraction BGR, 
                    'facenet' → standardisasi per-sampel.
    
    Returns:
        np.ndarray: Gambar ternormalisasi (float32).
    """
    if mode == "base":
        # Skala ke [0,1]
        return image.astype(np.float32) / 255.0

    elif mode == "vggface":
        # Mean subtraction khas VGG-Face (BGR)
        mean = np.array([93.5940, 104.7624, 129.1863], dtype=np.float32)
        img = image.astype(np.float32)
        img -= mean
        return img

    elif mode == "facenet":
        # Standardisasi per-sampel: (img - mean) / std
        img = image.astype(np.float32)
        img /= 127.5
        img -= 1.0
        return img

    else:
        raise ValueError(f"Unknown normalization mode: {mode}")