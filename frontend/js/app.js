/**
 * FaceAI Application Entry Point
 * Version: 0.1 – Fase 12.9
 *
 * Initializes app, wires camera, detection, and developer mode toggle.
 */
"use strict";

(function () {
  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    FaceAI.state.set("IDLE");
    const startBtn = document.getElementById("start-camera-btn");
    startBtn.addEventListener("click", onStartClick);

    // WebGL context loss handler
    const canvas = document.getElementById("face-canvas");
    if (canvas) {
      canvas.addEventListener("webglcontextlost", onWebGLContextLost, false);
    }

    // Cleanup when page is closed or tab hidden
    window.addEventListener("beforeunload", cleanup);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // === Mode Developer ===
    // Kembalikan status dari localStorage
    const devMode = localStorage.getItem("faceai_dev_mode") === "true";
    FaceAI.ui.setDevMode(devMode);

    // Cek koneksi backend
    checkBackendConnection();

    // Kombinasi rahasia: Ctrl+Shift+D
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === "KeyD") {
        e.preventDefault();
        const current = document.body.classList.contains("dev-mode");
        const newMode = !current;
        localStorage.setItem("faceai_dev_mode", newMode.toString());
        FaceAI.ui.setDevMode(newMode);
        FaceAI.ui.showToast(
          newMode ? "Developer mode enabled" : "Developer mode disabled",
        );
      }
    });

    console.log("FaceAI frontend initialized (v0.1 – Fase 12.9)");
  }

  async function onStartClick() {
    if (FaceAI.camera.isActive() || FaceAI.camera.isStarting()) {
      return;
    }
    try {
      await FaceAI.camera.start();
      const video = FaceAI.ui.getVideoElement();
      await FaceAI.detection.start(video);
      // Mulai quality assessment
      if (!FaceAI.quality._initialized) {
        FaceAI.quality.init();
        FaceAI.quality._initialized = true;
      }
      FaceAI.capture.init();
    } catch (err) {
      console.error("Failed to start camera/detection:", err);
    }
  }
  async function checkBackendConnection() {
    const statusEl = document.getElementById("backend-status");
    if (!statusEl) return;

    try {
      const res = await fetch("http://localhost:8000/");
      if (res.ok) {
        const dot = document.querySelector(
          "#status-backend .system-status__dot",
        );
        if (dot) {
          dot.classList.remove("system-status__dot--inactive");
          dot.classList.add("system-status__dot--active");
        }
        const valueEl = statusEl.querySelector(".status-panel__value");
        if (valueEl) {
          valueEl.textContent = "Connected";
          valueEl.classList.remove("status-panel__value--disconnected");
          valueEl.classList.add("status-panel__value--connected");
        }
      }
    } catch (e) {
      // Biarkan tetap "Not Connected"
    }
  }

  function onWebGLContextLost(event) {
    event.preventDefault();
    console.warn("WebGL context lost – detection paused");
    FaceAI.detection.stop();
    FaceAI.ui.showError("Graphics engine paused. Please refresh the page.");
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (FaceAI.detection.isRunning()) {
        FaceAI.detection.stop();
        console.log("Detection paused (tab hidden)");
      }
    } else {
      if (FaceAI.camera.isActive() && !FaceAI.detection.isRunning()) {
        FaceAI.detection.start(FaceAI.ui.getVideoElement()).catch(() => {});
        console.log("Detection resumed (tab visible)");
      }
    }
  }

  function cleanup() {
    FaceAI.capture.destroy();
    FaceAI.detection.stop();
    FaceAI.camera.stop();
    if (FaceAI.drawing) {
      FaceAI.drawing.clear();
    }
    const previewImg = document.getElementById("capture-preview");
    if (previewImg) {
      previewImg.removeAttribute("src");
    }
  }

  // ==========================================
  // Bootstrap
  // ==========================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
