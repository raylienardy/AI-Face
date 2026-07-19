/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.2
 *
 * Responsibilities:
 * - Verify WebGL & load BlazeFace model (Stage 4.1)
 * - Start/stop real-time detection loop (Stage 4.2)
 * - Throttle FPS, handle video readiness, manage state machine
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null; // MediaPipe instance
  let initialized = false; // init() completed
  let isRunning = false; // loop active
  let animationFrameId = null; // rAF handle
  let videoElement = null; // reference to <video>
  let lastFrameTime = 0; // for FPS throttle

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

    // Throttle to configured FPS
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    // Send frame to MediaPipe – NO await, so loop doesn't block
    faceDetection.send({ image: videoElement }).catch((error) => {
      console.warn("FaceAI: detection send error", error);
    });

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Results Callback (will be implemented in Stage 4.3)
  // ==========================================
  function onResults(results) {
    // Placeholder: just log the number of faces
    const faces = results.detections || [];
    if (faces.length > 0) {
      console.log(`FaceAI: ${faces.length} face(s) detected`);
    }
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Initialize the face detection engine (Stage 4.1).
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

        // Register the results callback (currently just logs)
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
     * Start the detection loop.
     * If init() hasn't been called, it will be called automatically.
     * @param {HTMLVideoElement} video - the video element with active stream
     * @returns {Promise<void>}
     */
    async start(video) {
      if (!video) {
        console.warn("FaceAI: cannot start detection – no video element.");
        return;
      }

      if (isRunning) return; // already running

      // Initialize model if needed
      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return; // init() already shows error
        }
      }

      videoElement = video;

      // Ensure video is ready before starting loop
      if (video.readyState < 2) {
        console.log("FaceAI: video not ready yet, waiting...");
        await new Promise((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          };
          video.addEventListener("loadeddata", onReady);
          // In case it became ready synchronously
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
     * Stop the detection loop. Camera stream remains active.
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
     * Check if detection loop is running.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
})();
