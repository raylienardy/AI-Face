/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 6 Stage 6.3
 *
 * - takeSnapshot(video) → canvas
 * - State‑driven countdown (FACE_READY)
 * - Auto capture trigger after countdown
 */
"use strict";

FaceAI.capture = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let countdownTimer = null;
  let currentCount = 0;
  let isCountingDown = false;
  let stateWatchInterval = null;
  const COUNTDOWN_SECONDS = 3;

  let lastCapture = null; // HTMLCanvasElement hasil capture

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
          // Countdown selesai
          finishCountdown();
        }
      }, 1000);
    }
  }

  async function finishCountdown() {
    isCountingDown = false;
    FaceAI.ui.hideCountdown();

    // Verifikasi ulang kualitas sesaat setelah countdown selesai
    if (!FaceAI.state.is("FACE_READY")) {
      console.warn("Capture aborted: quality dropped at last moment");
      lastCapture = null;
      return;
    }

    // Beri jeda kecil agar overlay countdown benar‑benar hilang dari layar
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ambil snapshot dari video
    const video = FaceAI.ui.getVideoElement();
    const canvas = FaceAI.capture.takeSnapshot(video);
    if (canvas) {
      lastCapture = canvas;
      console.log(
        "Auto capture successful! Canvas size:",
        canvas.width,
        "x",
        canvas.height,
      );
      // TODO Stage 6.4: tampilkan preview, hentikan deteksi, tampilkan tombol Retake/Continue
    } else {
      console.error("Auto capture failed: snapshot returned null");
      lastCapture = null;
    }
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
     * Mulai memantau state machine untuk auto‑countdown dan capture.
     */
    init() {
      if (stateWatchInterval) return;
      stateWatchInterval = setInterval(checkState, 200);
      console.log("Capture module initialized (auto capture ready)");
    },

    destroy() {
      if (stateWatchInterval) {
        clearInterval(stateWatchInterval);
        stateWatchInterval = null;
      }
      cancelCountdown("module destroyed");
    },

    /**
     * Ambil frame diam dari elemen video.
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
     * Konversi canvas ke Data URL (PNG).
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

    /**
     * Mengembalikan canvas hasil capture terakhir, atau null.
     */
    getLastCapture() {
      return lastCapture;
    },
  };
})();
