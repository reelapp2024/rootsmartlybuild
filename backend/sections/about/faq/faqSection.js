/**
 * Legacy About FAQ id "faq" under pageFolder about.
 * GenieBuild About page uses section id "aboutfaq" — see ../aboutfaq/aboutfaqSection.js
 */
const aboutfaq = require("../aboutfaq/aboutfaqSection");

module.exports = {
  ...aboutfaq,
  id: "faq",
  scope: "about",
};
