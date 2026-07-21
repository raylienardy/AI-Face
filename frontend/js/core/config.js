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

  // Detection – Phase 4.1
  DETECTION_MODEL_TYPE: "short", // BlazeFace variant
  DETECTION_MODEL_URL:
    "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/",
  DETECTION_THRESHOLD: 0.5, // minimum confidence

  // Tracking (akan digunakan nanti)
  MAX_FACES: 1,
  TRACKING_SMOOTH_FRAMES: 3,

  // Capture
  AUTO_CAPTURE_DELAY: 3000,
  MIN_FACE_SIZE_PERCENT: 20,

  // UI / Drawing
  BOX_COLOR: "#22c55e",
  BOX_LINE_WIDTH: 3,
  FPS_LIMIT: 30,

  // Debug
  DEBUG_MODE: false,

  // i18n
  DEFAULT_LANGUAGE: "en",

  // Multi-face selection (Stage 4.4)
  PRIMARY_FACE_CRITERIA: "area", // 'area' or 'confidence'
  SECONDARY_BOX_COLOR: "#9ca3af", // gray-400
  SECONDARY_BOX_LINE_WIDTH: 2,
  DETECTION_OUTPUT_LANDMARKS: true, // request BlazeFace to output landmarks

  // Quality Check – Position & Size (Stage 5.2)
  CENTER_TOLERANCE: 0.15, // 15% dari pusat masih dianggap centered
  MIN_FACE_HEIGHT_RATIO: 0.3, // tinggi bbox minimal 30% tinggi frame
  MAX_FACE_HEIGHT_RATIO: 0.7, // tinggi bbox maksimal 70% tinggi frame (too close)
};
