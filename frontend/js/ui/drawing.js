/**
 * FaceAI Drawing Module
 * Version: 0.1 – Milestone 4 Stage 4.3
 *
 * Responsible for all canvas operations:
 * - Drawing face bounding boxes
 * - Clearing the canvas
 */
"use strict";

FaceAI.drawing = (function () {
  // ==========================================
  // Private Cache
  // ==========================================
  const canvas = document.getElementById("face-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ==========================================
  // Helper: Sync canvas size with video
  // ==========================================
  function syncCanvasSize(videoElement) {
    if (!canvas || !videoElement) return;
    // Use the video's intrinsic resolution for accurate mapping
    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;
    if (w && h) {
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
     * @param {number} confidence (0-1)
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

      // Draw confidence text inside the box
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
