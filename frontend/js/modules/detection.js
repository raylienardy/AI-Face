/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Phase 4.2
 *
 * Responsibilities:
 * - Initialize MediaPipe FaceDetection
 * - Start / stop detection loop
 * - Placeholder callback (will be implemented in Phase 4.3)
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
  // Placeholder callback (Phase 4.3 will fill this)
  // ==========================================
  function onResults(results) {
    const faces = results.detections || [];
    console.log(`FaceAI: ${faces.length} face(s) detected`);
    // Phase 4.3: drawing bounding box
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

    // Send frame to MediaPipe without awaiting (fire-and-forget)
    // The callback onResults will be invoked when processing is done.
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
    /**
     * Initialize the face detection engine.
     */
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

    /**
     * Start detecting faces from a video element.
     * @param {HTMLVideoElement} video - the active video element with stream
     */
    async start(video) {
      if (!video) {
        console.warn("FaceAI: cannot start detection – no video element.");
        return;
      }
      if (isRunning) return;

      // Initialize if needed (just in case)
      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return; // error already shown
        }
      }

      // Ensure video is ready
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

    /**
     * Stop the detection loop.
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
     * Check if detection is currently running.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
})();
