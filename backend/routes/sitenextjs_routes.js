const express = require("express");
const SiteNextJsController = require("../controller/SiteNextJsController");
const BlogsController = require("../controller/BlogsController");
const ReviewsController = require("../controller/ReviewsController");

const router = express.Router();

router.post("/website_page", SiteNextJsController.website_page);
router.post("/slug_to_page_details", SiteNextJsController.slug_to_page_details);
router.post("/resolve_slug", SiteNextJsController.resolve_slug);
router.get("/resolve_slug", SiteNextJsController.resolve_slug);
router.post("/content_taxonomy", SiteNextJsController.content_taxonomy);
router.get("/content_taxonomy", SiteNextJsController.content_taxonomy);
router.get("/listPublishedBlogs", BlogsController.list_published_blogs);
router.post("/listPublishedBlogs", BlogsController.list_published_blogs);
router.get("/getPublishedBlog", BlogsController.get_published_blog);
router.post("/getPublishedBlog", BlogsController.get_published_blog);
router.get("/get_blog_by_slug", BlogsController.get_blog_by_slug);
router.post("/get_blog_by_slug", BlogsController.get_blog_by_slug);
router.post("/related_blogs", BlogsController.related_blogs);

/** Public blog comments / reviews (Join the Conversation) */
router.post("/add_review", ReviewsController.add_review);
router.post("/get_reviews", ReviewsController.get_reviews);
router.post("/edit_review", ReviewsController.edit_review);
router.post("/delete_review", ReviewsController.delete_review);

/** Full author card (all links) for live blog pages */
router.get("/get_blog_author", BlogsController.get_blog_author);
router.post("/get_blog_author", BlogsController.get_blog_author);

module.exports = router;
