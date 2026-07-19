/**
 * FaceAI Drawing Module
 * Version: 0.1 – Milestone 4 Stage 4.4
 *
 * Handles canvas overlays: multiple bounding boxes with styles.
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

  function drawSingleBox(box) {
    const { x, y, w, h, confidence, color, lineWidth, showConfidence } = box;
    ctx.beginPath();
    ctx.lineWidth = lineWidth || FaceAI.config.BOX_LINE_WIDTH;
    ctx.strokeStyle = color || FaceAI.config.BOX_COLOR;
    ctx.rect(x, y, w, h);
    ctx.stroke();

    if (showConfidence && confidence !== undefined && confidence !== null) {
      const text = `${Math.round(confidence * 100)}%`;
      const fontSize = Math.max(12, h * 0.12);
      ctx.font = `${fontSize}px system-ui, sans-serif`;
      ctx.fillStyle = color || FaceAI.config.BOX_COLOR;
      ctx.textBaseline = "top";
      ctx.fillText(text, x + 4, y + 4);
    }
  }

  return {
    /**
     * Draw multiple bounding boxes.
     * @param {Array} boxes - array of box objects
     */
    drawBoxes(boxes) {
      if (!ctx || !boxes || boxes.length === 0) return;
      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const box of boxes) {
        drawSingleBox(box);
      }
    },

    /**
     * Clear the canvas.
     */
    clear() {
      if (!ctx) return;
      const videoEl = FaceAI.ui.getVideoElement();
      syncCanvasSize(videoEl);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
})();
