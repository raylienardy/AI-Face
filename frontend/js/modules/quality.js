/**
 * FaceAI Quality Assessment Module
 * Version: 0.1 – Milestone 5 Stage 5.1
 *
 * Placeholder for quality checks. Registers observer to receive face data.
 */
"use strict";

FaceAI.quality = (function () {
  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Initialize quality module.
     * Registers callback to receive face data from detection.
     */
    init() {
      FaceAI.detection.onFaceData((faceData) => {
        if (faceData) {
          console.log("Quality: face data received", faceData);
          // Di stage berikutnya, di sini akan dipanggil checker position, size, dll.
        } else {
          console.log("Quality: no face detected");
        }
      });
      console.log("Quality module initialized");
    },
  };
})();
