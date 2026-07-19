/**
 * FaceAI Application Entry Point
 * Version: 0.1 – Milestone 4 Phase 4.2
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
    console.log("FaceAI frontend initialized (v0.1 – Phase 4.2)");
  }

  // ==========================================
  // Event Handlers
  // ==========================================
  async function onStartClick() {
    if (FaceAI.camera.isActive() || FaceAI.camera.isStarting()) {
      return;
    }
    await FaceAI.camera.start();
    // Once camera is ready, start detection
    const video = FaceAI.ui.getVideoElement();
    await FaceAI.detection.start(video);
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
