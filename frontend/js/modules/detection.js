/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.2 (Revised)
 *
 * Responsibilities:
 * - Initialize MediaPipe FaceDetection with BlazeFace model
 * - Run real-time detection loop on video stream
 * - Start / stop detection on demand, even if video is not yet ready
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
  let pendingStart = false; // true if start() called before video ready

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
  async function detectFrame(now) {
    if (!isRunning) return;

    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    try {
      await faceDetection.send({ image: videoElement });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Results Callback (placeholder for Stage 4.3)
  // ==========================================
  function onResults(results) {
    const faces = results.detections || [];
    if (faces.length > 0) {
      console.log(`FaceAI: ${faces.length} face(s) detected`);
    }
  }

  // ==========================================
  // Public API
  // ==========================================
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

    /**
     * Start detecting faces from a video element.
     * If video is not yet ready, wait for 'loadeddata' event.
     * @param {HTMLVideoElement} video
     * @returns {Promise<void>}
     */
    async start(video) {
      if (!video) {
        console.warn("FaceAI: cannot start detection – no video element.");
        return;
      }

      if (isRunning) return;

      // Initialize model if needed
      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return;
        }
      }

      // Store reference
      videoElement = video;

      // Wait until video is ready
      if (video.readyState < 2) {
        console.log("FaceAI: video not ready yet, waiting...");
        pendingStart = true;
        await new Promise((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            pendingStart = false;
            resolve();
          };
          video.addEventListener("loadeddata", onReady);
          // Fallback: if already ready in the meantime (e.g., event fired synchronously)
          if (video.readyState >= 2) {
            video.removeEventListener("loadeddata", onReady);
            pendingStart = false;
            resolve();
          }
        });
      }

      // Now safe to start
      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("FaceAI: detection started.");
      lastFrameTime = performance.now(); // reset timer
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
