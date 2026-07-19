/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Phase 4.3 (final)
 *
 * - Menampilkan bounding box di wajah yang terdeteksi.
 * - Untuk sementara tidak menghapus box saat confidence turun sesaat,
 *   sehingga box terlihat stabil.
 * - Tracking akan ditambahkan di Phase 4.4.
 */
"use strict";

FaceAI.detection = (function () {
  let faceDetection = null;
  let initialized = false;
  let isRunning = false;
  let animationFrameId = null;
  let videoElement = null;
  let lastFrameTime = 0;

  // Offscreen canvas untuk snapshot video
  const snapshotCanvas = document.createElement("canvas");
  const snapshotCtx = snapshotCanvas.getContext("2d");

  function isWebGLSupported() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;
    const validFaces = faces.filter((f) => f.score >= threshold);

    if (validFaces.length === 0) {
      // Jangan hapus bounding box! Biarkan kotak terakhir tetap terlihat.
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
      return;
    }

    // Pilih wajah dengan confidence tertinggi
    let best = validFaces[0];
    for (let i = 1; i < validFaces.length; i++) {
      if (validFaces[i].score > best.score) best = validFaces[i];
    }

    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    const bbox = best.boundingBox;
    const xCenter = bbox.xCenter || 0;
    const yCenter = bbox.yCenter || 0;
    const width = bbox.width || 0;
    const height = bbox.height || 0;

    const x = ((xCenter - width / 2) / 100) * videoW;
    const y = ((yCenter - height / 2) / 100) * videoH;
    const w = (width / 100) * videoW;
    const h = (height / 100) * videoH;

    FaceAI.ui.drawFaceBox(x, y, w, h, best.score);
    FaceAI.ui.updateFaceDot(true);
    FaceAI.state.set("FACE_FOUND");
  }

  function detectFrame() {
    if (!isRunning || !videoElement) return;

    // Pastikan video sudah memiliki data gambar
    if (videoElement.readyState < 3 || videoElement.videoWidth === 0) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }

    const now = performance.now();
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    // Ambil snapshot dari video → lebih andal
    snapshotCanvas.width = videoElement.videoWidth;
    snapshotCanvas.height = videoElement.videoHeight;
    snapshotCtx.drawImage(
      videoElement,
      0,
      0,
      snapshotCanvas.width,
      snapshotCanvas.height,
    );

    try {
      faceDetection.send({ image: snapshotCanvas });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  return {
    async init() {
      if (initialized) return;

      if (!isWebGLSupported()) {
        const msg =
          "Your browser does not support WebGL. Face detection cannot run.";
        FaceAI.ui.showError(msg);
        throw new Error(msg);
      }

      try {
        const config = FaceAI.config;
        faceDetection = new FaceDetection({
          locateFile: (file) => `${config.DETECTION_MODEL_URL}${file}`,
        });
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE,
          minDetectionConfidence: config.DETECTION_THRESHOLD,
        });
        faceDetection.onResults(onResults);
        await faceDetection.initialize();
        initialized = true;
        console.log("FaceAI: FaceDetection model loaded successfully.");
      } catch (error) {
        let message = "Failed to initialize face detection. ";
        if (
          error.message &&
          (error.message.includes("NetworkError") ||
            error.message.includes("Failed to fetch"))
        ) {
          message =
            "Failed to load face detection model. Please check your internet connection.";
        } else if (error.message) {
          message += error.message;
        }
        FaceAI.ui.showError(message);
        throw new Error(message);
      }
    },

    async start(video) {
      if (!video) {
        console.warn("FaceAI: cannot start detection – no video element.");
        return;
      }
      if (isRunning) return;

      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return;
        }
      }

      if (video.readyState < 2) {
        console.log("FaceAI: video not ready yet, waiting...");
        await new Promise((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          };
          video.addEventListener("loadeddata", onReady);
          if (video.readyState >= 2) {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          }
        });
      }

      videoElement = video;
      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("FaceAI: detection started.");
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(detectFrame);
    },

    stop() {
      if (!isRunning) return;
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      videoElement = null;
      FaceAI.ui.clearFaceBox(); // hapus box saat benar‑benar berhenti
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("CAMERA_READY");
      console.log("FaceAI: detection stopped.");
    },

    isRunning() {
      return isRunning;
    },
  };
})();
