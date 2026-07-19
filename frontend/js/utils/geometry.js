/**
 * FaceAI Geometry Utilities
 * Version: 0.2 – Milestone 4 Stage 4.5 (revised)
 *
 * Robust face alignment using eye landmarks + bounding box crop.
 */
"use strict";

FaceAI.geometry = (function () {
  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Align a face using eye positions and bounding box.
     * @param {HTMLVideoElement} video - source video element
     * @param {Array} landmarks - BlazeFace landmarks (at least 2: right eye, left eye)
     * @param {Object} bbox - face bounding box {x, y, w, h} in pixels
     * @param {number} targetSize - output canvas size
     * @returns {HTMLCanvasElement|null}
     */
    alignFace(video, landmarks, bbox, targetSize = 150) {
      if (!video || !landmarks || landmarks.length < 2 || !bbox) return null;

      const rightEye = landmarks[0];
      const leftEye = landmarks[1];
      if (!rightEye || !leftEye) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Koordinat mata dalam pixel
      const reX = rightEye.x * vw;
      const reY = rightEye.y * vh;
      const leX = leftEye.x * vw;
      const leY = leftEye.y * vh;

      // Sudut antara mata
      const dx = leX - reX;
      const dy = leY - reY;
      const angle = Math.atan2(dy, dx); // radian

      // Perluas bounding box untuk memberi margin (ambil 25% lebih besar)
      const margin = 0.25;
      const cx = bbox.x + bbox.w / 2;
      const cy = bbox.y + bbox.h / 2;
      const bw = bbox.w * (1 + margin);
      const bh = bbox.h * (1 + margin);
      const bx = Math.max(0, cx - bw / 2);
      const by = Math.max(0, cy - bh / 2);
      const cropW = Math.min(vw - bx, bw);
      const cropH = Math.min(vh - by, bh);

      // Buat canvas sementara untuk crop
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropW;
      cropCanvas.height = cropH;
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(video, bx, by, cropW, cropH, 0, 0, cropW, cropH);

      // Canvas output
      const output = document.createElement("canvas");
      output.width = targetSize;
      output.height = targetSize;
      const ctx = output.getContext("2d");

      // Hitung skala agar crop pas di output
      const scale = Math.min(targetSize / cropW, targetSize / cropH);

      // Pusat rotasi adalah titik tengah crop (di mana mata berada relatif terhadap crop)
      const eyeCenterCropX = (reX + leX) / 2 - bx;
      const eyeCenterCropY = (reY + leY) / 2 - by;

      // Transformasi: pindahkan pusat output ke tengah, rotasi, skala, lalu gambar crop dengan offset sehingga pusat mata berada di tengah output
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate(-angle); // luruskan
      ctx.scale(scale, scale);
      ctx.drawImage(cropCanvas, -eyeCenterCropX, -eyeCenterCropY);

      return output;
    },
  };
})();
