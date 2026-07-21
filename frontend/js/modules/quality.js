/**
 * FaceAI Quality Assessment Module
 * Version: 0.1 – Milestone 5 Stage 5.6
 *
 * Menilai kualitas wajah: posisi, ukuran, pencahayaan, ketajaman (blur), stabilitas, visibilitas fitur.
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
    }
    return _sampleCanvas;
  }

  // ==========================================
  // Private – Buffer posisi untuk stabilitas
  // ==========================================
  let _centerBuffer = []; // array of {x, y}

  function addCenter(x, y) {
    _centerBuffer.push({ x, y });
    const maxLen = FaceAI.config.STABILITY_FRAME_COUNT;
    while (_centerBuffer.length > maxLen) {
      _centerBuffer.shift();
    }
  }

  function resetBuffer() {
    _centerBuffer = [];
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
        const lighting = checkLighting(videoEl, faceData.bbox);
        const blur = checkBlur(videoEl, faceData.bbox);

        const centerX = faceData.bbox.x + faceData.bbox.width / 2;
        const centerY = faceData.bbox.y + faceData.bbox.height / 2;
        addCenter(centerX, centerY);
        const stability = checkStability(videoW);

        const visibility = checkVisibility(faceData.landmarks); // baru

        console.log("Quality checks:", {
          position,
          size,
          lighting,
          blur,
          stability,
          visibility, // baru
          confidence: faceData.confidence,
        });
      } else {
        resetBuffer();
        console.log("Quality: no face");
      }
    });
    console.log("Quality module initialized (Stage 5.6)");
  }

  /**
   * Memeriksa posisi wajah.
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
   * Memeriksa pencahayaan.
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
      const imageData = ctx.getImageData(0, 0, bbox.width, bbox.height);
      const pixels = imageData.data;
      let total = 0,
        count = 0;
      const step = Math.max(1, Math.floor(pixels.length / (4 * 100)));
      for (let i = 0; i < pixels.length; i += 4 * step) {
        const r = pixels[i],
          g = pixels[i + 1],
          b = pixels[i + 2];
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

  /**
   * Memeriksa ketajaman (blur).
   */
  function checkBlur(video, bbox) {
    if (!video || !bbox || bbox.width <= 0 || bbox.height <= 0) {
      return { blurry: true, sharp: false, variance: 0 };
    }
    const minFaceHeight = 60;
    if (bbox.height < minFaceHeight) {
      return { blurry: true, sharp: false, variance: 0 };
    }
    try {
      const sampleWidth = FaceAI.config.BLUR_SAMPLE_WIDTH;
      const scale = sampleWidth / bbox.width;
      const sampleHeight = Math.round(bbox.height * scale);
      const canvas = getSampleCanvas();
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        video,
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
        0,
        0,
        sampleWidth,
        sampleHeight,
      );
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const pixels = imageData.data;
      const gray = new Float32Array(sampleWidth * sampleHeight);
      for (let i = 0; i < sampleWidth * sampleHeight; i++) {
        const r = pixels[i * 4];
        const g = pixels[i * 4 + 1];
        const b = pixels[i * 4 + 2];
        gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const laplacian = new Float32Array(sampleWidth * sampleHeight);
      let sum = 0,
        sumSq = 0,
        count = 0;
      for (let y = 1; y < sampleHeight - 1; y++) {
        for (let x = 1; x < sampleWidth - 1; x++) {
          const idx = y * sampleWidth + x;
          const val =
            gray[idx - sampleWidth - 1] * 0 +
            gray[idx - sampleWidth] * 1 +
            gray[idx - sampleWidth + 1] * 0 +
            gray[idx - 1] * 1 +
            gray[idx] * -4 +
            gray[idx + 1] * 1 +
            gray[idx + sampleWidth - 1] * 0 +
            gray[idx + sampleWidth] * 1 +
            gray[idx + sampleWidth + 1] * 0;
          laplacian[idx] = val;
          sum += val;
          sumSq += val * val;
          count++;
        }
      }
      if (count === 0) return { blurry: true, sharp: false, variance: 0 };
      const mean = sum / count;
      const variance = sumSq / count - mean * mean;
      const threshold = FaceAI.config.BLUR_THRESHOLD;
      const blurry = variance < threshold;
      return {
        blurry,
        sharp: !blurry,
        variance: Math.round(variance * 100) / 100,
      };
    } catch (err) {
      console.warn("Blur check failed:", err);
      return { blurry: true, sharp: false, variance: 0 };
    }
  }

  /**
   * Memeriksa stabilitas wajah.
   */
  function checkStability(videoWidth) {
    const threshold = FaceAI.config.STABILITY_MOVEMENT_THRESHOLD * videoWidth;
    const count = FaceAI.config.STABILITY_FRAME_COUNT;
    if (_centerBuffer.length < count) {
      return { stable: false, moving: true, deltaMax: Infinity };
    }
    let maxDelta = 0;
    for (let i = 0; i < _centerBuffer.length - 1; i++) {
      const dx = _centerBuffer[i].x - _centerBuffer[i + 1].x;
      const dy = _centerBuffer[i].y - _centerBuffer[i + 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDelta) maxDelta = dist;
    }
    const stable = maxDelta < threshold;
    return {
      stable,
      moving: !stable,
      deltaMax: Math.round(maxDelta * 10) / 10,
    };
  }

  /**
   * Memeriksa visibilitas fitur wajah berdasarkan landmark.
   * BlazeFace 6‑titik: 0=mata kanan, 1=mata kiri, 2=hidung, 3=mulut, 4=telinga kanan, 5=telinga kiri.
   * @param {Array|null} landmarks - array of {x, y} atau null jika tidak tersedia
   * @returns {{ eyesVisible: boolean, noseVisible: boolean, mouthVisible: boolean, allVisible: boolean }}
   */
  function checkVisibility(landmarks) {
    if (!landmarks || landmarks.length < 4) {
      return {
        eyesVisible: false,
        noseVisible: false,
        mouthVisible: false,
        allVisible: false,
      };
    }

    const rightEye = landmarks[0]; // mata kanan
    const leftEye = landmarks[1]; // mata kiri
    const nose = landmarks[2]; // hidung
    const mouth = landmarks[3]; // mulut

    const eyesVisible = rightEye != null && leftEye != null;
    const noseVisible = nose != null;
    const mouthVisible = mouth != null;
    const allVisible = eyesVisible && noseVisible && mouthVisible;

    return { eyesVisible, noseVisible, mouthVisible, allVisible };
  }

  return { init };
})();
