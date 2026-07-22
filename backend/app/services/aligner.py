import cv2
import numpy as np
from app.services.cropper import crop_face

def align_face(image, landmarks, bbox, expand_margin=0.3, target_eye_distance=None):
    """
    Luruskan wajah berdasarkan posisi mata dan crop area wajah.
    """
    if len(landmarks) < 2:
        return crop_face(image, bbox)

    re = np.array(landmarks[0])
    le = np.array(landmarks[1])

    # Perluas bounding box
    x1, y1, x2, y2 = bbox
    w_box, h_box = x2 - x1, y2 - y1
    margin_w = int(w_box * expand_margin)
    margin_h = int(h_box * expand_margin)
    x1_exp = max(0, x1 - margin_w)
    y1_exp = max(0, y1 - margin_h)
    x2_exp = min(image.shape[1], x2 + margin_w)
    y2_exp = min(image.shape[0], y2 + margin_h)

    sub_img = crop_face(image, [x1_exp, y1_exp, x2_exp, y2_exp])

    # Koordinat mata relatif terhadap sub_img
    re_sub = re - [x1_exp, y1_exp]
    le_sub = le - [x1_exp, y1_exp]

    # Hitung sudut rotasi
    dx = le_sub[0] - re_sub[0]
    dy = le_sub[1] - re_sub[1]
    angle = np.degrees(np.arctan2(dy, dx))

    # Pusat rotasi = titik tengah mata, konversi ke int Python murni
    eye_center_raw = np.mean([re_sub, le_sub], axis=0)
    center = (int(eye_center_raw[0]), int(eye_center_raw[1]))

    # Rotasi sub_img
    rot_mat = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(sub_img, rot_mat, (sub_img.shape[1], sub_img.shape[0]),
                             flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT,
                             borderValue=(0, 0, 0))

    # Posisi mata setelah rotasi
    pts = np.array([re_sub, le_sub], dtype=np.float32).reshape(-1, 1, 2)
    new_pts = cv2.transform(pts, rot_mat).squeeze()
    new_re, new_le = new_pts[0], new_pts[1]

    eye_center_new = (new_re + new_le) / 2.0
    eye_dist = np.linalg.norm(new_le - new_re)

    if target_eye_distance is None:
        target_eye_distance = eye_dist

    crop_w = int(2.0 * eye_dist)
    crop_h = int(2.5 * eye_dist)
    crop_x = int(eye_center_new[0] - crop_w / 2)
    crop_y = int(eye_center_new[1] - crop_h * 0.4)

    h, w = rotated.shape[:2]
    x1_c = max(0, crop_x)
    y1_c = max(0, crop_y)
    x2_c = min(w, crop_x + crop_w)
    y2_c = min(h, crop_y + crop_h)

    aligned_face = rotated[y1_c:y2_c, x1_c:x2_c]
    return aligned_face