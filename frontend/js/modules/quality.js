/**
 * FaceAI Quality Assessment Module
 * Version: 0.1 – Milestone 5 Stage 5.6 (debug detail)
 *
 * Menilai kualitas wajah: posisi, ukuran, pencahayaan, blur, stabilitas, visibilitas.
 * Menampilkan SEMUA detail di panel debug HTML.
 */
"use strict";

FaceAI.quality = (function () {
  // ==========================================
  // Private – Offscreen canvas
  // ==========================================
  let _sampleCanvas = null;
  function getSampleCanvas() {
    if (!_sampleCanvas) _sampleCanvas = document.createElement("canvas");
    return _sampleCanvas;
  }

  // ==========================================
  // Private – Stability buffer
  // ==========================================
  let _centerBuffer = [];
  function addCenter(x, y) {
    _centerBuffer.push({ x, y });
    const maxLen = FaceAI.config.STABILITY_FRAME_COUNT;
    while (_centerBuffer.length > maxLen) _centerBuffer.shift();
  }
  function resetBuffer() {
    _centerBuffer = [];
  }

  // ==========================================
  // Public API
  // ==========================================
  function init() {
    FaceAI.ui.showQualityDebug(true);

    FaceAI.detection.onFaceData((faceData) => {
      if (faceData) {
        const config = FaceAI.config;
        const videoEl = FaceAI.ui.getVideoElement();
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;

        const position = checkPosition(faceData.bbox, vw, vh);
        const size = checkSize(faceData.bbox, vh);
        const lighting = checkLighting(videoEl, faceData.bbox);
        const blur = checkBlur(videoEl, faceData.bbox);
        const stability = checkStability(vw, faceData.bbox);
        const visibility = checkVisibility(faceData.landmarks);

        // Format angka untuk tampilan
        const fmt = (val, decimals = 1) =>
          typeof val === "number" ? val.toFixed(decimals) : String(val);
        const yesno = (b) => (b ? "true" : "false");
        const deltaStr =
          stability.deltaMax === Infinity
            ? "N/A"
            : fmt(stability.deltaMax, 1) + " px";
        const avgStr =
          lighting.average === -1 ? "N/A" : String(lighting.average);

        const report = `POSITION
  centered : ${yesno(position.centered)}
  tooHigh  : ${yesno(position.tooHigh)}
  tooLow   : ${yesno(position.tooLow)}

SIZE
  tooSmall : ${yesno(size.tooSmall)}
  tooClose : ${yesno(size.tooClose)}
  good     : ${yesno(size.good)}

LIGHTING
  tooDark   : ${yesno(lighting.tooDark)}
  tooBright : ${yesno(lighting.tooBright)}
  good      : ${yesno(lighting.good)}
  average   : ${avgStr}

BLUR
  blurry   : ${yesno(blur.blurry)}
  sharp    : ${yesno(blur.sharp)}
  variance : ${fmt(blur.variance, 2)}

STABILITY
  stable   : ${yesno(stability.stable)}
  moving   : ${yesno(stability.moving)}
  deltaMax : ${deltaStr}

VISIBILITY
  eyesVisible  : ${yesno(visibility.eyesVisible)}
  noseVisible  : ${yesno(visibility.noseVisible)}
  mouthVisible : ${yesno(visibility.mouthVisible)}
  allVisible   : ${yesno(visibility.allVisible)}

CONFIDENCE : ${fmt(faceData.confidence * 100, 1)}%`;

        FaceAI.ui.updateQualityDebug(report);
      } else {
        resetBuffer();
        FaceAI.ui.updateQualityDebug("NO FACE DETECTED");
      }
    });
    console.log("Quality module initialized (Stage 5.6, debug detail)");
  }

  // ----------------------------------------------------------------
  //  CHECKERS  (tidak berubah, hanya checkStability ditambahkan param bbox)
  // ----------------------------------------------------------------
  function checkPosition(bbox, vw, vh) {
    if (!vw || !vh) return { centered: false, tooHigh: false, tooLow: false };
    const tol = FaceAI.config.CENTER_TOLERANCE;
    const cx = bbox.x + bbox.width / 2,
      cy = bbox.y + bbox.height / 2;
    const offX = (cx - vw / 2) / vw,
      offY = (cy - vh / 2) / vh;
    return {
      centered: Math.abs(offX) <= tol && Math.abs(offY) <= tol,
      tooHigh: offY < -tol,
      tooLow: offY > tol,
    };
  }

  function checkSize(bbox, vh) {
    if (!vh || !bbox.height)
      return { tooSmall: false, tooClose: false, good: false };
    const ratio = bbox.height / vh;
    const tooSmall = ratio < FaceAI.config.MIN_FACE_HEIGHT_RATIO;
    const tooClose = ratio > FaceAI.config.MAX_FACE_HEIGHT_RATIO;
    return { tooSmall, tooClose, good: !tooSmall && !tooClose };
  }

  function checkLighting(video, bbox) {
    if (!video || !bbox || bbox.width <= 0 || bbox.height <= 0)
      return { tooDark: false, tooBright: false, good: false, average: -1 };
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
      const imgData = ctx.getImageData(0, 0, bbox.width, bbox.height);
      const data = imgData.data;
      let sum = 0,
        cnt = 0;
      const step = Math.max(1, Math.floor(data.length / (4 * 100)));
      for (let i = 0; i < data.length; i += 4 * step) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += gray;
        cnt++;
      }
      const avg = cnt ? sum / cnt : 0;
      const min = FaceAI.config.MIN_BRIGHTNESS,
        max = FaceAI.config.MAX_BRIGHTNESS;
      return {
        tooDark: avg < min,
        tooBright: avg > max,
        good: avg >= min && avg <= max,
        average: Math.round(avg),
      };
    } catch (e) {
      return { tooDark: false, tooBright: false, good: false, average: -1 };
    }
  }

  function checkBlur(video, bbox) {
    if (!video || !bbox || bbox.width <= 0 || bbox.height <= 0)
      return { blurry: true, sharp: false, variance: 0 };
    if (bbox.height < 60) return { blurry: true, sharp: false, variance: 0 };
    try {
      const sw = FaceAI.config.BLUR_SAMPLE_WIDTH;
      const sh = Math.round(bbox.height * (sw / bbox.width));
      const canvas = getSampleCanvas();
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        video,
        bbox.x,
        bbox.y,
        bbox.width,
        bbox.height,
        0,
        0,
        sw,
        sh,
      );
      const imgData = ctx.getImageData(0, 0, sw, sh);
      const data = imgData.data;
      const gray = new Float32Array(sw * sh);
      for (let i = 0; i < sw * sh; i++) {
        gray[i] =
          0.299 * data[i * 4] +
          0.587 * data[i * 4 + 1] +
          0.114 * data[i * 4 + 2];
      }
      // Laplacian
      const lap = new Float32Array(sw * sh);
      let sum = 0,
        sumSq = 0,
        cnt = 0;
      for (let y = 1; y < sh - 1; y++) {
        for (let x = 1; x < sw - 1; x++) {
          const idx = y * sw + x;
          const val =
            gray[idx - sw - 1] * 0 +
            gray[idx - sw] * 1 +
            gray[idx - sw + 1] * 0 +
            gray[idx - 1] * 1 +
            gray[idx] * -4 +
            gray[idx + 1] * 1 +
            gray[idx + sw - 1] * 0 +
            gray[idx + sw] * 1 +
            gray[idx + sw + 1] * 0;
          lap[idx] = val;
          sum += val;
          sumSq += val * val;
          cnt++;
        }
      }
      if (!cnt) return { blurry: true, sharp: false, variance: 0 };
      const mean = sum / cnt;
      const variance = sumSq / cnt - mean * mean;
      const thresh = FaceAI.config.BLUR_THRESHOLD;
      return {
        blurry: variance < thresh,
        sharp: variance >= thresh,
        variance: Math.round(variance * 100) / 100,
      };
    } catch (e) {
      return { blurry: true, sharp: false, variance: 0 };
    }
  }

  function checkStability(videoWidth, bbox) {
    // Tambahkan pusat wajah ke buffer (dipanggil dari luar, jadi kita pakai buffer global)
    // Di sini kita hanya hitung stabilitas berdasarkan buffer yang sudah ada.
    const threshold = FaceAI.config.STABILITY_MOVEMENT_THRESHOLD * videoWidth;
    const count = FaceAI.config.STABILITY_FRAME_COUNT;
    if (_centerBuffer.length < count) {
      return { stable: false, moving: true, deltaMax: Infinity };
    }
    let maxDelta = 0;
    for (let i = 0; i < _centerBuffer.length - 1; i++) {
      const dx = _centerBuffer[i].x - _centerBuffer[i + 1].x;
      const dy = _centerBuffer[i].y - _centerBuffer[i + 1].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > maxDelta) maxDelta = d;
    }
    const stable = maxDelta < threshold;
    return {
      stable,
      moving: !stable,
      deltaMax: Math.round(maxDelta * 10) / 10,
    };
  }

  function checkVisibility(landmarks) {
    if (!landmarks || landmarks.length < 4)
      return {
        eyesVisible: false,
        noseVisible: false,
        mouthVisible: false,
        allVisible: false,
      };
    const rightEye = landmarks[0],
      leftEye = landmarks[1];
    const nose = landmarks[2],
      mouth = landmarks[3];
    const eyesVisible = rightEye != null && leftEye != null;
    const noseVisible = nose != null;
    const mouthVisible = mouth != null;
    return {
      eyesVisible,
      noseVisible,
      mouthVisible,
      allVisible: eyesVisible && noseVisible && mouthVisible,
    };
  }

  return { init };
})();
