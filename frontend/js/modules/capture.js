/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 6 Stage 6.2
 *
 * - takeSnapshot(video) → canvas
 * - State‑driven countdown (listens for FACE_READY)
 */
"use strict";

FaceAI.capture = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let countdownTimer = null; // setTimeout handle
  let currentCount = 0; // detik tersisa
  let isCountingDown = false; // flag
  let stateWatchInterval = null; // interval untuk polling state
  const COUNTDOWN_SECONDS = 3;

  // ==========================================
  // Countdown Logic (private)
  // ==========================================
  function startCountdown() {
    if (isCountingDown) return;
    isCountingDown = true;
    currentCount = COUNTDOWN_SECONDS;
    showCurrentCount();
  }

  function cancelCountdown(reason) {
    if (!isCountingDown) return;
    isCountingDown = false;
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
    FaceAI.ui.hideCountdown();
    console.log("Countdown cancelled:", reason);
  }

  function showCurrentCount() {
    if (!isCountingDown) return;

    if (currentCount > 0) {
      FaceAI.ui.showCountdown(String(currentCount));
      countdownTimer = setTimeout(() => {
        currentCount--;
        if (currentCount > 0) {
          showCurrentCount();
        } else {
          // Countdown selesai – trigger capture (Stage 6.3)
          finishCountdown();
        }
      }, 1000);
    }
  }

  function finishCountdown() {
    isCountingDown = false;
    FaceAI.ui.hideCountdown();
    // Placeholder untuk Stage 6.3 – capture akan dipanggil di sini
    console.log("Countdown finished – ready to capture");
    // TODO Stage 6.3: FaceAI.capture.takeSnapshot(...)
  }

  // ==========================================
  // State Monitoring
  // ==========================================
  function checkState() {
    const state = FaceAI.state.get();
    if (state === "FACE_READY") {
      if (!isCountingDown) {
        startCountdown();
      }
    } else {
      if (isCountingDown) {
        cancelCountdown("state changed to " + state);
      }
    }
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Mulai memantau state machine untuk auto‑countdown.
     * Dipanggil sekali setelah kamera & deteksi aktif.
     */
    init() {
      if (stateWatchInterval) return; // sudah berjalan
      stateWatchInterval = setInterval(checkState, 200);
      console.log("Capture module initialized (state watcher active)");
    },

    /**
     * Hentikan pemantauan (untuk cleanup).
     */
    destroy() {
      if (stateWatchInterval) {
        clearInterval(stateWatchInterval);
        stateWatchInterval = null;
      }
      cancelCountdown("module destroyed");
    },

    /**
     * Capture a still frame from the video element (Stage 6.1).
     * @param {HTMLVideoElement} video
     * @returns {HTMLCanvasElement|null}
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
     * Convert a canvas to a Data URL (PNG).
     * @param {HTMLCanvasElement} canvas
     * @returns {string|null}
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
