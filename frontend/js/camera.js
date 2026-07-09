/**
 * FaceAI Camera Module
 * Version: 0.1 – Milestone 3
 *
 * Responsible for all webcam operations.
 */
"use strict";

window.FaceAI = window.FaceAI || {};

(function () {
  // ==========================================
  // Constants
  // ==========================================
  const CAMERA_WIDTH = 1280;
  const CAMERA_HEIGHT = 720;

  // ==========================================
  // State
  // ==========================================
  const state = {
    stream: null,
    isActive: false,
    isStarting: false,
  };

  // ==========================================
  // Public API (exposed via FaceAI.camera)
  // ==========================================
  FaceAI.camera = {
    /**
     * Check if camera is currently streaming.
     * @returns {boolean}
     */
    isActive() {
      return state.isActive;
    },

    /**
     * Check if a camera start request is in progress.
     * @returns {boolean}
     */
    isStarting() {
      return state.isStarting;
    },

    /**
     * Start the camera and attach stream to video element.
     * @returns {Promise<void>}
     */
    async start() {
      if (state.isStarting || state.isActive) {
        return; // prevent concurrent requests
      }

      state.isStarting = true;
      FaceAI.ui.setButtonDisabled(true);
      FaceAI.ui.clearError();

      try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("NOT_SUPPORTED");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CAMERA_WIDTH },
            height: { ideal: CAMERA_HEIGHT },
            facingMode: "user",
          },
          audio: false,
        });

        handleStream(stream);
      } catch (error) {
        handleCameraError(error);
      } finally {
        state.isStarting = false;
        // Button will be updated by success/error handlers
      }
    },

    /**
     * Stop the camera and release the stream.
     */
    stop() {
      if (state.stream) {
        state.stream.getTracks().forEach((track) => track.stop());
        state.stream = null;
      }
      state.isActive = false;
    },
  };

  // ==========================================
  // Private Functions
  // ==========================================

  /**
   * Attach a MediaStream to the video element and update UI.
   * @param {MediaStream} stream
   */
  function handleStream(stream) {
    state.stream = stream;
    state.isActive = true;

    const video = FaceAI.ui.getVideoElement();
    video.srcObject = stream;

    // onloadedmetadata ensures video dimensions are known before playing
    video.onloadedmetadata = () => {
      // Explicit play() call as a safeguard; autoplay attribute should handle it,
      // but some browsers may pause if not triggered by user gesture.
      video.play().catch((err) => console.warn("Video play failed:", err));
    };

    // Update UI via ui module
    FaceAI.ui.hidePlaceholder();
    FaceAI.ui.setButtonActive(true);
    FaceAI.ui.updateCameraDot(true);
    FaceAI.ui.clearError();
  }

  /**
   * Handle errors from getUserMedia.
   * @param {Error|string} error
   */
  function handleCameraError(error) {
    let message = "Unable to access camera. ";

    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      message =
        "Camera access denied. Please grant camera permission in your browser settings.";
    } else if (error.name === "NotFoundError") {
      message =
        "No camera found. Please connect a camera and ensure drivers are installed.";
    } else if (error.name === "NotReadableError") {
      message =
        "Camera is in use by another application. Close other apps and try again.";
    } else if (error.message === "NOT_SUPPORTED") {
      message =
        "Your browser does not support camera access. Please use a modern browser.";
    } else {
      message += error.message || "Please check your device settings.";
    }

    FaceAI.ui.showError(message);
    FaceAI.ui.updateCameraDot(false);
    FaceAI.ui.showPlaceholder();
    FaceAI.ui.setButtonActive(false); // reset button to initial state
    // Note: isStarting is reset in finally block
  }
})();
