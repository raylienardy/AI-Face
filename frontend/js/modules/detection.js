/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Phase 4.3
 *
 * - Real‑time face detection via MediaPipe
 * - Selects the best detection (highest confidence above threshold)
 * - Draws bounding box and updates face status indicator
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null;
  let initialized = false;
  let isRunning = false;
  let animationFrameId = null;
  let videoElement = null;
  let lastFrameTime = 0;

  // ==========================================
  // Utility: WebGL support check
  // ==========================================
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

  // ==========================================
  // Results Callback (Phase 4.3)
  // ==========================================
  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;

    // Filter faces above threshold
    const validFaces = faces.filter((f) => f.score >= threshold);

    if (validFaces.length === 0) {
      // No face detected
      FaceAI.ui.clearFaceBox();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
      return;
    }

    // Pick the face with highest confidence
    let best = validFaces[0];
    for (let i = 1; i < validFaces.length; i++) {
      if (validFaces[i].score > best.score) {
        best = validFaces[i];
      }
    }

    // Convert relative coordinates (0–100) to pixel values
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

    // Draw bounding box and update face status
    FaceAI.ui.drawFaceBox(x, y, w, h, best.score);
    FaceAI.ui.updateFaceDot(true);
    FaceAI.state.set("FACE_FOUND");
  }

  // ==========================================
  // Detection Loop (private)
  // ==========================================
  function detectFrame() {
    if (!isRunning || !videoElement) return;

    const now = performance.now();
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    try {
      faceDetection.send({ image: videoElement });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    async init() {
      if (initialized) {
        console.log("FaceAI: detection already initialized.");
        return;
      }

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
      FaceAI.state.set("CAMERA_READY");
      console.log("FaceAI: detection stopped.");
    },

    isRunning() {
      return isRunning;
    },
  };
})();
