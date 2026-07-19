/**
 * FaceAI Geometry Utilities
 * Version: 0.2 – Milestone 4 Stage 4.5 (fallback crop added)
 */
"use strict";

FaceAI.geometry = (function () {
  return {
    /**
     * Align a face using eye landmarks (full rotation).
     * Same as before, returns canvas or null.
     */
    alignFace(video, landmarks, bbox, targetSize = 150) {
      if (!video || !landmarks || landmarks.length < 2 || !bbox) return null;

      const rightEye = landmarks[0];
      const leftEye = landmarks[1];
      if (!rightEye || !leftEye) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      const reX = rightEye.x * vw;
      const reY = rightEye.y * vh;
      const leX = leftEye.x * vw;
      const leY = leftEye.y * vh;

      const dx = leX - reX;
      const dy = leY - reY;
      const angle = Math.atan2(dy, dx);

      // Expand bbox margin
      const margin = 0.25;
      const cx = bbox.x + bbox.w / 2;
      const cy = bbox.y + bbox.h / 2;
      const bw = bbox.w * (1 + margin);
      const bh = bbox.h * (1 + margin);
      const bx = Math.max(0, cx - bw / 2);
      const by = Math.max(0, cy - bh / 2);
      const cropW = Math.min(vw - bx, bw);
      const cropH = Math.min(vh - by, bh);

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(video, bx, by, cropW, cropH, 0, 0, cropW, cropH);

      const output = document.createElement("canvas");
      output.width = targetSize;
      output.height = targetSize;
      const ctx = output.getContext("2d");

      const scale = Math.min(targetSize / cropW, targetSize / cropH);
      const eyeCenterCropX = (reX + leX) / 2 - bx;
      const eyeCenterCropY = (reY + leY) / 2 - by;

      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate(-angle);
      ctx.scale(scale, scale);
      ctx.drawImage(cropCanvas, -eyeCenterCropX, -eyeCenterCropY);

      return output;
    },

    /**
     * Fallback: crop face using bounding box only (no rotation).
     * @param {HTMLVideoElement} video
     * @param {Object} bbox - {x, y, w, h} in pixels
     * @param {number} targetSize
     * @returns {HTMLCanvasElement}
     */
    cropFace(video, bbox, targetSize = 150) {
      if (!video || !bbox) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Expand slightly
      const margin = 0.2;
      const bw = bbox.w * (1 + margin);
      const bh = bbox.h * (1 + margin);
      const bx = Math.max(0, bbox.x + bbox.w / 2 - bw / 2);
      const by = Math.max(0, bbox.y + bbox.h / 2 - bh / 2);
      const cropW = Math.min(vw - bx, bw);
      const cropH = Math.min(vh - by, bh);

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(video, bx, by, cropW, cropH, 0, 0, cropW, cropH);

      const output = document.createElement("canvas");
      output.width = targetSize;
      output.height = targetSize;
      const ctx = output.getContext("2d");
      const scale = Math.min(targetSize / cropW, targetSize / cropH);
      const offsetX = (targetSize - cropW * scale) / 2;
      const offsetY = (targetSize - cropH * scale) / 2;
      ctx.drawImage(cropCanvas, offsetX, offsetY, cropW * scale, cropH * scale);

      return output;
    },
  };
})();
