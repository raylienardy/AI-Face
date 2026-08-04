/**
 * FaceAI Capture Module
 * Version: 0.2 – Final Telkom AI
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

    FaceAI.detection.stop();
    FaceAI.camera.stop();
    FaceAI.ui.showUserGuidance(false);
    FaceAI.ui.setButtonActive(false);
    document.getElementById("start-camera-btn").style.display = "none";

    const dataURL = FaceAI.capture.toDataURL(canvas);
    FaceAI.ui.showPreview(dataURL);
    FaceAI.ui.showCaptureButtons();
    FaceAI.state.set("CAPTURED");
  }

  function checkState() {
    const state = FaceAI.state.get();
    if (state === "FACE_READY") {
      if (!isCountingDown) startCountdown();
    } else {
      if (isCountingDown) cancelCountdown("state changed to " + state);
    }
  }

  async function onContinue() {
    const canvas = FaceAI.capture.getLastCapture();
    if (!canvas) {
      FaceAI.ui.showError("Foto tidak ditemukan. Silakan ulangi.");
      return;
    }

    const btn = document.getElementById("continue-btn");
    if (!btn || btn.disabled) return;

    btn.innerHTML = '<span class="spinner"></span> Menganalisis…';
    btn.disabled = true;

    try {
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      const formData = new FormData();
      formData.append("file", blob, "capture.jpg");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }

      console.log("Analysis successful:", data);
      btn.textContent = "Selesai ✓";
      btn.disabled = true;
      FaceAI.ui.showError("");
      FaceAI.state.set("RESULT_READY");
      displayReport(data);
    } catch (error) {
      console.error("Analysis failed:", error.message);
      FaceAI.ui.showError(error.message);
      btn.textContent = "Coba Lagi";
      btn.disabled = false;
    }
  }

  function displayReport(data) {
    const container = document.getElementById("report-container");
    const content = document.getElementById("report-content");
    if (!container || !content) return;

    const isDev = document.body.classList.contains("dev-mode");
    const score = (data.overall_score ?? 0).toFixed(1);
    const confidence = ((data.confidence ?? 0) * 100).toFixed(0);

    let html = "";

    // Overall Score
    html += `
      <div class="report-overall-simple">
        <div class="report-overall-score-big">${score}</div>
        <div class="report-score-bar">
          <div class="report-score-bar-fill" style="width:${score}%"></div>
        </div>
        <div class="report-overall-label">Skor Kecantikan</div>
        <div class="report-overall-confidence">Keyakinan AI: ${confidence}%</div>
      </div>
    `;

    // Feature Scores
    if (data.feature_scores) {
      html += `<div class="report-features-grid">`;
      const features = [
        { key: "eyes", label: "Mata" },
        { key: "eyebrows", label: "Alis" },
        { key: "nose", label: "Hidung" },
        { key: "lips", label: "Bibir" },
        { key: "jaw", label: "Garis Rahang" },
        { key: "skin", label: "Kulit" },
        { key: "hair", label: "Rambut" },
        { key: "cheekbones", label: "Tulang Pipi" },
        { key: "facial_harmony", label: "Harmoni Wajah" },
        { key: "facial_symmetry", label: "Simetri Wajah" },
      ];
      features.forEach((f) => {
        const featureData = data.feature_scores[f.key];
        if (featureData) {
          const value = featureData.score || 0;
          html += `
            <div class="feature-item">
              <div class="feature-header">
                <span class="feature-label">${f.label}</span>
                <span class="feature-score">${Math.round(value)}/100</span>
              </div>
              <div class="feature-bar">
                <div class="feature-bar-fill" style="width:${value}%"></div>
              </div>
              <span class="feature-confidence">${featureData.comment || ""}</span>
            </div>
          `;
        }
      });
      html += `</div>`;
    }

    // Strengths & Suggestions
    if (data.strengths?.length) {
      html += `<div class="report-strengths"><strong>💪 Kelebihan</strong><ul>`;
      data.strengths.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }
    if (data.suggestions?.length) {
      html += `<div class="report-suggestions"><strong>💡 Saran Peningkatan</strong><ul>`;
      data.suggestions.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }

    content.innerHTML = html;
    container.classList.add("visible");
    container.style.display = "block";
  }

  function onRetake() {
    document.getElementById("start-camera-btn").style.display = "block";
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.textContent = "Analisa";
      continueBtn.disabled = false;
    }

    FaceAI.ui.hidePreview();
    const previewImg = document.getElementById("capture-preview");
    if (previewImg) previewImg.removeAttribute("src");
    FaceAI.ui.hideCaptureButtons();

    const reportContainer = document.getElementById("report-container");
    if (reportContainer) {
      reportContainer.style.display = "none";
      reportContainer.classList.remove("visible");
    }

    const startBtn = document.getElementById("start-camera-btn");
    if (startBtn) {
      startBtn.style.display = "block";
      startBtn.textContent = "Mulai Kamera";
      startBtn.disabled = false;
    }

    lastCapture = null;

    FaceAI.camera.start().then(() => {
      const video = FaceAI.ui.getVideoElement();
      FaceAI.detection.start(video);
      FaceAI.ui.showUserGuidance(true);
      FaceAI.ui.updateUserGuidance("Posisikan wajah di depan kamera");
    });
    FaceAI.state.set("CAMERA_READY");
  }

  function bindButtons() {
    document.getElementById("retake-btn")?.addEventListener("click", onRetake);
    document
      .getElementById("continue-btn")
      ?.addEventListener("click", onContinue);
  }

  return {
    init() {
      if (stateWatchInterval) return;
      stateWatchInterval = setInterval(checkState, 200);
      bindButtons();
      console.log("Capture module initialized");
    },
    destroy() {
      if (stateWatchInterval) {
        clearInterval(stateWatchInterval);
        stateWatchInterval = null;
      }
      cancelCountdown("module destroyed");
    },
    takeSnapshot(video) {
      if (!video) return null;
      const vw = video.videoWidth,
        vh = video.videoHeight;
      if (!vw || !vh) return null;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = vw;
        canvas.height = vh;
        canvas.getContext("2d").drawImage(video, 0, 0, vw, vh);
        return canvas;
      } catch (e) {
        return null;
      }
    },
    toDataURL(canvas) {
      return canvas?.toDataURL("image/png") ?? null;
    },
    getLastCapture() {
      return lastCapture;
    },
  };
})();
