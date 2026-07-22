/**
 * FaceAI Core Configuration
 * Version: 0.1
 *
 * Central place for all app-wide constants.
 * No magic numbers in other files.
 */
"use strict";

window.FaceAI = window.FaceAI || {};

FaceAI.config = {
  // Camera
  CAMERA_WIDTH: 1280,
  CAMERA_HEIGHT: 720,
  CAMERA_FACING_MODE: "user",

  // Detection – Stage 4.1
  DETECTION_MODEL_TYPE: "short",
  DETECTION_MODEL_URL:
    "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/",
  DETECTION_THRESHOLD: 0.5,

  // Detection output (Stage 5.1)
  DETECTION_OUTPUT_LANDMARKS: true,

  // Capture
  AUTO_CAPTURE_DELAY: 3000,
  MIN_FACE_SIZE_PERCENT: 20,

  // UI / Drawing
  BOX_COLOR: "#22c55e",
  BOX_LINE_WIDTH: 3,
  FPS_LIMIT: 20, // <-- diubah dari 30 menjadi 20

  // Multi-face selection (Stage 4.4)
  PRIMARY_FACE_CRITERIA: "area",
  SECONDARY_BOX_COLOR: "#9ca3af",
  SECONDARY_BOX_LINE_WIDTH: 2,

  // Quality Check – Position & Size (Stage 5.2)
  CENTER_TOLERANCE: 0.15,
  MIN_FACE_HEIGHT_RATIO: 0.3,
  MAX_FACE_HEIGHT_RATIO: 0.7,

  // Quality Check – Lighting (Stage 5.3)
  MIN_BRIGHTNESS: 40,
  MAX_BRIGHTNESS: 220,

  // Quality Check – Blur (Stage 5.4)
  BLUR_THRESHOLD: 100,
  BLUR_SAMPLE_WIDTH: 100,

  // Quality Check – Stability (Stage 5.5)
  STABILITY_FRAME_COUNT: 10,
  STABILITY_MOVEMENT_THRESHOLD: 0.05,

  // Alignment (Stage 4.5)
  ALIGN_ENABLED: true,
  ALIGN_TARGET_SIZE: 150,
  ALIGN_EYE_POSITION_RATIO: 0.35,

  // Visibility (Stage 5.6)
  EYE_PATCH_SIZE: 20,
  MOUTH_PATCH_SIZE: 20,
  EYE_VARIANCE_THRESHOLD: 25,
  MOUTH_VARIANCE_THRESHOLD: 25,

  // Backend Upload (Stage 7.2)
  BACKEND_UPLOAD_URL: "http://localhost:8000/api/upload",

  // Debug
  DEBUG_MODE: false,

  // i18n
  DEFAULT_LANGUAGE: "en",
};
