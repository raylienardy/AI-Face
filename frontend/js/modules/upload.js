/**
 * FaceAI Upload Module
 * Version: 0.2 – Milestone 7 Stage 7.4
 *
 * Sends the captured canvas to the backend via HTTP multipart upload.
 * Includes timeout and detailed error classification.
 */
"use strict";

FaceAI.upload = (function () {
  const TIMEOUT_MS = 15000; // 15 detik

  return {
    /**
     * Upload a canvas as JPEG to the backend.
     * @param {HTMLCanvasElement} canvas
     * @returns {Promise<object>} backend response (JSON)
     */
    async send(canvas) {
      if (!canvas) {
        throw new Error("No canvas provided");
      }

      // Convert canvas to Blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
          "image/jpeg",
          0.9,
        );
      });

      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const url = FaceAI.config.BACKEND_UPLOAD_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          let detail = `Server error: ${response.status}`;
          try {
            const errData = await response.json();
            detail = errData.detail || detail;
          } catch (_) {
            /* parse error ignored */
          }
          throw new Error(detail);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        // Klasifikasi error
        if (error.name === "AbortError") {
          throw new Error(
            "Upload timed out. Please check your connection and try again.",
          );
        }
        if (error instanceof TypeError) {
          // Network error (fetch gagal)
          throw new Error(
            "Network error. Please check your internet connection.",
          );
        }
        // Error lain (server, validasi) – lempar ulang dengan pesan yang sudah ada
        throw error;
      }
    },
  };
})();
