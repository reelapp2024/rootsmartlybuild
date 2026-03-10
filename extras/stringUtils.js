// src/utils/stringUtils.js

/**
 * Converts a hyphen- or underscore-separated string into a human-readable Title Case string.
 */
function humanizeString(input) {
  if (typeof input !== "string") return "";

  return input
    .split(/[-_]+/)
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

// named export (optional)
export { humanizeString };

// default export
export default humanizeString;
