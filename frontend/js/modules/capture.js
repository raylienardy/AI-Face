/**
 * FaceAI Capture Module
 * Version: 0.1 – Milestone 12 Stage 12.3
 *
 * - takeSnapshot(video) → canvas
 * - State‑driven countdown & auto capture
 * - Upload, report fetching, display
 * - Loading states & micro‑interactions
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

    // Wait a little for countdown overlay to disappear
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

    // Stop detection to save resources
    FaceAI.detection.stop();

    // Show preview
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
  // Upload & Report
  // ==========================================
  async function onContinue() {
    const canvas = FaceAI.capture.getLastCapture();
    if (!canvas) {
      FaceAI.ui.showError("No captured image found. Please retake.");
      return;
    }

    const btn = document.getElementById("continue-btn");
    if (!btn) return;

    // Prevent double‑submit
    if (btn.disabled) return;

    // Tampilkan spinner
    btn.innerHTML = '<span class="spinner"></span> Mengunggah…';
    btn.disabled = true;

    try {
      const response = await FaceAI.upload.send(canvas);
      console.log("Upload successful:", response);
      FaceAI.ui.showError("");
      btn.textContent = "Tersimpan ✓";
      FaceAI.state.set("RESULT_READY");
      const filename = response.filename;
      fetchReport(filename);
    } catch (error) {
      console.error("Upload failed:", error.message);
      FaceAI.ui.showError(error.message);
      btn.textContent = "Coba Lagi";
      btn.disabled = false;
    }
  }

  async function fetchReport(filename) {
    const container = document.getElementById("report-container");
    const content = document.getElementById("report-content");
    if (container && content) {
      container.style.display = "block";
      container.classList.remove("visible"); // reset fade
      content.innerHTML = '<p class="loading-text">Analyzing…</p>';
    }

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
      if (content) {
        content.innerHTML =
          '<p class="loading-text">Failed to load report. Please try again.</p>';
      }
      FaceAI.ui.showError("Failed to load analysis report.");
    }
  }

  function displayReport(data) {
    const container = document.getElementById("report-container");
    const content = document.getElementById("report-content");
    if (!container || !content) return;

    const isDev = document.body.classList.contains("dev-mode");

    if (isDev) {
      // ===== MODE DEVELOPER: tampilan lengkap seperti sebelumnya =====
      let html = `
        <div class="report-overall">
          <span class="report-overall-label">Overall Attractiveness</span>
          <span class="report-overall-score">${data.overall.value.toFixed(1)}</span>
          <span class="report-overall-confidence">Confidence ${(data.overall.confidence * 100).toFixed(0)}%</span>
        </div>
        <div class="report-categories">
      `;
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
        for (const [prop, val] of Object.entries(catData)) {
          if (prop === "shape" && cat.key === "face_structure") continue;
          if (typeof val === "object" && val !== null && "value" in val) {
            html += `<div class="report-score"><span>${prop}</span><span>${val.value.toFixed(1)}</span></div>`;
          }
        }
        html += `</div></div>`;
      }
      html += `</div>`; // tutup report-categories

      if (data.strengths && data.strengths.length > 0) {
        html += `<div class="report-strengths"><strong>Strengths</strong><ul>`;
        data.strengths.forEach((s) => (html += `<li>${s}</li>`));
        html += `</ul></div>`;
      }
      if (data.suggestions && data.suggestions.length > 0) {
        html += `<div class="report-suggestions"><strong>Suggestions</strong><ul>`;
        data.suggestions.forEach((s) => (html += `<li>${s}</li>`));
        html += `</ul></div>`;
      }
      content.innerHTML = html;
    } else {
      // ===== MODE NORMAL: tampilan sederhana =====
      const score = data.overall.value.toFixed(1);
      const confidence = (data.overall.confidence * 100).toFixed(0);
      let html = `
        <div class="report-overall-simple">
          <div class="report-overall-score-big">${score}</div>
          <div class="report-score-bar">
            <div class="report-score-bar-fill" style="width:${score}%"></div>
          </div>
          <div class="report-overall-label">Overall Attractiveness</div>
          <div class="report-overall-confidence">Confidence ${confidence}%</div>
        </div>
      `;

      if (data.strengths && data.strengths.length > 0) {
        html += `<div class="report-strengths"><strong>Strengths</strong><ul>`;
        data.strengths.forEach((s) => (html += `<li>${s}</li>`));
        html += `</ul></div>`;
      }
      if (data.suggestions && data.suggestions.length > 0) {
        html += `<div class="report-suggestions"><strong>Suggestions</strong><ul>`;
        data.suggestions.forEach((s) => (html += `<li>${s}</li>`));
        html += `</ul></div>`;
      }
      content.innerHTML = html;
    }

    container.classList.add("visible"); // fade in
    container.style.display = "block";

    // Tampilkan tombol View History (hanya jika belum ada)
    if (FaceAI.config.ENABLE_HISTORY) {
      let viewBtn = document.getElementById("view-history-btn");
      if (!viewBtn) {
        viewBtn = document.createElement("button");
        viewBtn.id = "view-history-btn";
        viewBtn.className = "btn btn--secondary";
        viewBtn.textContent = "View History";
        viewBtn.addEventListener("click", () => {
          document.getElementById("report-container").style.display = "none";
          FaceAI.history.show();
        });
        container.parentNode.insertBefore(viewBtn, container.nextSibling);
      } else {
        viewBtn.style.display = "inline-block";
      }
    }
  }

  // ==========================================
  // Retake
  // ==========================================
  function onRetake() {
    // Reset tombol Continue
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.textContent = "Continue";
      continueBtn.disabled = false;
    }

    FaceAI.ui.hidePreview();
    const previewImg = document.getElementById("capture-preview");
    if (previewImg) {
      previewImg.removeAttribute("src");
    }
    FaceAI.ui.hideCaptureButtons();

    // Sembunyikan report dan history
    const reportContainer = document.getElementById("report-container");
    if (reportContainer) {
      reportContainer.style.display = "none";
      reportContainer.classList.remove("visible");
    }
    const viewBtn = document.getElementById("view-history-btn");
    if (viewBtn) viewBtn.style.display = "none";
    FaceAI.history.hide();

    lastCapture = null;

    const video = FaceAI.ui.getVideoElement();
    FaceAI.detection.start(video);
    FaceAI.state.set("CAMERA_READY");
  }

  // ==========================================
  // Button Binding
  // ==========================================
  function bindButtons() {
    const retakeBtn = document.getElementById("retake-btn");
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.textContent = "Continue";
      continueBtn.disabled = false;
    }
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
      console.log("Capture module initialized (Stage 12.3)");
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
