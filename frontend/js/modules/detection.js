/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.1
 *
 * Responsibilities:
 * - Initialize MediaPipe FaceDetection with BlazeFace model
 * - Verify browser compatibility (WebGL) and model loading
 * - Provide start/stop placeholders for later stages
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null;
  let initialized = false;

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
  // Public API
  // ==========================================
  return {
    /**
     * Initialize the face detection engine.
     * Must be called once before start().
     * @returns {Promise<void>} resolves when model is ready, rejects on error.
     */
    async init() {
      if (initialized) return;

      // 1. Check WebGL availability
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

        // 3. Set options (model variant & threshold)
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE, // 'short'
          minDetectionConfidence: config.DETECTION_THRESHOLD, // 0.5
        });

        // 4. Load model (async)
        await faceDetection.initialize();
        initialized = true;
        console.log("FaceAI: FaceDetection model loaded successfully.");
      } catch (error) {
        // Differentiate error types for user-friendly messages
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
     * Start detecting faces from a video element.
     * (Placeholder – will be implemented in Stage 4.2)
     */
    start() {
      // TODO: Stage 4.2
    },

    /**
     * Stop the detection loop.
     * (Placeholder)
     */
    stop() {
      // TODO: Stage 4.2
    },

    /**
     * Check if detection is currently active.
     * @returns {boolean}
     */
    isRunning() {
      return false; // not yet implemented
    },
  };
})();
