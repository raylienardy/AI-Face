/**
 * FaceAI Quality Assessment Module
 * Version: 0.1 – Milestone 5 Stage 5.2
 *
 * Menilai kualitas wajah untuk menentukan apakah layak capture.
 * Pemeriksaan: posisi, ukuran (lighting, blur, stabilitas, visibility akan ditambahkan nanti).
 */
"use strict";

FaceAI.quality = (function () {
  // ==========================================
  // Public API
  // ==========================================

  /**
   * Inisialisasi modul quality. Mendaftarkan callback untuk menerima data wajah.
   */
  function init() {
    FaceAI.detection.onFaceData((faceData) => {
      if (faceData) {
        const config = FaceAI.config;
        const videoEl = FaceAI.ui.getVideoElement();
        const videoW = videoEl.videoWidth;
        const videoH = videoEl.videoHeight;

        const position = checkPosition(faceData.bbox, videoW, videoH);
        const size = checkSize(faceData.bbox, videoH);

        console.log("Quality checks:", {
          position,
          size,
          confidence: faceData.confidence,
        });

        // Nanti di Stage 5.7 akan digabung untuk menentukan FACE_READY
      } else {
        console.log("Quality: no face");
      }
    });
    console.log("Quality module initialized (Stage 5.2)");
  }

  /**
   * Memeriksa apakah wajah berada di tengah frame.
   * @param {Object} bbox - { x, y, width, height } dalam piksel
   * @param {number} videoWidth
   * @param {number} videoHeight
   * @returns {{ centered: boolean, tooHigh: boolean, tooLow: boolean }}
   */
  function checkPosition(bbox, videoWidth, videoHeight) {
    if (!videoWidth || !videoHeight) {
      return { centered: false, tooHigh: false, tooLow: false };
    }

    const tolerance = FaceAI.config.CENTER_TOLERANCE;
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;

    const offsetX = (centerX - frameCenterX) / videoWidth;
    const offsetY = (centerY - frameCenterY) / videoHeight;

    const centered =
      Math.abs(offsetX) <= tolerance && Math.abs(offsetY) <= tolerance;
    const tooHigh = offsetY < -tolerance;
    const tooLow = offsetY > tolerance;
    // Note: offsetX bisa juga digunakan untuk tooLeft/tooRight, tapi untuk kesederhanaan kita anggap centered atau tidak.

    return { centered, tooHigh, tooLow };
  }

  /**
   * Memeriksa apakah ukuran wajah sesuai (tidak terlalu kecil atau terlalu besar).
   * @param {Object} bbox
   * @param {number} videoHeight
   * @returns {{ tooSmall: boolean, tooClose: boolean, good: boolean }}
   */
  function checkSize(bbox, videoHeight) {
    if (!videoHeight || !bbox.height) {
      return { tooSmall: false, tooClose: false, good: false };
    }

    const heightRatio = bbox.height / videoHeight;
    const minRatio = FaceAI.config.MIN_FACE_HEIGHT_RATIO;
    const maxRatio = FaceAI.config.MAX_FACE_HEIGHT_RATIO;

    const tooSmall = heightRatio < minRatio;
    const tooClose = heightRatio > maxRatio;
    const good = !tooSmall && !tooClose;

    return { tooSmall, tooClose, good };
  }

  // ==========================================
  // Module Exports
  // ==========================================
  return {
    init: init,
  };
})();
