/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.3
 *
 * Responsibilities:
 * - Load BlazeFace model (4.1)
 * - Real‑time detection loop (4.2)
 * - Single face bounding box + confidence (4.3)
 * - State machine integration
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
  // Detection Loop (private)
  // ==========================================
  function detectFrame(now) {
    if (!isRunning || !videoElement) return;

    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    // Send frame without blocking the loop
    faceDetection.send({ image: videoElement }).catch((error) => {
      console.warn("FaceAI: detection send error", error);
    });

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Results Callback (Stage 4.3)
  // ==========================================
  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;

    // Find detection with highest confidence above threshold
    let bestFace = null;
    let bestConfidence = 0;

    for (const face of faces) {
      const score = face.score || 0;
      if (score >= threshold && score > bestConfidence) {
        bestConfidence = score;
        bestFace = face;
      }
    }

    if (bestFace) {
      const bbox = bestFace.boundingBox;
      // Convert relative coordinates (0-100) to pixel values
      const vw = videoElement.videoWidth;
      const vh = videoElement.videoHeight;
      const xCenter = bbox.xCenter || 0;
      const yCenter = bbox.yCenter || 0;
      const width = bbox.width || 0;
      const height = bbox.height || 0;

      const x = ((xCenter - width / 2) / 100) * vw;
      const y = ((yCenter - height / 2) / 100) * vh;
      const w = (width / 100) * vw;
      const h = (height / 100) * vh;

      // Draw on canvas overlay
      FaceAI.ui.drawFaceBox(x, y, w, h, bestConfidence);
      FaceAI.ui.updateFaceDot(true);
      FaceAI.state.set("FACE_FOUND");
    } else {
      // No valid face – clear overlay
      FaceAI.ui.clearFaceBox();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
    }
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Initialize the face detection engine.
     * @returns {Promise<void>}
     */
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

    /**
     * Start detection loop.
     * @param {HTMLVideoElement} video
     */
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

      videoElement = video;
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

      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("FaceAI: detection started.");
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(detectFrame);
    },

    /**
     * Stop detection loop.
     */
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

    /**
     * Check if detection loop is active.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
})();
