/**
 * FaceAI Capture Module
 * Version: 0.2 – Milestone 12 Fase Akhir
 *
 * - takeSnapshot(video) → canvas
 * - State‑driven countdown & auto capture
 * - Upload, report fetching, display
 * - Loading states & micro‑interactions
 * - Rich report with feature scores, progress bars, and dev mode
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

    // Stop detection & camera completely
    FaceAI.detection.stop();
    FaceAI.camera.stop();

    // Hide guidance and camera‑related UI
    FaceAI.ui.showUserGuidance(false);
    FaceAI.ui.setButtonActive(false); // tombol "Mulai Kamera" kembali normal
    document.getElementById("start-camera-btn").style.display = "none"; // sembunyikan tombol

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
      FaceAI.ui.showError("Foto tidak ditemukan. Silakan ulangi.");
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
      btn.textContent = "Selesai ✓";
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
      content.innerHTML = '<p class="loading-text">Menganalisis…</p>';
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
          '<p class="loading-text">Gagal memuat laporan. Silakan coba lagi.</p>';
      }
      FaceAI.ui.showError("Gagal memuat laporan analisis.");
    }
  }

  // ==========================================
  // Report Display
  // ==========================================
  function displayReport(data) {
    // Sembunyikan tombol Mulai Kamera
    FaceAI.ui.showUserGuidance(false);
    document.getElementById("start-camera-btn").style.display = "none";

    const container = document.getElementById("report-container");
    const content = document.getElementById("report-content");
    if (!container || !content) return;

    const isDev = document.body.classList.contains("dev-mode");
    const score = data.overall.value.toFixed(1);
    const confidence = (data.overall.confidence * 100).toFixed(0);

    let html = "";

    // ==========================================
    // 1. Overall Score (selalu muncul)
    // ==========================================
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

    // ==========================================
    // 2. Feature Scores Grid (selalu muncul)
    // ==========================================
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
          const value = featureData.value || 0;
          const conf = featureData.confidence
            ? Math.round(featureData.confidence * 100)
            : null;
          const confText = conf
            ? `<span class="feature-confidence">${conf}% yakin</span>`
            : "";
          html += `
            <div class="feature-item">
              <div class="feature-header">
                <span class="feature-label">${f.label}</span>
                <span class="feature-score">${Math.round(value)}/100</span>
              </div>
              <div class="feature-bar">
                <div class="feature-bar-fill" style="width:${value}%"></div>
              </div>
              ${confText}
            </div>
          `;
        }
      });
      html += `</div>`;
    }

    // ==========================================
    // 3. Strengths & Suggestions (selalu muncul)
    // ==========================================
    if (data.strengths && data.strengths.length > 0) {
      html += `<div class="report-strengths"><strong>💪 Kelebihan</strong><ul>`;
      data.strengths.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }
    if (data.suggestions && data.suggestions.length > 0) {
      html += `<div class="report-suggestions"><strong>💡 Saran Peningkatan</strong><ul>`;
      data.suggestions.forEach((s) => (html += `<li>${s}</li>`));
      html += `</ul></div>`;
    }

    // ==========================================
    // 4. Mode Developer: toggle detail teknis
    // ==========================================
    if (isDev) {
      html += `
        <div class="report-detail-toggle" style="margin-top:1rem;">
          <button id="toggle-detail-btn" class="btn btn--small">📋 Detail Teknis</button>
          <div id="detail-content" style="display:none;"></div>
        </div>
      `;
    }

    content.innerHTML = html;
    container.classList.add("visible");
    container.style.display = "block";

    // Event untuk toggle detail
    if (isDev) {
      document
        .getElementById("toggle-detail-btn")
        ?.addEventListener("click", () => {
          const detailDiv = document.getElementById("detail-content");
          if (detailDiv.style.display === "none" || !detailDiv.style.display) {
            detailDiv.innerHTML = generateTechnicalDetail(data);
            detailDiv.style.display = "block";
          } else {
            detailDiv.style.display = "none";
          }
        });
    }

    // Sembunyikan tombol View History jika history dimatikan
    if (FaceAI.config.ENABLE_HISTORY) {
      let viewBtn = document.getElementById("view-history-btn");
      if (!viewBtn) {
        viewBtn = document.createElement("button");
        viewBtn.id = "view-history-btn";
        viewBtn.className = "btn btn--secondary";
        viewBtn.textContent = "📜 Riwayat";
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
  // Helper: Technical Detail (untuk mode developer)
  // ==========================================
  function generateTechnicalDetail(data) {
    let html = '<div style="overflow-x:auto;"><table class="tech-table">';
    html += "<tr><th>Fitur</th><th>Nilai</th><th>Keyakinan</th></tr>";
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
      const fd = data.feature_scores?.[f.key];
      if (fd) {
        html += `<tr><td>${f.label}</td><td>${fd.value?.toFixed(1) || "-"}</td><td>${fd.confidence ? (fd.confidence * 100).toFixed(0) + "%" : "-"}</td></tr>`;
      }
    });
    html += "</table></div>";
    return html;
  }

  // ==========================================
  // Retake
  // ==========================================
  function onRetake() {
    // Reset tombol Continue
    document.getElementById("start-camera-btn").style.display = "block";
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.textContent = "Analisa";
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

    // Tampilkan tombol kamera kembali
    const startBtn = document.getElementById("start-camera-btn");
    if (startBtn) {
      startBtn.style.display = "block";
      startBtn.textContent = "Mulai Kamera";
      startBtn.disabled = false;
    }

    lastCapture = null;

    // Mulai ulang kamera → deteksi akan otomatis berjalan setelah kamera siap
    FaceAI.camera.start().then(() => {
      const video = FaceAI.ui.getVideoElement();
      FaceAI.detection.start(video);
      FaceAI.ui.showUserGuidance(true);
      FaceAI.ui.updateUserGuidance("Posisikan wajah di depan kamera");
    });
    FaceAI.state.set("CAMERA_READY");
  }

  // ==========================================
  // Button Binding
  // ==========================================
  function bindButtons() {
    const retakeBtn = document.getElementById("retake-btn");
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.textContent = "Analisa";
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
      console.log("Capture module initialized (Stage 12 final)");
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
