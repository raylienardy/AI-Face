/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 6 Stage 6.5
 */
"use strict";

FaceAI.capture = (function () {
  let countdownTimer = null;
  let currentCount = 0;
  let isCountingDown = false;
  let stateWatchInterval = null;
  const COUNTDOWN_SECONDS = 3;
  let lastCapture = null;

  function startCountdown() {
    if (isCountingDown) return;
    isCountingDown = true;
    FaceAI.state.set("COUNTDOWN");
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
    FaceAI.state.set("FACE_FOUND");
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
      FaceAI.state.set("FACE_FOUND");
      return;
    }

    FaceAI.state.set("CAPTURING");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const video = FaceAI.ui.getVideoElement();
    const canvas = FaceAI.capture.takeSnapshot(video);
    if (!canvas) {
      console.error("Auto capture failed: snapshot returned null");
      lastCapture = null;
      FaceAI.state.set("FACE_FOUND");
      return;
    }

    lastCapture = canvas;
    console.log(
      "Auto capture successful! Canvas size:",
      canvas.width,
      "x",
      canvas.height,
    );

    FaceAI.detection.stop();
    const dataURL = FaceAI.capture.toDataURL(canvas);
    FaceAI.ui.showPreview(dataURL);
    FaceAI.ui.showCaptureButtons();
    FaceAI.state.set("CAPTURED");
  }

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

  function onRetake() {
    FaceAI.ui.hidePreview();
    FaceAI.ui.hideCaptureButtons();
    lastCapture = null;

    const video = FaceAI.ui.getVideoElement();
    FaceAI.detection.start(video);
    FaceAI.state.set("CAMERA_READY");
  }

  async function onContinue() {
    const canvas = FaceAI.capture.getLastCapture();
    if (!canvas) {
      FaceAI.ui.showError("No captured image found. Please retake.");
      return;
    }

    const btn = document.getElementById("continue-btn");
    if (!btn) return;

    // Cegah double‑submit
    if (btn.disabled) return;

    // Tampilkan status uploading
    btn.textContent = "Uploading…";
    btn.disabled = true;

    try {
      const response = await FaceAI.upload.send(canvas);
      console.log("Upload successful:", response);
      FaceAI.ui.showError(""); // hapus error sebelumnya
      btn.textContent = "Uploaded ✓";
      // Tombol tetap disabled, tidak bisa diklik lagi
      FaceAI.state.set("RESULT_READY"); // siap untuk langkah berikutnya (analisis)
    } catch (error) {
      console.error("Upload failed:", error.message);
      FaceAI.ui.showError(error.message);
      btn.textContent = "Retry Upload";
      btn.disabled = false; // izinkan retry
    }
  }

  function bindButtons() {
    const retakeBtn = document.getElementById("retake-btn");
    const continueBtn = document.getElementById("continue-btn");
    if (retakeBtn) retakeBtn.addEventListener("click", onRetake);
    if (continueBtn) continueBtn.addEventListener("click", onContinue);
  }

  return {
    init() {
      if (stateWatchInterval) return;
      stateWatchInterval = setInterval(checkState, 200);
      bindButtons();
      console.log("Capture module initialized (Stage 6.5)");
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
