/**
 * FaceAI Drawing Module
 * Version: 0.1 – Milestone 4 Phase 4.3
 *
 * Canvas operations: bounding box drawing & clearing.
 */
"use strict";

FaceAI.drawing = (function () {
  // ==========================================
  // Private Cache
  // ==========================================
  const canvas = document.getElementById("face-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ==========================================
  // Helper: sync canvas size with video element
  // ==========================================
  function syncCanvasSize(videoElement) {
    if (!canvas || !videoElement) return;
    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;
    if (w && h && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Draw a rectangle on the canvas overlay.
     * @param {number} x - top-left x (pixels)
     * @param {number} y - top-left y (pixels)
     * @param {number} width
     * @param {number} height
     * @param {number} confidence (0-1), optional
     */
    drawBox(x, y, width, height, confidence) {
      if (!ctx) return;

      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);

      const config = FaceAI.config;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.lineWidth = config.BOX_LINE_WIDTH;
      ctx.strokeStyle = config.BOX_COLOR;
      ctx.rect(x, y, width, height);
      ctx.stroke();

      // Show confidence percentage if provided
      if (confidence !== undefined && confidence !== null) {
        const text = `${Math.round(confidence * 100)}%`;
        const fontSize = Math.max(14, height * 0.15);
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.fillStyle = config.BOX_COLOR;
        ctx.textBaseline = "top";
        ctx.fillText(text, x + 5, y + 5);
      }
    },

    /**
     * Clear the entire canvas.
     */
    clear() {
      if (!ctx) return;
      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
})();
