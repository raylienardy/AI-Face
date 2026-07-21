/**
 * FaceAI Quality Assessment Module
 * Version: 0.2 – Milestone 5 Stage 5.7 (performance fix)
 */
"use strict";

FaceAI.quality = (function () {
  // Offscreen canvas
  let _sampleCanvas = null;
  function getSampleCanvas() {
    if (!_sampleCanvas) {
      _sampleCanvas = document.createElement("canvas");
      // Atribut untuk menghindari peringatan "will read frequently"
      const ctx = _sampleCanvas.getContext("2d", { willReadFrequently: true });
    }
    return _sampleCanvas;
  }

  let _centerBuffer = [];
  function addCenter(x, y) {
    _centerBuffer.push({ x, y });
    const maxLen = FaceAI.config.STABILITY_FRAME_COUNT;
    while (_centerBuffer.length > maxLen) _centerBuffer.shift();
  }
  function resetBuffer() {
    _centerBuffer = [];
  }

  let _readyCounter = 0;
  const READY_DEBOUNCE_FRAMES = 15;

  // Throttle: proses hanya setiap N frame untuk menghemat CPU
  let _frameCount = 0;
  const PROCESS_EVERY_N_FRAMES = 3; // proses setiap 3 frame (~10x/detik pada 30fps)

  function init() {
    FaceAI.ui.showQualityDebug(true);

    FaceAI.detection.onFaceData((faceData) => {
      _frameCount++;
      if (_frameCount % PROCESS_EVERY_N_FRAMES !== 0) {
        // Tetap update laporan debug tanpa perhitungan berat jika ada perubahan?
        // Untuk menjaga UI tetap responsif, kita tetap jalankan checker tapi dengan throttle.
        return; // skip frame ini untuk menghemat CPU
      }

      if (faceData) {
        const config = FaceAI.config;
        const videoEl = FaceAI.ui.getVideoElement();
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;

        const position = checkPosition(faceData.bbox, vw, vh);
        const size = checkSize(faceData.bbox, vh);
        const lighting = checkLighting(videoEl, faceData.bbox);
        const blur = checkBlur(videoEl, faceData.bbox);
        const centerX = faceData.bbox.x + faceData.bbox.width / 2;
        const centerY = faceData.bbox.y + faceData.bbox.height / 2;
        addCenter(centerX, centerY);
        const stability = checkStability(vw);
        const visibility = checkVisibility(
          faceData.landmarks,
          videoEl,
          faceData.bbox,
        );

        const allChecksPassed =
          position.centered &&
          size.good &&
          lighting.good &&
          blur.sharp &&
          stability.stable &&
          visibility.allVisible &&
          !FaceAI.detection.hasMultipleFaces();

        if (allChecksPassed) {
          _readyCounter++;
        } else {
          _readyCounter = 0;
        }

        const isReady = _readyCounter >= READY_DEBOUNCE_FRAMES;

        if (isReady) {
          FaceAI.state.set("FACE_READY");
          FaceAI.ui.showReadyIndicator(true);
        } else {
          // Hanya set ke FACE_FOUND jika state saat ini bukan FACE_READY atau lebih tinggi
          const currentState = FaceAI.state.get();
          if (
            currentState !== "FACE_READY" &&
            currentState !== "COUNTDOWN" &&
            currentState !== "CAPTURING" &&
            currentState !== "CAPTURED"
          ) {
            FaceAI.state.set("FACE_FOUND");
          }
          FaceAI.ui.showReadyIndicator(false);
        }

        // Laporan debug
        const fmt = (val, dec = 1) =>
          typeof val === "number" ? val.toFixed(dec) : String(val);
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

CONFIDENCE : ${fmt(faceData.confidence * 100, 1)}%
READY     : ${isReady ? "✅ YES" : "❌ NO"} (counter: ${_readyCounter}/${READY_DEBOUNCE_FRAMES})`;

        FaceAI.ui.updateQualityDebug(report);
      } else {
        resetBuffer();
        _readyCounter = 0;
        FaceAI.ui.showReadyIndicator(false);
        FaceAI.state.set("DETECTING");
        FaceAI.ui.updateQualityDebug("NO FACE DETECTED");
      }
    });
    console.log("Quality module initialized (Stage 5.7, optimized)");
  }

  // --- Checker functions ---
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

  function checkVisibility(landmarks, video, bbox) {
    if (!landmarks || landmarks.length < 4) {
      return {
        eyesVisible: false,
        noseVisible: false,
        mouthVisible: false,
        allVisible: false,
      };
    }
    const rightEye = landmarks[0],
      leftEye = landmarks[1];
    const nose = landmarks[2],
      mouth = landmarks[3];
    let eyesVisible = rightEye != null && leftEye != null;
    let noseVisible = nose != null;
    let mouthVisible = mouth != null;

    if (eyesVisible && video) {
      eyesVisible =
        checkPatchVariance(video, rightEye, FaceAI.config.EYE_PATCH_SIZE) >=
          FaceAI.config.EYE_VARIANCE_THRESHOLD &&
        checkPatchVariance(video, leftEye, FaceAI.config.EYE_PATCH_SIZE) >=
          FaceAI.config.EYE_VARIANCE_THRESHOLD;
    }
    if (mouthVisible && video) {
      mouthVisible =
        checkPatchVariance(video, mouth, FaceAI.config.MOUTH_PATCH_SIZE) >=
        FaceAI.config.MOUTH_VARIANCE_THRESHOLD;
    }
    const allVisible = eyesVisible && noseVisible && mouthVisible;
    return { eyesVisible, noseVisible, mouthVisible, allVisible };
  }

  function checkPatchVariance(video, landmark, patchSize) {
    try {
      const lx = landmark.x * video.videoWidth;
      const ly = landmark.y * video.videoHeight;
      const half = patchSize / 2;
      const sx = Math.max(0, lx - half);
      const sy = Math.max(0, ly - half);
      const sw = Math.min(patchSize, video.videoWidth - sx);
      const sh = Math.min(patchSize, video.videoHeight - sy);
      if (sw <= 0 || sh <= 0) return 0;

      const canvas = getSampleCanvas();
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
      const imgData = ctx.getImageData(0, 0, sw, sh);
      const data = imgData.data;
      let sum = 0,
        sumSq = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += gray;
        sumSq += gray * gray;
        count++;
      }
      if (count === 0) return 0;
      const mean = sum / count;
      return sumSq / count - mean * mean;
    } catch (e) {
      return 0;
    }
  }

  return { init };
})();
