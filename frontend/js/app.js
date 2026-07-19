/**
 * FaceAI Application Entry Point
 * Version: 0.1 – Milestone 4 Stage 4.6
 */
"use strict";

(function () {
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

    console.log("FaceAI frontend initialized (v0.1 – Milestone 4.6)");
  }

  async function onStartClick() {
    if (FaceAI.camera.isActive() || FaceAI.camera.isStarting()) {
      return;
    }
    try {
      await FaceAI.camera.start();
      const video = FaceAI.ui.getVideoElement();
      await FaceAI.detection.start(video);
    } catch (err) {
      console.error("Failed to start camera/detection:", err);
    }
  }

  function onWebGLContextLost(event) {
    event.preventDefault(); // allow context restoration
    console.warn("WebGL context lost – detection paused");
    FaceAI.detection.stop();
    FaceAI.ui.showError("Graphics engine paused. Please refresh the page.");
  }

  function onVisibilityChange() {
    if (document.hidden) {
      // Tab not visible – stop detection to save resources
      if (FaceAI.detection.isRunning()) {
        FaceAI.detection.stop();
        console.log("Detection paused (tab hidden)");
      }
    } else {
      // Tab visible again – restart detection if camera is still active
      if (FaceAI.camera.isActive() && !FaceAI.detection.isRunning()) {
        FaceAI.detection.start(FaceAI.ui.getVideoElement()).catch(() => {});
        console.log("Detection resumed (tab visible)");
      }
    }
  }

  function cleanup() {
    FaceAI.detection.stop();
    FaceAI.camera.stop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
