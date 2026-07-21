/**
 * FaceAI Upload Module
 * Version: 0.1 – Milestone 7 Stage 7.4
 *
 * Sends the captured canvas to the backend via HTTP multipart upload.
 * Includes timeout and error classification.
 */
"use strict";

FaceAI.upload = (function () {
  const UPLOAD_TIMEOUT_MS = 15000; // 15 detik

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

      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          let detail = `Server error (${response.status})`;
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
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Upload timed out. Please check your connection.");
        }
        if (error instanceof TypeError) {
          throw new Error("Network error. Please check your connection.");
        }
        // Re-throw other errors (server, validation)
        throw error;
      }
    },
  };
})();
