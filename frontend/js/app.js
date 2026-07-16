/**
 * FaceAI Application Entry Point
 * Version: 0.1 – Milestone 3.5
 *
 * Initializes app, wires events.
 */
"use strict";

(function () {
  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    // Pastikan state awal
    FaceAI.state.set("IDLE");

    const startBtn = document.getElementById("start-camera-btn");
    startBtn.addEventListener("click", onStartClick);

    console.log("FaceAI frontend initialized (v0.1 – Milestone 3.5)");
  }

  // ==========================================
  // Event Handlers
  // ==========================================
  async function onStartClick() {
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
