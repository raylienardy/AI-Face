/**
 * FaceAI Drawing Module
 * Version: 0.1 – Placeholder
 *
 * Responsible for all canvas operations:
 * - Drawing face bounding boxes
 * - Drawing face landmarks (future)
 * - Clearing the canvas
 */
"use strict";

window.FaceAI = window.FaceAI || {};

FaceAI.drawing = (function () {
  // ==========================================
  // Private Cache (will be filled later)
  // ==========================================
  const canvas = document.getElementById("face-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // ==========================================
  // Public API (stub)
  // ==========================================
  return {
    /**
     * Draw a rectangle on the canvas overlay.
     * @param {number} x - top-left x (pixels)
     * @param {number} y - top-left y (pixels)
     * @param {number} width
     * @param {number} height
     */
    drawBox(x, y, width, height) {
      // TODO: Implement in Milestone 4
    },

    /**
     * Clear the entire canvas.
     */
    clear() {
      // TODO: Implement in Milestone 4
    },

    /**
     * Set canvas dimensions to match video element.
     */
    resize() {
      // TODO: Implement when video size changes
    },
  };
})();
