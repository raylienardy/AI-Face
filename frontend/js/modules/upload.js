/**
 * FaceAI Upload Module
 * Version: 0.1 – Milestone 7 Stage 7.2
 *
 * Sends the captured canvas to the backend via HTTP multipart upload.
 */
"use strict";

FaceAI.upload = (function () {
  return {
    /**
     * Upload a canvas as JPEG to the backend.
     * @param {HTMLCanvasElement} canvas - captured image
     * @returns {Promise<object>} backend response (JSON)
     */
    async send(canvas) {
      if (!canvas) {
        throw new Error("No canvas provided");
      }

      // Convert canvas to Blob (JPEG, quality 0.9)
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")),
          "image/jpeg",
          0.9,
        );
      });

      // Build FormData
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const url = FaceAI.config.BACKEND_UPLOAD_URL;

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let detail = `Server error: ${response.status}`;
          try {
            const errData = await response.json();
            detail = errData.detail || detail;
          } catch (_) {
            /* ignore parse error */
          }
          throw new Error(detail);
        }

        return await response.json();
      } catch (error) {
        // Network errors (TypeError) are common
        if (error instanceof TypeError) {
          throw new Error("Network error. Please check your connection.");
        }
        throw error; // rethrow other errors
      }
    },
  };
})();
