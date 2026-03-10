// slugify.js
function slugify(str = "") {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

module.exports = slugify;
