/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 6 Stage 6.4
 *
 * - takeSnapshot(video) → canvas
 * - State‑driven countdown & auto capture
 * - Preview & confirm UI (Retake / Continue)
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
  let lastCapture = null; // HTMLCanvasElement

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
          finishCountdown();
        }
      }, 1000);
    }
  }

  async function finishCountdown() {
    isCountingDown = false;
    FaceAI.ui.hideCountdown();

    if (!FaceAI.state.is("FACE_READY")) {
      console.warn("Capture aborted: quality dropped at last moment");
      lastCapture = null;
      return;
    }

    // Tunggu 100ms agar overlay countdown hilang sepenuhnya
    await new Promise((resolve) => setTimeout(resolve, 100));

    const video = FaceAI.ui.getVideoElement();
    const canvas = FaceAI.capture.takeSnapshot(video);
    if (!canvas) {
      console.error("Auto capture failed: snapshot returned null");
      lastCapture = null;
      return;
    }

    lastCapture = canvas;
    console.log(
      "Auto capture successful! Canvas size:",
      canvas.width,
      "x",
      canvas.height,
    );

    // Hentikan deteksi untuk menghemat resource selama preview
    FaceAI.detection.stop();
    // Tampilkan preview
    const dataURL = FaceAI.capture.toDataURL(canvas);
    FaceAI.ui.showPreview(dataURL);
    FaceAI.ui.showCaptureButtons();
    FaceAI.state.set("CAPTURED");
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
  // Tombol Aksi
  // ==========================================
  function onRetake() {
    // Sembunyikan preview dan tombol
    FaceAI.ui.hidePreview();
    FaceAI.ui.hideCaptureButtons();
    lastCapture = null;

    // Kembalikan ke mode live
    const video = FaceAI.ui.getVideoElement();
    FaceAI.detection.start(video); // akan menunggu video siap, lalu mulai deteksi
    FaceAI.state.set("CAMERA_READY");
  }

  function onContinue() {
    // Saat ini, hanya log dan set state tetap CAPTURED
    console.log("User chose to continue. Image ready for backend.");
    FaceAI.state.set("CAPTURED");
    // Milestone 7 akan menambahkan upload di sini
  }

  function bindButtons() {
    const retakeBtn = document.getElementById("retake-btn");
    const continueBtn = document.getElementById("continue-btn");
    if (retakeBtn) retakeBtn.addEventListener("click", onRetake);
    if (continueBtn) continueBtn.addEventListener("click", onContinue);
  }

  // ==========================================
  // Public API
  // ==========================================
  return {
    init() {
      if (stateWatchInterval) return;
      stateWatchInterval = setInterval(checkState, 200);
      bindButtons();
      console.log("Capture module initialized (Stage 6.4)");
    },

    destroy() {
      if (stateWatchInterval) {
        clearInterval(stateWatchInterval);
        stateWatchInterval = null;
      }
      cancelCountdown("module destroyed");
    },

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

    toDataURL(canvas) {
      if (!canvas) return null;
      try {
        return canvas.toDataURL("image/png");
      } catch (error) {
        console.error("FaceAI.capture: toDataURL failed", error);
        return null;
      }
    },

    getLastCapture() {
      return lastCapture;
    },
  };
})();
