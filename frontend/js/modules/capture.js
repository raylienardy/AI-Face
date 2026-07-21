/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 6 Stage 6.1
 *
 * Provides snapshot capability from the active video stream.
 * No countdown or UI logic here – just freeze‑frame.
 */
"use strict";

FaceAI.capture = (function () {
  // ==========================================
  // Public API
  // ==========================================

  return {
    /**
     * Capture a still frame from the given video element.
     * The snapshot is taken directly from the video, so overlays
     * (bounding boxes, countdown, etc.) are NOT included.
     *
     * @param {HTMLVideoElement} video - the active video element
     * @returns {HTMLCanvasElement|null} canvas with the frame, or null on failure
     */
    takeSnapshot(video) {
      if (!video) {
        console.warn("FaceAI.capture: no video element");
        return null;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      if (!vw || !vh) {
        console.warn("FaceAI.capture: video has zero dimensions");
        return null;
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, vw, vh);
        return canvas;
      } catch (error) {
        console.error("FaceAI.capture: snapshot failed", error);
        return null;
      }
    },

    /**
     * Convert a canvas to a Data URL (PNG format).
     * @param {HTMLCanvasElement} canvas
     * @returns {string|null} data URL, or null on failure
     */
    toDataURL(canvas) {
      if (!canvas) return null;
      try {
        return canvas.toDataURL("image/png");
      } catch (error) {
        console.error("FaceAI.capture: toDataURL failed", error);
        return null;
      }
    },
  };
})();
