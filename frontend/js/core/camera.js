/**
 * FaceAI Camera Module
 * Version: 0.1 – Milestone 3.5
 *
 * Responsible for all webcam operations.
 * Uses configuration from FaceAI.config.
 */
"use strict";

window.FaceAI = window.FaceAI || {};

(function () {
  // ==========================================
  // Constants (from config)
  // ==========================================
  const CONFIG = FaceAI.config;

  // ==========================================
  // State
  // ==========================================
  const state = {
    stream: null,
    isActive: false,
    isStarting: false,
  };

  // ==========================================
  // Public API
  // ==========================================
  FaceAI.camera = {
    isActive() {
      return state.isActive;
    },

    isStarting() {
      return state.isStarting;
    },

    async start() {
      if (state.isStarting || state.isActive) return;

      state.isStarting = true;
      FaceAI.ui.setButtonDisabled(true);
      FaceAI.ui.clearError();

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("NOT_SUPPORTED");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CONFIG.CAMERA_WIDTH },
            height: { ideal: CONFIG.CAMERA_HEIGHT },
            facingMode: CONFIG.CAMERA_FACING_MODE,
          },
          audio: false,
        });

        handleStream(stream);
      } catch (error) {
        handleCameraError(error);
      } finally {
        state.isStarting = false;
      }
    },

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
  function handleStream(stream) {
    state.stream = stream;
    state.isActive = true;

    const video = FaceAI.ui.getVideoElement();
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play().catch((err) => console.warn("Video play failed:", err));
    };

    FaceAI.ui.hidePlaceholder();
    FaceAI.ui.setButtonActive(true);
    FaceAI.ui.updateCameraDot(true);
    FaceAI.ui.clearError();
    FaceAI.state.set("CAMERA_READY");
    // Detect when camera is disconnected
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.warn("Camera disconnected unexpectedly");
        FaceAI.camera.stop();
        FaceAI.detection.stop();
        FaceAI.ui.showPlaceholder();
        FaceAI.ui.setButtonActive(false);
        FaceAI.ui.updateCameraDot(false);
        FaceAI.ui.updateFaceDot(false);
        FaceAI.ui.showError(
          "Camera disconnected. Please reconnect and try again.",
        );
        FaceAI.state.set("IDLE");
      };
    }
  }

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
    FaceAI.ui.setButtonActive(false);
  }
})();
