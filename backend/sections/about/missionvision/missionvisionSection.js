/**
 * About page Mission + Vision — GenieBuild `missionvision`
 */

const { aboutUniquenessRules } = require("../../_shared/aboutUniquenessPrompt");

module.exports = {
  id: "missionvision",

  schema: {
    mission: {
      line: "string",
      subHeadings: ["string"],
    },
    vision: {
      line: "string",
      subHeadings: ["string"],
    },
  },

  prompt(ctx) {
    const { project, location, extraData = {} } = ctx;

    const projectName = project.projectName || "";
    const mainCategory = project.mainCategory || "";
    const focusKeyword = project.focusKeyword || "";
    const seoKeywords = project.projectKeywordsText || "";

    const locationName = location?.name || "";
    const city = location?.city || "";
    const state = location?.state || "";
    const locationLabel = `${locationName || city || ""} ${state || ""}`.trim();

    return `
You are writing Mission & Vision for the About page of "${projectName}" (${mainCategory}).

Website Name: ${projectName}
Primary Category: ${mainCategory}
Focus Keyword: ${focusKeyword}
SEO Keywords: ${seoKeywords}

Location:
${locationLabel || "service area"}

${aboutUniquenessRules({
  projectName,
  mainCategory,
  focusKeyword,
  seoKeywords,
  locationLabel,
  pageLabel: "Mission & Vision",
})}

Return STRICT JSON ONLY:

{
  "mission": {
    "line": "Short mission line naming what ${projectName} stands for today",
    "subHeadings": [
      "Sub heading one",
      "Sub heading two",
      "Sub heading three"
    ]
  },
  "vision": {
    "line": "Short vision line for where ${projectName} is headed",
    "subHeadings": [
      "Sub heading one",
      "Sub heading two",
      "Sub heading three"
    ]
  }
}

Rules:

MISSION.line / VISION.line:
- Each ~40–90 characters (a crisp sentence fragment or short sentence)
- Mission = present purpose for customers in ${mainCategory}
- Vision = longer-term standard / community impact
- Must be DIFFERENT; at least one should naturally echo ${focusKeyword || mainCategory}

MISSION.subHeadings / VISION.subHeadings:
- EXACTLY 3 strings each (5–12 words)
- All six UNIQUE
- Specific to ${projectName} / ${mainCategory} / ${locationLabel || "local customers"} — not interchangeable slogans

GLOBAL:
- No phone/email/address
- No "call us"
- Output ONLY valid JSON with mission + vision
`;
  },
};
