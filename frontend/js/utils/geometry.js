/**
 * FaceAI Geometry Utilities
 * Version: 0.1 – Milestone 4 Stage 4.5
 *
 * Functions for face alignment using eye landmarks.
 */
"use strict";

FaceAI.geometry = (function () {
  // ==========================================
  // Public API
  // ==========================================

  return {
    /**
     * Align a face using eye positions.
     * Returns a square canvas element with the aligned face.
     *
     * @param {HTMLVideoElement} video - source video element
     * @param {Object} landmarks - BlazeFace landmarks (array of {x, y, z} or object with keys)
     *   Expected: landmarks[0] = right eye, landmarks[1] = left eye
     * @param {number} targetSize - output width & height in pixels
     * @returns {HTMLCanvasElement|null} canvas with aligned face, or null if landmarks invalid
     */
    alignFace(video, landmarks, targetSize = 150) {
      if (!video || !landmarks || landmarks.length < 2) return null;

      // BlazeFace landmarks order (6 points):
      // 0: right eye, 1: left eye, 2: nose, 3: mouth, 4: right ear, 5: left ear
      const rightEye = landmarks[0];
      const leftEye = landmarks[1];

      if (!rightEye || !leftEye) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Convert relative coords (0-1 or 0-100? BlazeFace uses normalized [0,1] for landmarks)
      // Actually, BlazeFace landmarks are normalized to [0,1] relative to image dimensions.
      // So we multiply by video dimensions.
      const reX = rightEye.x * vw;
      const reY = rightEye.y * vh;
      const leX = leftEye.x * vw;
      const leY = leftEye.y * vh;

      // Compute angle between the eyes
      const dx = leX - reX;
      const dy = leY - reY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI); // degrees

      // Center point between eyes
      const centerX = (reX + leX) / 2;
      const centerY = (reY + leY) / 2;

      // Desired eye distance in output (we'll scale so that eye distance is about 40% of target size)
      const eyeDist = Math.sqrt(dx * dx + dy * dy);
      if (eyeDist < 1) return null; // avoid division by zero

      const desiredEyeDist = targetSize * 0.4; // 40% of output width
      const scale = desiredEyeDist / eyeDist;

      // Create an offscreen canvas for the alignment
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");

      // Translate to center of output, rotate, scale
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate((-angle * Math.PI) / 180); // rotate to align eyes horizontally
      ctx.scale(scale, scale);
      // Draw the video frame centered at the eye midpoint
      ctx.drawImage(video, -centerX, -centerY, vw, vh);

      // Note: we don't crop tightly to face; the entire rotated image is drawn.
      // We can later add a face crop using bounding box if needed.

      return canvas;
    },
  };
})();
