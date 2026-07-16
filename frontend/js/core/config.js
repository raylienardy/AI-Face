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
  CAMERA_FACING_MODE: "user", // depan

  // Detection (akan digunakan Milestone 4+)
  MAX_FACES: 1,
  DETECTION_THRESHOLD: 0.5,
  DETECTION_INTERVAL_MS: 100, // minimal jeda antar deteksi

  // Capture (akan digunakan nanti)
  AUTO_CAPTURE_DELAY: 3000, // ms
  MIN_FACE_SIZE_PERCENT: 20, // persen dari tinggi frame

  // UI / Drawing
  BOX_COLOR: "#22c55e", // hijau
  BOX_LINE_WIDTH: 3,
  FPS_LIMIT: 30,

  // Debug
  DEBUG_MODE: false,

  // i18n
  DEFAULT_LANGUAGE: "en",
};
