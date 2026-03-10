// react-snap.config.js
module.exports = {
  source: "dist", // Explicitly set to 'dist' where Vite outputs the build
  minifyHtml: true,
  crawl: true,
  include: ["/", "/about", "/contact", "/terms-conditions"], // List all routes
  debug: true, // Enable debug mode to troubleshoot
};