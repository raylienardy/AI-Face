/**
 * FaceAI Drawing Module
 * Version: 0.1 – Milestone 4 Stage 4.4
 *
 * Responsible for all canvas operations:
 * - Drawing multiple face bounding boxes with style differentiation
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
     * Draw a single bounding box (kept for backward compatibility).
     */
    drawBox(x, y, width, height, confidence) {
      // Delegate to drawBoxes for a single box
      this.drawBoxes([
        {
          x,
          y,
          w: width,
          h: height,
          confidence,
          color: FaceAI.config.BOX_COLOR,
          lineWidth: FaceAI.config.BOX_LINE_WIDTH,
          showConfidence: true,
        },
      ]);
    },

    /**
     * Draw multiple bounding boxes with individual styles.
     * @param {Array} boxes - Array of objects: {x, y, w, h, confidence, color, lineWidth, showConfidence}
     */
    drawBoxes(boxes) {
      if (!ctx || !boxes || boxes.length === 0) return;

      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const box of boxes) {
        const { x, y, w, h, confidence, color, lineWidth, showConfidence } =
          box;

        ctx.beginPath();
        ctx.lineWidth = lineWidth || FaceAI.config.BOX_LINE_WIDTH;
        ctx.strokeStyle = color || FaceAI.config.BOX_COLOR;
        ctx.rect(x, y, w, h);
        ctx.stroke();

        // Confidence text
        if (showConfidence && confidence !== undefined) {
          const text = `${Math.round(confidence * 100)}%`;
          const fontSize = Math.max(12, h * 0.12);
          ctx.font = `${fontSize}px system-ui, sans-serif`;
          ctx.fillStyle = color || FaceAI.config.BOX_COLOR;
          ctx.textBaseline = "top";
          ctx.fillText(text, x + 4, y + 4);
        }
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
