/**
 * FaceAI Quality Assessment Module
 * Version: 0.1 – Milestone 5 Stage 5.3
 *
 * Menilai kualitas wajah: posisi, ukuran, pencahayaan.
 */
"use strict";

FaceAI.quality = (function () {
  // ==========================================
  // Private – Offscreen canvas untuk sampling
  // ==========================================
  let _sampleCanvas = null;

  function getSampleCanvas() {
    if (!_sampleCanvas) {
      _sampleCanvas = document.createElement("canvas");
      _sampleCanvas.width = 1; // akan diatur ulang saat digunakan
      _sampleCanvas.height = 1;
    }
    return _sampleCanvas;
  }

  // ==========================================
  // Public API
  // ==========================================

  function init() {
    FaceAI.detection.onFaceData((faceData) => {
      if (faceData) {
        const config = FaceAI.config;
        const videoEl = FaceAI.ui.getVideoElement();
        const videoW = videoEl.videoWidth;
        const videoH = videoEl.videoHeight;

        const position = checkPosition(faceData.bbox, videoW, videoH);
        const size = checkSize(faceData.bbox, videoH);
        const lighting = checkLighting(videoEl, faceData.bbox); // baru

        console.log("Quality checks:", {
          position,
          size,
          lighting, // baru
          confidence: faceData.confidence,
        });
      } else {
        console.log("Quality: no face");
      }
    });
    console.log("Quality module initialized (Stage 5.3)");
  }

  /**
   * Memeriksa posisi wajah (centered, tooHigh, tooLow).
   * (sama seperti Stage 5.2)
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
    return { centered, tooHigh, tooLow };
  }

  /**
   * Memeriksa ukuran wajah.
   * (sama seperti Stage 5.2)
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

  /**
   * Memeriksa pencahayaan pada area wajah.
   * @param {HTMLVideoElement} video
   * @param {Object} bbox - {x, y, width, height} dalam pixel
   * @returns {{ tooDark: boolean, tooBright: boolean, good: boolean, average: number }}
   */
  function checkLighting(video, bbox) {
    if (!video || !bbox || bbox.width <= 0 || bbox.height <= 0) {
      return { tooDark: false, tooBright: false, good: false, average: -1 };
    }

    try {
      const canvas = getSampleCanvas();
      canvas.width = bbox.width;
      canvas.height = bbox.height;
      const ctx = canvas.getContext("2d");
      // Gambar area wajah dari video ke canvas
      ctx.drawImage(
        video,
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
        0,
        0,
        bbox.width,
        bbox.height,
      );

      // Ambil data piksel
      const imageData = ctx.getImageData(0, 0, bbox.width, bbox.height);
      const pixels = imageData.data;
      let total = 0;
      let count = 0;
      // Sampling: ambil setiap pixel ke-N untuk efisiensi
      const step = Math.max(1, Math.floor(pixels.length / (4 * 100))); // sekitar 100 sampel
      for (let i = 0; i < pixels.length; i += 4 * step) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        // Konversi ke grayscale (luminance)
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        total += gray;
        count++;
      }
      const average = count > 0 ? total / count : 0;
      const min = FaceAI.config.MIN_BRIGHTNESS;
      const max = FaceAI.config.MAX_BRIGHTNESS;
      const tooDark = average < min;
      const tooBright = average > max;
      const good = !tooDark && !tooBright;
      return { tooDark, tooBright, good, average: Math.round(average) };
    } catch (err) {
      console.warn("Lighting check failed:", err);
      return { tooDark: false, tooBright: false, good: false, average: -1 };
    }
  }

  return { init };
})();
