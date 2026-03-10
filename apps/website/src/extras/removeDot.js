// src/utils/removeDot.js

/**
 * Remove exactly one trailing dot from a string, if present.
 *
 * @param {string} str
 * @returns {string}
 */

// src/extras/removeDot.js
export function removeDot(str = "") {
  // 1. trim off any trailing whitespace
  const trimmed = str.trimEnd();
  // 2. drop exactly one trailing dot if there is one
  return trimmed.endsWith(".")
    ? trimmed.slice(0, -1)
    : trimmed;
}
