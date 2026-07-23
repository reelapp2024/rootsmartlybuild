const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const t = fs.readFileSync(path.join(root, "apps/geniebuild/constants.tsx"), "utf8");
const start = t.indexOf("export const PRESET_THEMES = [");
const slice = t.slice(start);
const catalog = require(path.join(root, "packages/schema/presetThemeCatalog.json"));

const re2 =
  /"name":\s*"([^"]+)"[\s\S]*?"heading":\s*"([^"]+)"[\s\S]*?"description":\s*"([^"]+)"[\s\S]*?"surface":\s*"([^"]+)"[\s\S]*?"primaryButton":\s*\{\s*"bg":\s*"([^"]+)"/g;
let m;
const out = [];
while ((m = re2.exec(slice))) {
  out.push({
    name: m[1],
    heading: m[2],
    surface: m[4],
    primary: m[5],
  });
}

const swatches = catalog.map((entry) => {
  const theme = out.find((o) => o.name === entry.name) || out[entry.index];
  if (!theme) throw new Error("Missing theme " + entry.name);
  return {
    id: entry.id,
    name: entry.name,
    primary: theme.primary,
    surface: theme.surface,
    heading: theme.heading,
    description: "GenieBuild preset",
  };
});

fs.writeFileSync(
  path.join(root, "packages/schema/presetThemeSwatches.json"),
  JSON.stringify(swatches, null, 2) + "\n"
);
console.log("wrote", swatches.length, "swatches");
console.log(swatches.map((s) => s.id + " " + s.primary + " " + s.surface).join("\n"));
