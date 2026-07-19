/**
 * FaceAI Drawing Module
 * Version: 0.1 – Milestone 4 Phase 4.3 (revised)
 *
 * Simple canvas drawing – bounding box, confidence, clear.
 */
"use strict";

FaceAI.drawing = (function () {
  // ==========================================
  // Public API
  // ==========================================
  return {
    drawBox(x, y, width, height, confidence) {
      const canvas = document.getElementById("face-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Pastikan ukuran canvas mengikuti video (jika ada)
      const videoEl = FaceAI.ui ? FaceAI.ui.getVideoElement() : null;
      if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
        if (
          canvas.width !== videoEl.videoWidth ||
          canvas.height !== videoEl.videoHeight
        ) {
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
        }
      }

      // Clear previous drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw box
      ctx.beginPath();
      ctx.lineWidth = FaceAI.config.BOX_LINE_WIDTH;
      ctx.strokeStyle = FaceAI.config.BOX_COLOR;
      ctx.rect(x, y, width, height);
      ctx.stroke();

      // Confidence text
      if (confidence !== undefined && confidence !== null) {
        const text = `${Math.round(confidence * 100)}%`;
        const fontSize = Math.max(12, height * 0.12);
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.fillStyle = FaceAI.config.BOX_COLOR;
        ctx.textBaseline = "top";
        ctx.fillText(text, x + 4, y + 4);
      }
    },

    clear() {
      const canvas = document.getElementById("face-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    },
  };
})();
