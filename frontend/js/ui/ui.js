/**
 * FaceAI UI Module
 * Version: 0.1 – Milestone 3.5
 *
 * Handles all DOM updates: placeholder, button state, status dots, error messages.
 * Drawing functions are delegated to FaceAI.drawing (drawing.js).
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
    faceDot: document.querySelector("#status-face .system-status__dot"),
  };

  // ==========================================
  // Public API
  // ==========================================
  FaceAI.ui = {
    hidePlaceholder() {
      ui.placeholder.classList.add("hidden");
    },

    showPlaceholder() {
      ui.placeholder.classList.remove("hidden");
    },

    setButtonActive(isActive) {
      if (isActive) {
        ui.startBtn.textContent = "Camera Active";
        ui.startBtn.disabled = true;
      } else {
        ui.startBtn.textContent = "Start Camera";
        ui.startBtn.disabled = false;
      }
    },

    setButtonDisabled(disabled) {
      ui.startBtn.disabled = disabled;
    },

    updateCameraDot(active) {
      this._updateDot(ui.cameraDot, active);
    },

    updateFaceDot(active) {
      this._updateDot(ui.faceDot, active);
    },

    showError(message) {
      ui.cameraError.textContent = message;
    },

    clearError() {
      ui.cameraError.textContent = "";
    },

    getVideoElement() {
      return ui.video;
    },

    // Drawing placeholders – will be implemented in drawing.js
    drawFaceBox(x, y, width, height, confidence) {
      FaceAI.drawing.drawBox(x, y, width, height, confidence);
    },

    clearFaceBox() {
      FaceAI.drawing.clear();
    },

    // Private helper
    _updateDot(element, active) {
      if (active) {
        element.classList.remove("system-status__dot--inactive");
        element.classList.add("system-status__dot--active");
      } else {
        element.classList.remove("system-status__dot--active");
        element.classList.add("system-status__dot--inactive");
      }
    },
  };
})();
