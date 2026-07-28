/**
 * Node bridge to apps/geniebuild/utils/themeResolver.ts (single source of truth).
 */
const path = require("path");

let _resolver;

function getResolver() {
  if (!_resolver) {
    const jiti = require("jiti")(path.join(__dirname, "../.."), {
      interopDefault: true,
      esmResolve: true,
    });
    _resolver = jiti("../apps/geniebuild/utils/themeResolver.ts");
  }
  return _resolver;
}

function resolveThemeColorsForApi(themeSettings) {
  return getResolver().toApiColorsPayload(themeSettings || null);
}

function buildBlogEditorThemePayload(themeSettings) {
  return getResolver().buildBlogEditorThemePayload(themeSettings || null);
}

module.exports = {
  resolveThemeColorsForApi,
  buildBlogEditorThemePayload,
  getThemeResolver: getResolver,
};
