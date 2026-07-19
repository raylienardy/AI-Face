/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Phase 4.1
 *
 * Responsibilities:
 * - Initialize MediaPipe FaceDetection (BlazeFace)
 * - Verify WebGL support
 * - Provide init() / start() / stop() placeholders
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null; // MediaPipe instance
  let initialized = false; // true after successful init()
  let isRunning = false;
  let videoElement = null;
  let animationFrameId = null;
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
  // Callback (placeholder untuk Phase 4.3)
  // ==========================================
  function onResults(results) {
    // Akan diisi nanti
    console.log("onResults called", results);
  }

  // ==========================================
  // Detection Loop (placeholder)
  // ==========================================
  async function detectFrame(now) {
    if (!isRunning || !videoElement) return;
    // throttle (opsional, akan diimplementasikan penuh nanti)
    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Initialize the face detection engine.
     * Must be called once before start().
     * @returns {Promise<void>} resolves when model is ready, rejects on error.
     */
    async init() {
      if (initialized) {
        console.log("FaceAI: detection already initialized.");
        return;
      }

      // 1. Check WebGL
      if (!isWebGLSupported()) {
        const msg =
          "Your browser does not support WebGL. Face detection cannot run.";
        FaceAI.ui.showError(msg);
        throw new Error(msg);
      }

      try {
        // 2. Create FaceDetection instance
        const config = FaceAI.config;
        faceDetection = new FaceDetection({
          locateFile: (file) => `${config.DETECTION_MODEL_URL}${file}`,
        });

        // 3. Set options (no outputLandmarks – we don't need landmarks on frontend)
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE, // 'short'
          minDetectionConfidence: config.DETECTION_THRESHOLD, // 0.5
        });

        // 4. Register callback (will be filled later)
        faceDetection.onResults(onResults);

        // 5. Load model
        await faceDetection.initialize();
        initialized = true;
        console.log("FaceAI: FaceDetection model loaded successfully.");
      } catch (error) {
        let message = "Failed to initialize face detection. ";
        if (
          (error.message && error.message.includes("NetworkError")) ||
          (error.message && error.message.includes("Failed to fetch"))
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
     * Start detection loop (Placeholder – will be implemented in Phase 4.2)
     */
    start() {
      if (!initialized) {
        console.warn("FaceAI: detection not initialized yet.");
        return;
      }
      // TODO: Phase 4.2
    },

    /**
     * Stop detection loop (Placeholder)
     */
    stop() {
      // TODO: Phase 4.2
    },

    /**
     * Check if detection is running.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
})();
