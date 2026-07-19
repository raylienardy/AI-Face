/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.4
 *
 * Responsibilities:
 * - Real‑time face detection (MediaPipe BlazeFace)
 * - Multi‑face support with primary face selection
 * - Bounding box & confidence visualization
 */
"use strict";

FaceAI.detection = (function () {
  let faceDetection = null;
  let initialized = false;
  let isRunning = false;
  let animationFrameId = null;
  let videoElement = null;
  let lastFrameTime = 0;
  let multipleFaces = false; // flag

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
    // Additional guard: if context lost, stop sending
    if (
      faceDetection &&
      faceDetection.isContextLost &&
      faceDetection.isContextLost()
    ) {
      console.warn("WebGL context lost – stopping detection");
      FaceAI.detection.stop();
      FaceAI.ui.showError("Graphics context lost. Please refresh the page.");
      return;
    }
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

  /**
   * Extract confidence score from a detection object.
   * MediaPipe 0.4.x stores it in face.V[0].ga.
   */
  function getConfidence(face) {
    if (face.V && face.V.length > 0 && typeof face.V[0].ga === "number") {
      return face.V[0].ga;
    }
    return face.score ?? face.confidence ?? 0;
  }

  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;

    // Filter faces above threshold
    const validFaces = faces.filter((f) => getConfidence(f) >= threshold);

    if (validFaces.length === 0) {
      FaceAI.ui.clearFaceBoxes();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.state.set("DETECTING");
      multipleFaces = false;
      return;
    }

    // Sort faces: primary criteria from config
    const criteria = FaceAI.config.PRIMARY_FACE_CRITERIA;
    validFaces.sort((a, b) => {
      const confA = getConfidence(a);
      const confB = getConfidence(b);
      if (criteria === "area") {
        const areaA = (a.boundingBox.width || 0) * (a.boundingBox.height || 0);
        const areaB = (b.boundingBox.width || 0) * (b.boundingBox.height || 0);
        if (areaA !== areaB) return areaB - areaA; // descending
      }
      // Fallback to confidence
      return confB - confA;
    });

    multipleFaces = validFaces.length > 1;

    const vw = videoElement.videoWidth;
    const vh = videoElement.videoHeight;
    if (!vw || !vh) {
      FaceAI.ui.clearFaceBoxes();
      FaceAI.ui.updateFaceDot(false);
      return;
    }

    const config = FaceAI.config;
    const boxes = [];

    validFaces.forEach((face, index) => {
      const bbox = face.boundingBox;
      const xCenter = bbox.xCenter || 0;
      const yCenter = bbox.yCenter || 0;
      const width = bbox.width || 0;
      const height = bbox.height || 0;

      const x = (xCenter - width / 2) * vw;
      const y = (yCenter - height / 2) * vh;
      const w = width * vw;
      const h = height * vh;

      const isPrimary = index === 0;

      boxes.push({
        x,
        y,
        w,
        h,
        confidence: getConfidence(face),
        color: isPrimary ? config.BOX_COLOR : config.SECONDARY_BOX_COLOR,
        lineWidth: isPrimary
          ? config.BOX_LINE_WIDTH
          : config.SECONDARY_BOX_LINE_WIDTH,
        showConfidence: isPrimary, // hanya tampilkan teks confidence pada primary
      });
    });

    FaceAI.ui.drawFaceBoxes(boxes);
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

    hasMultipleFaces() {
      return multipleFaces;
    },
  };
})();
