const express = require("express");
const SiteNextJsController = require("../controller/SiteNextJsController");

const router = express.Router();

router.post("/website_page", SiteNextJsController.website_page);
router.post("/slug_to_page_details", SiteNextJsController.slug_to_page_details);
router.post("/resolve_slug", SiteNextJsController.resolve_slug);
router.get("/resolve_slug", SiteNextJsController.resolve_slug);
module.exports = router;
