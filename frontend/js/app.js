/**
 * FaceAI Application Entry Point
 * Version: 0.1 – Milestone 3
 *
 * Initializes modules and wires UI events to camera logic.
 */
"use strict";

(function () {
  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    // Cache DOM for button listener (the rest is handled by ui.js)
    const startBtn = document.getElementById("start-camera-btn");
    startBtn.addEventListener("click", onStartClick);

    console.log("FaceAI frontend initialized (v0.1 – Milestone 3)");
  }

  // ==========================================
  // Event Handlers
  // ==========================================
  async function onStartClick() {
    // Guard: prevent action if camera already active or starting
    if (FaceAI.camera.isActive() || FaceAI.camera.isStarting()) {
      return;
    }
    await FaceAI.camera.start();
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
