const express = require("express");
const SiteNextJsController = require("../controller/SiteNextJsController");
const BlogsController = require("../controller/BlogsController");

const router = express.Router();

router.post("/website_page", SiteNextJsController.website_page);
router.post("/slug_to_page_details", SiteNextJsController.slug_to_page_details);
router.post("/resolve_slug", SiteNextJsController.resolve_slug);
router.get("/resolve_slug", SiteNextJsController.resolve_slug);
router.get("/listPublishedBlogs", BlogsController.list_published_blogs);
router.post("/listPublishedBlogs", BlogsController.list_published_blogs);

module.exports = router;
