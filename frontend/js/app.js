/**
 * FaceAI Frontend - Main Application Script
 * Version: 0.1 – Milestone 3
 *
 * Handles webcam access and preview without any AI/backend.
 */

"use strict";

// State management
const state = {
  isCameraActive: false,
  isStarting: false,
  stream: null,
};

// DOM references (populated on init)
let elements = {};

/**
 * Initialize application after DOM is ready.
 */
function initApp() {
  elements = getDOMElements();
  attachEventListeners();
  console.log("FaceAI frontend initialized (v0.1 – Milestone 3)");
}

/**
 * Gather all required DOM elements once.
 * @returns {Object} references to key elements
 */
function getDOMElements() {
  return {
    startBtn: document.getElementById("start-camera-btn"),
    video: document.getElementById("camera-video"),
    placeholder: document.getElementById("camera-placeholder"),
    cameraPreview: document.getElementById("camera-preview"),
    cameraError: document.getElementById("camera-error"),
    statusCameraDot: document.querySelector(
      "#status-camera .system-status__dot",
    ),
    statusCameraLabel: document.querySelector(
      "#status-camera .system-status__label",
    ),
  };
}

/**
 * Attach event listeners.
 */
function attachEventListeners() {
  elements.startBtn.addEventListener("click", onStartCameraClick);
}

/**
 * Click handler for Start Camera button.
 * Prevents concurrent calls and initiates camera access.
 */
async function onStartCameraClick() {
  if (state.isStarting || state.isCameraActive) {
    return; // avoid multiple simultaneous requests
  }

  setStartingState(true);
  clearCameraError();

  try {
    await startCamera();
    // If successful, state.isCameraActive becomes true inside startCamera
  } catch (error) {
    // Error already handled inside startCamera; ensure button is re-enabled
    setStartingState(false);
  }
}

/**
 * Enable/disable UI during camera start process.
 * @param {boolean} starting
 */
function setStartingState(starting) {
  state.isStarting = starting;
  elements.startBtn.disabled = starting || state.isCameraActive;
}

/**
 * Main function to request and attach camera stream.
 * Throws only if browser lacks support; other errors handled gracefully.
 */
async function startCamera() {
  // Check browser support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraError(
      "Browser Anda tidak mendukung akses kamera. Silakan gunakan browser modern seperti Chrome, Firefox, atau Edge.",
    );
    setStartingState(false);
    throw new Error("getUserMedia not supported");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user", // kamera depan laptop
      },
      audio: false,
    });

    handleStream(stream);
  } catch (error) {
    handleCameraError(error);
    throw error; // rethrow so caller knows it failed
  }
}

/**
 * Attach stream to video element and update UI.
 * @param {MediaStream} stream
 */
function handleStream(stream) {
  state.stream = stream;
  state.isCameraActive = true;

  // Put stream into video element
  elements.video.srcObject = stream;

  // Wait for video metadata to load so dimensions are known
  elements.video.onloadedmetadata = () => {
    elements.video.play().catch((e) => console.warn("Autoplay prevented:", e));
  };

  // Update UI
  elements.placeholder.classList.add("hidden");
  elements.startBtn.disabled = true;
  elements.startBtn.textContent = "Camera Active";
  updateCameraStatus(true);
  clearCameraError();
  setStartingState(false);
}

/**
 * Handle getUserMedia errors with user-friendly messages.
 * @param {Error} error
 */
function handleCameraError(error) {
  let message = "Gagal mengakses kamera. ";

  if (
    error.name === "NotAllowedError" ||
    error.name === "PermissionDeniedError"
  ) {
    message =
      "Akses kamera ditolak. Mohon izinkan kamera di pengaturan browser Anda.";
  } else if (error.name === "NotFoundError") {
    message =
      "Tidak ada kamera terdeteksi. Pastikan kamera terpasang dan driver sudah terinstal.";
  } else if (error.name === "NotReadableError") {
    message =
      "Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.";
  } else {
    message += error.message || "Silakan periksa pengaturan perangkat Anda.";
  }

  showCameraError(message);
  updateCameraStatus(false);
  resetCameraUI();
  setStartingState(false);
}

/**
 * Display error message in the dedicated area.
 * @param {string} msg
 */
function showCameraError(msg) {
  elements.cameraError.textContent = msg;
}

/**
 * Clear any previous error message.
 */
function clearCameraError() {
  elements.cameraError.textContent = "";
}

/**
 * Update camera status indicator in system status area.
 * @param {boolean} active
 */
function updateCameraStatus(active) {
  const dot = elements.statusCameraDot;
  if (active) {
    dot.classList.remove("system-status__dot--inactive");
    dot.classList.add("system-status__dot--active");
  } else {
    dot.classList.remove("system-status__dot--active");
    dot.classList.add("system-status__dot--inactive");
  }
}

/**
 * Reset camera UI to initial state (hide video, show placeholder).
 */
function resetCameraUI() {
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  state.isCameraActive = false;
  elements.video.srcObject = null;
  elements.placeholder.classList.remove("hidden");
  elements.startBtn.disabled = false;
  elements.startBtn.textContent = "Start Camera";
}

// Bootstrap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
