/**
 * FaceAI Helpers
 * Version: 0.1 – Placeholder
 *
 * General utility functions not specific to any module.
 */
"use strict";

window.FaceAI = window.FaceAI || {};

FaceAI.helpers = {
  /**
   * Debounce a function call.
   * @param {Function} fn
   * @param {number} delay ms
   * @returns {Function}
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Format timestamp to human readable string (for future use).
   * @param {Date} date
   * @returns {string}
   */
  formatTimestamp(date = new Date()) {
    return date.toISOString();
  },
};
