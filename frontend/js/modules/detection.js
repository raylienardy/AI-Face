/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.2
 *
 * Responsibilities:
 * - Initialize MediaPipe FaceDetection with BlazeFace model
 * - Run real-time detection loop on video stream
 * - Start / stop detection on demand
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null; // MediaPipe instance
  let initialized = false; // whether init() completed successfully
  let isRunning = false; // detection loop is active
  let animationFrameId = null; // requestAnimationFrame handle
  let videoElement = null; // reference to the <video> element
  let lastFrameTime = 0; // for FPS limiting (optional)

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

    // Throttle FPS if needed (optional, using config.FPS_LIMIT)
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    try {
      // Feed the current video frame to the detection model
      await faceDetection.send({ image: videoElement });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }

    // Continue the loop
    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Results Callback (placeholder for Stage 4.3)
  // ==========================================
  function onResults(results) {
    // For now, just log the number of faces found
    const faces = results.detections || [];
    if (faces.length > 0) {
      console.log(`FaceAI: ${faces.length} face(s) detected`);
    }
    // Stage 4.3 will add bounding box drawing here
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Initialize the face detection engine.
     * Must be called once before start().
     * @returns {Promise<void>}
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

        // 3. Set options
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE,
          minDetectionConfidence: config.DETECTION_THRESHOLD,
        });

        // 4. Register the callback for detection results
        faceDetection.onResults(onResults);

        // 5. Load model (async)
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
     * If init() hasn't been called, it will be called automatically.
     * @param {HTMLVideoElement} video
     * @returns {Promise<void>}
     */
    async start(video) {
      // Guard: camera must be running
      if (!video || video.readyState < 2) {
        console.warn(
          "FaceAI: cannot start detection – video stream not ready.",
        );
        return;
      }

      // Initialize if needed
      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return; // error already shown in init()
        }
      }

      if (isRunning) return; // already running

      // Store video reference and start the loop
      videoElement = video;
      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("FaceAI: detection started.");
      animationFrameId = requestAnimationFrame(detectFrame);
    },

    /**
     * Stop the detection loop.
     * The camera stream is not affected.
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
      // Note: we do NOT close faceDetection here to allow restart
    },

    /**
     * Check if detection is currently active.
     * @returns {boolean}
     */
    isRunning() {
      return isRunning;
    },
  };
})();
