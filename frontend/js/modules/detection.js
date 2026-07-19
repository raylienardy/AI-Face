/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.3 (final)
 *
 * Responsibilities:
 * - Load BlazeFace model
 * - Real‑time detection loop
 * - Single face bounding box + confidence
 * - Correctly reads confidence from MediaPipe's V[0].ga
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

  function detectFrame(now) {
    if (!isRunning || !videoElement) return;
    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;
    faceDetection.send({ image: videoElement }).catch((error) => {
      console.warn("FaceAI: detection send error", error);
    });
    animationFrameId = requestAnimationFrame(detectFrame);
  }

  function getConfidence(face) {
    // MediaPipe 0.4.x stores confidence in face.V[0].ga
    if (face.V && face.V.length > 0 && typeof face.V[0].ga === "number") {
      return face.V[0].ga;
    }
    // Fallback untuk properti lain (jika suatu saat berubah)
    return face.score ?? face.confidence ?? 0;
  }

  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;

    let bestFace = null;
    let bestConfidence = 0;

    for (const face of faces) {
      const score = getConfidence(face);
      if (score >= threshold && score > bestConfidence) {
        bestConfidence = score;
        bestFace = face;
      }
    }

    if (!bestFace) {
      FaceAI.ui.clearFaceBox();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
      return;
    }

    const vw = videoElement.videoWidth;
    const vh = videoElement.videoHeight;
    if (!vw || !vh) {
      FaceAI.ui.clearFaceBox();
      return;
    }

    const bbox = bestFace.boundingBox;
    const xCenter = bbox.xCenter || 0;
    const yCenter = bbox.yCenter || 0;
    const width = bbox.width || 0;
    const height = bbox.height || 0;

    const x = (xCenter - width / 2) * vw;
    const y = (yCenter - height / 2) * vh;
    const w = width * vw;
    const h = height * vh;

    FaceAI.ui.drawFaceBox(x, y, w, h, bestConfidence);
    FaceAI.ui.updateFaceDot(true);
    FaceAI.state.set("FACE_FOUND");
  }

  return {
    async init() {
      if (initialized) return;
      if (!isWebGLSupported()) {
        const msg =
          "Your browser does not support WebGL. Face detection cannot run.";
        FaceAI.ui.showError(msg);
        throw new Error(msg);
      }
      try {
        const config = FaceAI.config;
        faceDetection = new FaceDetection({
          locateFile: (file) => `${config.DETECTION_MODEL_URL}${file}`,
        });
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE,
          minDetectionConfidence: config.DETECTION_THRESHOLD,
        });
        faceDetection.onResults(onResults);
        await faceDetection.initialize();
        initialized = true;
        console.log("FaceAI: FaceDetection model loaded successfully.");
      } catch (error) {
        let message = "Failed to initialize face detection. ";
        if (
          error.message &&
          (error.message.includes("NetworkError") ||
            error.message.includes("Failed to fetch"))
        ) {
          message =
            "Failed to load face detection model. Please check your internet connection.";
        } else if (error.message) {
          message += error.message;
        }
        FaceAI.ui.showError(message);
        throw new Error(message);
      }
    },

    async start(video) {
      if (!video) {
        console.warn("FaceAI: cannot start detection – no video element.");
        return;
      }
      if (isRunning) return;
      if (!initialized) {
        try {
          await this.init();
        } catch (e) {
          return;
        }
      }
      videoElement = video;
      if (video.readyState < 2) {
        console.log("FaceAI: video not ready yet, waiting...");
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
      if (!video.videoWidth || !video.videoHeight) {
        console.log("Waiting for video dimensions...");
        await new Promise((resolve) => {
          const check = () => {
            if (video.videoWidth && video.videoHeight) {
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          };
          check();
        });
      }
      isRunning = true;
      FaceAI.state.set("DETECTING");
      console.log("FaceAI: detection started.");
      lastFrameTime = performance.now();
      animationFrameId = requestAnimationFrame(detectFrame);
    },

    stop() {
      if (!isRunning) return;
      isRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      videoElement = null;
      FaceAI.state.set("CAMERA_READY");
      console.log("FaceAI: detection stopped.");
    },

    isRunning() {
      return isRunning;
    },

    // Tidak perlu mengekspos onResults lagi, tapi tidak ada salahnya dibiarkan untuk tes
    onResults: onResults,
  };
})();
