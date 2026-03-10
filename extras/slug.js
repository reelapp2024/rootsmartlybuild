// break camelCase, strip punctuation, collapse spaces → hyphens, lowercase
export function slugify(str = "") {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[^a-zA-Z0-9 ]+/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
  }
  
  // split on hyphens, Title-Case each word, join with spaces
  export function humanizeSlug(slug = "") {
    return slug
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  