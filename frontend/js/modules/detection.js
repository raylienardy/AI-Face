/**
 * FaceAI Detection Module
 * Version: 0.1 – Milestone 4 Stage 4.5 (revised)
 *
 * - Real-time face detection via MediaPipe
 * - Primary face selection
 * - Face alignment (using eye landmarks)
 */
"use strict";

FaceAI.detection = (function () {
  // ==========================================
  // Private State
  // ==========================================
  let faceDetection = null;
  let initialized = false;
  let isRunning = false;
  let animationFrameId = null;
  let videoElement = null;
  let lastFrameTime = 0;
  let multipleFaces = false;

  // ==========================================
  // Utility: WebGL support check
  // ==========================================
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

  // ==========================================
  // Detection Loop (private)
  // ==========================================
  async function detectFrame(now) {
    if (!isRunning || !videoElement) return;

    const interval = 1000 / FaceAI.config.FPS_LIMIT;
    if (now - lastFrameTime < interval) {
      animationFrameId = requestAnimationFrame(detectFrame);
      return;
    }
    lastFrameTime = now;

    try {
      await faceDetection.send({ image: videoElement });
    } catch (error) {
      console.warn("FaceAI: detection frame error", error);
    }

    animationFrameId = requestAnimationFrame(detectFrame);
  }

  // ==========================================
  // Results Callback (Stage 4.4 + 4.5)
  // ==========================================
  function onResults(results) {
    const faces = results.detections || [];
    const threshold = FaceAI.config.DETECTION_THRESHOLD;

    // Filter faces above threshold
    const validFaces = faces.filter((f) => f.score >= threshold);

    if (validFaces.length === 0) {
      FaceAI.ui.clearFaceBox();
      FaceAI.ui.updateFaceDot(false);
      FaceAI.ui.hideAlignedFace();
      FaceAI.state.set("DETECTING");
      multipleFaces = false;
      return;
    }

    // Sort faces according to primary criteria
    const criteria = FaceAI.config.PRIMARY_FACE_CRITERIA;
    validFaces.sort((a, b) => {
      if (criteria === "area") {
        const areaA = (a.boundingBox.width || 0) * (a.boundingBox.height || 0);
        const areaB = (b.boundingBox.width || 0) * (b.boundingBox.height || 0);
        if (areaA !== areaB) return areaB - areaA;
      }
      return (b.score || 0) - (a.score || 0);
    });

    multipleFaces = validFaces.length > 1;

    // Build array of box objects for drawing
    const videoW = videoElement.videoWidth;
    const videoH = videoElement.videoHeight;
    const boxes = [];

    validFaces.forEach((face, index) => {
      const bbox = face.boundingBox;
      const xCenter = bbox.xCenter || 0;
      const yCenter = bbox.yCenter || 0;
      const width = bbox.width || 0;
      const height = bbox.height || 0;

      const x = ((xCenter - width / 2) / 100) * videoW;
      const y = ((yCenter - height / 2) / 100) * videoH;
      const w = (width / 100) * videoW;
      const h = (height / 100) * videoH;

      const isPrimary = index === 0;
      const config = FaceAI.config;

      boxes.push({
        x,
        y,
        w,
        h,
        confidence: face.score,
        color: isPrimary ? config.BOX_COLOR : config.SECONDARY_BOX_COLOR,
        lineWidth: isPrimary
          ? config.BOX_LINE_WIDTH
          : config.SECONDARY_BOX_LINE_WIDTH,
        showConfidence: isPrimary,
      });
    });

    // Alignment for primary face (Stage 4.5)
    if (FaceAI.config.ALIGN_ENABLED && validFaces.length > 0) {
      const primary = validFaces[0];
      const landmarks = primary.landmarks;
      // Gunakan bounding box wajah primer yang sudah dihitung sebelumnya (boxes[0])
      const primaryBox = boxes[0]; // {x, y, w, h}
      if (landmarks && landmarks.length >= 2 && primaryBox) {
        const bboxForAlign = {
          x: primaryBox.x,
          y: primaryBox.y,
          w: primaryBox.w,
          h: primaryBox.h,
        };
        const alignedCanvas = FaceAI.geometry.alignFace(
          videoElement,
          landmarks,
          bboxForAlign,
          FaceAI.config.ALIGN_TARGET_SIZE,
        );
        FaceAI.ui.showAlignedFace(alignedCanvas);
      } else {
        FaceAI.ui.hideAlignedFace();
      }
    }

    FaceAI.ui.drawFaceBoxes(boxes);
    FaceAI.ui.updateFaceDot(true);
    FaceAI.state.set("FACE_FOUND");
  }

  // ==========================================
  // Public API
  // ==========================================
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

        // ✨ PERBAIKAN: tambahkan outputLandmarks: true
        faceDetection.setOptions({
          model: config.DETECTION_MODEL_TYPE,
          minDetectionConfidence: config.DETECTION_THRESHOLD,
          outputLandmarks: true, // <-- agar landmarks tersedia
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
