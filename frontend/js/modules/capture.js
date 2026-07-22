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

  async function fetchReport(filename) {
    const reportUrl = `http://localhost:8000/api/report?file=${encodeURIComponent(filename)}`;
    try {
      const res = await fetch(reportUrl);
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      const reportData = await res.json();
      displayReport(reportData);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      FaceAI.ui.showError("Failed to load analysis report.");
    }
  }

  function displayReport(data) {
    const container = document.getElementById("report-container");
    const content = document.getElementById("report-content");
    if (!container || !content) return;

    let html = `
      <div class="report-overall">
        <strong>Overall Score: ${data.overall.value.toFixed(1)}</strong> 
        (confidence: ${(data.overall.confidence * 100).toFixed(0)}%)
      </div>
    `;
    // Detail categories (contoh: eyes, nose, dll)
    const categories = [
      { key: "face_structure", label: "Face Structure" },
      { key: "eyes", label: "Eyes" },
      { key: "eyebrows", label: "Eyebrows" },
      { key: "nose", label: "Nose" },
      { key: "mouth", label: "Mouth" },
      { key: "jaw", label: "Jaw" },
      { key: "cheek", label: "Cheeks" },
      { key: "skin", label: "Skin" },
    ];
    for (const cat of categories) {
      const catData = data[cat.key];
      if (!catData) continue;
      html += `<div class="report-category"><strong>${cat.label}</strong><div class="report-scores">`;
      // Iterasi properti dalam kategori (kecuali shape yang khusus)
      for (const [prop, val] of Object.entries(catData)) {
        if (prop === "shape" && cat.key === "face_structure") continue; // shape ditampilkan terpisah
        if (typeof val === "object" && val !== null && "value" in val) {
          html += `<div class="report-score"><span>${prop}</span><span>${val.value.toFixed(1)}</span></div>`;
        }
      }
      html += `</div></div>`;
    }
    // Strengths & suggestions
    if (data.strengths && data.strengths.length > 0) {
      html += `<div class="report-strengths"><strong>Strengths:</strong><ul>`;
      data.strengths.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }
    if (data.suggestions && data.suggestions.length > 0) {
      html += `<div class="report-suggestions"><strong>Suggestions:</strong><ul>`;
      data.suggestions.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }

    content.innerHTML = html;
    container.style.display = "block";

    // Tampilkan tombol View History
    const historyActions = document.getElementById("history-actions");
    if (historyActions) {
      historyActions.style.display = "block";
    }
    // Jika elemen belum ada, kita bisa buat secara dinamis
    if (!document.getElementById("view-history-btn")) {
      const btn = document.createElement("button");
      btn.id = "view-history-btn";
      btn.className = "btn btn--secondary";
      btn.textContent = "View History";
      btn.addEventListener("click", () => {
        // Sembunyikan report container, tampilkan history panel
        document.getElementById("report-container").style.display = "none";
        FaceAI.history.show();
      });
      // Tempatkan di bawah report container
      const container = document.getElementById("report-container");
      container.parentNode.insertBefore(btn, container.nextSibling);
    }
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
    document.getElementById("report-container").style.display = "none";
    lastCapture = null;

    const video = FaceAI.ui.getVideoElement();
    FaceAI.detection.start(video);
    FaceAI.state.set("CAMERA_READY");

    const viewBtn = document.getElementById("view-history-btn");
    if (viewBtn) viewBtn.style.display = "none";
    FaceAI.history.hide();
    document.getElementById("report-container").style.display = "none";
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

    btn.textContent = "Uploading…";
    btn.disabled = true;

    try {
      const response = await FaceAI.upload.send(canvas);
      console.log("Upload successful:", response);
      FaceAI.ui.showError("");
      btn.textContent = "Uploaded ✓";
      FaceAI.state.set("RESULT_READY");

      // --- Panggil report endpoint menggunakan filename dari response ---
      const filename = response.filename;
      fetchReport(filename);
    } catch (error) {
      console.error("Upload failed:", error.message);
      FaceAI.ui.showError(error.message);
      btn.textContent = "Retry Upload";
      btn.disabled = false;
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
