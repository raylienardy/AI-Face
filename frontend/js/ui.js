/**
 * FaceAI UI Module
 * Version: 0.1 – Milestone 3
 *
 * Handles all DOM updates: placeholder, button state, status dots, error messages.
 */
"use strict";

window.FaceAI = window.FaceAI || {};

(function () {
  // ==========================================
  // DOM Reference Cache
  // ==========================================
  const ui = {
    startBtn: document.getElementById("start-camera-btn"),
    video: document.getElementById("camera-video"),
    placeholder: document.getElementById("camera-placeholder"),
    cameraError: document.getElementById("camera-error"),
    cameraDot: document.querySelector("#status-camera .system-status__dot"),
  };

  // ==========================================
  // Public API (exposed via FaceAI.ui)
  // ==========================================
  FaceAI.ui = {
    /**
     * Hide the "Camera Not Started" placeholder.
     */
    hidePlaceholder() {
      ui.placeholder.classList.add("hidden");
    },

    /**
     * Show the placeholder again (on error or reset).
     */
    showPlaceholder() {
      ui.placeholder.classList.remove("hidden");
    },

    /**
     * Update button to reflect camera active state.
     * @param {boolean} isActive
     */
    setButtonActive(isActive) {
      if (isActive) {
        ui.startBtn.textContent = "Camera Active";
        ui.startBtn.disabled = true;
      } else {
        ui.startBtn.textContent = "Start Camera";
        ui.startBtn.disabled = false;
      }
    },

    /**
     * Set button disabled state (e.g., during start attempt).
     * @param {boolean} disabled
     */
    setButtonDisabled(disabled) {
      ui.startBtn.disabled = disabled;
    },

    /**
     * Update camera status indicator dot.
     * @param {boolean} active
     */
    updateCameraDot(active) {
      if (active) {
        ui.cameraDot.classList.remove("system-status__dot--inactive");
        ui.cameraDot.classList.add("system-status__dot--active");
      } else {
        ui.cameraDot.classList.remove("system-status__dot--active");
        ui.cameraDot.classList.add("system-status__dot--inactive");
      }
    },

    /**
     * Display an error message to the user.
     * @param {string} message
     */
    showError(message) {
      ui.cameraError.textContent = message;
    },

    /**
     * Clear the error message area.
     */
    clearError() {
      ui.cameraError.textContent = "";
    },

    /**
     * Get the video DOM element (needed by camera module).
     * @returns {HTMLVideoElement}
     */
    getVideoElement() {
      return ui.video;
    },
  };
})();
