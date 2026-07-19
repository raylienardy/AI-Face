/**
 * FaceAI Detection Module (DEBUG VERSION)
 * Version: 0.1 – Milestone 4 Phase 4.3 debug
 */
"use strict";

FaceAI.detection = (function () {
  let faceDetection = null;
  let initialized = false;
  let isRunning = false;
  let animationFrameId = null;
  let videoElement = null;
  let lastFrameTime = 0;

  function isWebGLSupported() {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  function onResults(results) {
    console.log("onResults called", results);
    const faces = results.detections || [];
    console.log(`Number of detections: ${faces.length}`);

    // Temporary: use very low threshold to see any detection
    const threshold = 0.1; // FaceAI.config.DETECTION_THRESHOLD;
    const validFaces = faces.filter((f) => f.score >= threshold);

    console.log(`Valid faces (>= ${threshold}): ${validFaces.length}`);

    if (validFaces.length === 0) {
      FaceAI.ui.clearFaceBox();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
      return;
    }

    // Pick best
    let best = validFaces[0];
    for (let i = 1; i < validFaces.length; i++) {
      if (validFaces[i].score > best.score) best = validFaces[i];
    }

    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    console.log(`Video dimensions: ${videoW} x ${videoH}`);

    const bbox = best.boundingBox;
    const xCenter = bbox.xCenter || 0;
    const yCenter = bbox.yCenter || 0;
    const width = bbox.width || 0;
    const height = bbox.height || 0;

    const x = ((xCenter - width / 2) / 100) * videoW;
    const y = ((yCenter - height / 2) / 100) * videoH;
    const w = (width / 100) * videoW;
    const h = (height / 100) * videoH;

    console.log(
      `Drawing box at (${x}, ${y}) size ${w}x${h} with confidence ${best.score}`,
    );

    FaceAI.ui.drawFaceBox(x, y, w, h, best.score);
    FaceAI.ui.updateFaceDot(true);
    FaceAI.state.set("FACE_FOUND");
  }

  function detectFrame() {
    if (!isRunning || !videoElement) return;
    const now = performance.now();
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;
    try {
      faceDetection.send({ image: videoElement });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }
    animationFrameId = requestAnimationFrame(detectFrame);
  }

  return {
    async init() {
      if (initialized) return;
      if (!isWebGLSupported()) {
        FaceAI.ui.showError("WebGL not supported");
        throw new Error("WebGL not supported");
      }
      try {
        const config = FaceAI.config;
        faceDetection = new FaceDetection({
          locateFile: (file) => `${config.DETECTION_MODEL_URL}${file}`,
        });
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE,
          minDetectionConfidence: 0.1, // debug low threshold
        });
        faceDetection.onResults(onResults);
        await faceDetection.initialize();
        initialized = true;
        console.log("Model loaded");
      } catch (error) {
        FaceAI.ui.showError("Failed to load model");
        throw error;
      }
    },
    async start(video) {
      if (!video || isRunning) return;
      if (!initialized) await this.init();
      videoElement = video;
      if (video.readyState < 2) {
        await new Promise((resolve) => {
          const onReady = () => {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          };
          video.addEventListener("loadeddata", onReady);
          if (video.readyState >= 2) {
            video.removeEventListener("loadeddata", onReady);
            resolve();
          }
        });
      }
      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("Detection started");
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(detectFrame);
    },
    stop() {
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      videoElement = null;
      FaceAI.state.set("CAMERA_READY");
      console.log("Detection stopped");
    },
    isRunning() {
      return isRunning;
    },
  };
})();
