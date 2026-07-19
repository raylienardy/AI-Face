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
  const canvas = document.getElementById("face-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  function syncCanvasSize(videoElement) {
    if (!canvas || !videoElement) return;
    const w = videoElement.videoWidth;
    const h = videoElement.videoHeight;
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  return {
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

      if (confidence !== undefined && confidence !== null) {
        const text = `${Math.round(confidence * 100)}%`;
        const fontSize = Math.max(12, height * 0.12);
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.fillStyle = config.BOX_COLOR;
        ctx.textBaseline = "top";
        ctx.fillText(text, x + 4, y + 4);
      }
    },

    clear() {
      if (!ctx) return;
      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
})();
