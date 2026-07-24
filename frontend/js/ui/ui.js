/**
 * FaceAI UI Module
 * Version: 0.1 – Milestone 12 Stage 12.3
 *
 * Handles all DOM updates: placeholder, button state, status dots, error messages.
 * Drawing functions delegated to FaceAI.drawing.
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

    setDevMode(enabled) {
      if (enabled) {
        document.body.classList.add("dev-mode");
      } else {
        document.body.classList.remove("dev-mode");
      }
    },

    showUserGuidance(show) {
      const el = document.getElementById("user-guidance");
      if (el) {
        el.classList.toggle("active", show);
      }
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

    // Drawing delegation (multi box)
    drawFaceBox(x, y, width, height, confidence) {
      FaceAI.drawing.drawBox(x, y, width, height, confidence);
    },

    drawFaceBoxes(boxes) {
      FaceAI.drawing.drawBoxes(boxes);
    },

    clearFaceBoxes() {
      FaceAI.drawing.clear();
    },

    clearFaceBox() {
      FaceAI.drawing.clear();
    },

    // Quality debug (developer mode)
    showQualityDebug(show) {
      const el = document.getElementById("quality-debug");
      if (el) el.style.display = show ? "block" : "none";
    },

    updateQualityDebug(text) {
      const el = document.getElementById("quality-debug-text");
      if (el) el.textContent = text;
    },

    // Ready indicator
    showReadyIndicator(show) {
      const el = document.getElementById("ready-indicator");
      if (el) el.style.display = show ? "block" : "none";
    },

    // Countdown overlay
    showCountdown(text) {
      const overlay = document.getElementById("countdown-overlay");
      const textEl = document.getElementById("countdown-text");
      if (overlay) overlay.style.display = "flex";
      if (textEl) textEl.textContent = text;
    },

    hideCountdown() {
      const overlay = document.getElementById("countdown-overlay");
      if (overlay) overlay.style.display = "none";
    },

    // Preview capture
    showPreview(dataURL) {
      const img = document.getElementById("capture-preview");
      if (img) {
        img.src = dataURL;
        img.style.display = "block";
        img.classList.add("visible");
      }
    },

    hidePreview() {
      const img = document.getElementById("capture-preview");
      if (img) {
        img.removeAttribute("src"); // bebaskan decoded image
        img.style.display = "none";
        img.classList.remove("visible");
      }
    },

    showCaptureButtons() {
      const btns = document.getElementById("capture-buttons");
      if (btns) btns.style.display = "flex";
    },

    hideCaptureButtons() {
      const btns = document.getElementById("capture-buttons");
      if (btns) btns.style.display = "none";
    },

    // Alignment preview
    showAlignedFace(canvas) {
      const alignCanvas = document.getElementById("align-canvas");
      if (!alignCanvas || !canvas) return;
      const ctx = alignCanvas.getContext("2d");
      alignCanvas.width = FaceAI.config.ALIGN_TARGET_SIZE;
      alignCanvas.height = FaceAI.config.ALIGN_TARGET_SIZE;
      ctx.clearRect(0, 0, alignCanvas.width, alignCanvas.height);
      ctx.drawImage(canvas, 0, 0, alignCanvas.width, alignCanvas.height);
      document.getElementById("align-preview").style.display = "flex";
    },

    hideAlignedFace() {
      document.getElementById("align-preview").style.display = "none";
    },

    // Private helper
    _updateDot(element, active) {
      if (!element) return;
      if (active) {
        element.classList.remove("system-status__dot--inactive");
        element.classList.add("system-status__dot--active");
      } else {
        element.classList.remove("system-status__dot--active");
        element.classList.add("system-status__dot--inactive");
      }
    },

    updateUserGuidance(text) {
      const el = document.getElementById("guidance-text");
      if (el) el.textContent = text;
    },

    showToast(message) {
      // Hapus toast sebelumnya jika ada
      const old = document.getElementById("toast");
      if (old) old.remove();

      const toast = document.createElement("div");
      toast.id = "toast";
      toast.textContent = message;
      toast.style.position = "fixed";
      toast.style.top = "20px";
      toast.style.left = "50%";
      toast.style.transform = "translateX(-50%)";
      toast.style.backgroundColor = "rgba(0,0,0,0.8)";
      toast.style.color = "#fff";
      toast.style.padding = "8px 16px";
      toast.style.borderRadius = "999px";
      toast.style.fontSize = "14px";
      toast.style.zIndex = "9999";
      toast.style.transition = "opacity 0.3s";
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    },
  };
})();
