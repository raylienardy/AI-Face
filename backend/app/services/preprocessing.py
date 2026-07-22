import logging
import cv2
import numpy as np
from pathlib import Path
from app.services.detector import detector
from app.services.validator import validate_faces
from app.services.aligner import align_face
from app.services.resizer import resize_letterbox
from app.services.normalizer import normalize
from app.exceptions import ValidationError
from app.core import config

logger = logging.getLogger("faceai.preprocessing")

def preprocess_image(image_path: str, output_name: str = None) -> Path:
    """
    Full preprocessing pipeline: detect → validate → align → resize → normalize → save.

    Args:
        image_path (str): Path ke gambar asli.
        output_name (str, opsional): Nama file output (tanpa ekstensi). Jika None, dihasilkan otomatis.

    Returns:
        Path: Path ke gambar hasil preprocessing.

    Raises:
        ValidationError: Jika tidak ada wajah valid.
        FileNotFoundError: Jika gambar tidak ditemukan.
    """
    # 1. Baca gambar
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    # 2. Deteksi wajah
    faces = detector.detect(img)
    if not faces:
        raise ValidationError("No face detected in the image.")

    # 3. Validasi dan pilih wajah primer
    primary = validate_faces(faces)

    # 4. Alignment & crop (align_face sudah mencakup crop ketat)
    aligned = align_face(img, primary.landmarks, primary.bbox)
    if aligned is None or aligned.size == 0:
        raise ValidationError("Alignment produced empty result.")

    # 5. Resize letterbox
    resized = resize_letterbox(aligned, config.PREPROCESS_TARGET_SIZE)

    # 6. Normalisasi
    normalized = normalize(resized, mode=config.PREPROCESS_NORMALIZATION_MODE)

    # 7. Simpan hasil (convert kembali ke 8-bit jika perlu, atau simpan float)
    # Untuk keperluan penyimpanan, konversi ke 0-255 (base) atau biarkan float?
    # Kita simpan sebagai PNG 8-bit: kembalikan ke [0,255] dari mode "base".
    if config.PREPROCESS_NORMALIZATION_MODE == "base":
        output_img = (normalized * 255).astype('uint8')
    else:
        # Untuk mode lain, simpan sebagai float .npy atau konversi? 
        # Untuk saat ini, kita simpan sebagai PNG dengan mengembalikan ke [0,255] untuk kemudahan.
        # Namun agar tidak kehilangan informasi, lebih baik simpan sebagai .npy.
        # Tapi sesuai spesifikasi, kita ingin gambar siap AI, bisa dalam format float.
        # Kita akan simpan dua versi: PNG untuk visual, NPY untuk tensor.
        pass  # akan ditangani di bawah

    # Buat nama output unik
    if output_name is None:
        output_name = Path(image_path).stem + "_preprocessed"
    output_dir = Path(config.PREPROCESS_OUTPUT_DIR)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Simpan sebagai PNG (untuk visual) dan NPY (untuk model)
    png_path = output_dir / f"{output_name}.png"
    npy_path = output_dir / f"{output_name}.npy"

    # PNG: konversi dari mode base ke uint8
    if config.PREPROCESS_NORMALIZATION_MODE == "base":
        img_to_save = (normalized * 255).astype('uint8')
    else:
        # Untuk mode lain, konversi kembali ke BGR 0-255 untuk PNG (kehilangan akurasi, tapi hanya untuk preview)
        img_to_save = cv2.cvtColor((normalized + 1) * 127.5, cv2.COLOR_RGB2BGR) if config.PREPROCESS_NORMALIZATION_MODE == "facenet" else None
        if img_to_save is None:
            # fallback: simpan sebagai uint8 dari base
            base_version = normalize(resized, "base")
            img_to_save = (base_version * 255).astype('uint8')

    cv2.imwrite(str(png_path), img_to_save)
    # Simpan tensor float untuk model AI
    np.save(npy_path, normalized)

    logger.info("Preprocessed face saved: %s, %s", png_path, npy_path)
    return png_path