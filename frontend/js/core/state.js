/**
 * FaceAI State Machine
 * Version: 0.1
 *
 * Simple state management for app lifecycle.
 * States: IDLE, BACKEND_READY, CAMERA_READY, DETECTING,
 *         FACE_FOUND, FACE_STABLE, READY_TO_CAPTURE, CAPTURED, RECOGNIZED
 */
"use strict";

FaceAI.state = (function () {
  // ==========================================
  // Private State
  // ==========================================
  const VALID_STATES = [
    "IDLE",
    "BACKEND_READY",
    "CAMERA_READY",
    "DETECTING",
    "FACE_FOUND",
    "FACE_STABLE",
    "READY_TO_CAPTURE",
    "CAPTURED",
    "RECOGNIZED",
  ];

  let currentState = "IDLE";

  // ==========================================
  // Public API
  // ==========================================
  return {
    /**
     * Get current state.
     * @returns {string}
     */
    get() {
      return currentState;
    },

    /**
     * Transition to a new state if valid.
     * @param {string} newState
     * @returns {boolean} true if transition successful
     */
    set(newState) {
      if (VALID_STATES.includes(newState) && newState !== currentState) {
        console.log(`State: ${currentState} → ${newState}`);
        currentState = newState;
        return true;
      }
      return false;
    },

    /**
     * Check if current state matches any of the arguments.
     * @param {...string} states
     * @returns {boolean}
     */
    is(...states) {
      return states.includes(currentState);
    },

    /**
     * Reset state to IDLE.
     */
    reset() {
      currentState = "IDLE";
    },
  };
})();
