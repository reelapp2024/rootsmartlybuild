var express = require('express');
var router = express.Router();
const WebappController=require("../controller/WebAppContorller");
const AdminController=require("../controller/AdminController");
const ReviewsController=require("../controller/ReviewsController");
const BlogsController = require("../controller/BlogsController")
const skpkVerify=require("../middlewares/skpkVerify")
const authentication = require('../middlewares/jwtauth')

/* GET home page. */

router.post("/my_projects",WebappController.my_projects);
router.post("/projectinfo",WebappController.projectinfo)
router.post("/my_site",WebappController.my_site)
router.post("/theme",WebappController.theme)
router.post("/location_info",WebappController.location_info)

router.post("/fetchTnC_Au_Pp",WebappController.fetchTnC_Au_Pp);
router.post("/fetch_services",WebappController.fetch_services);
router.post("/fetch_random_services",WebappController.fetch_random_services);
router.post("/fetch_faq_reviews",WebappController.fetch_faq_reviews);

router.post("/fetch_ordered_services",WebappController.fetch_ordered_services);

router.post("/fetch_service",WebappController.fetch_service);
router.post("/slugToPageType",WebappController.slugToPageType);

router.post("/fetch_service_by_name_and_project",WebappController.fetch_service_by_name_and_project);
router.post("/getfooter",WebappController.getfooter);
router.post("/getheader",WebappController.getheader);
router.post("/fetchSiteSettings",WebappController.fetchSiteSettings);
router.post("/area_we_serve",WebappController.area_we_serve);

router.post("/basic_project_info",WebappController.basic_project_info)

// Route to update or create SEO settings for a page
router.post('/seo/update', AdminController.updateSeoSettings);

// Route to get SEO settings for a page
router.post('/seo', AdminController.getSeoSettings);

// Route to delete SEO settings for a page
router.delete('/seo/:pageUrl', AdminController.deleteSeoSettings);


router.post("/add_review", ReviewsController.add_review);
router.post("/edit_review", ReviewsController.edit_review);   // pass reviewId in body
router.post("/delete_review", ReviewsController.delete_review); // pass reviewId in body
router.post("/get_reviews", ReviewsController.get_reviews); // ✅ new one


router.post("/send_otp", ReviewsController.send_otp);
router.post("/verify_otp", ReviewsController.verify_otp);
router.post("/add_fake_reviews",authentication, ReviewsController.add_fake_reviews); // ✅ new one
router.post("/approve_review", ReviewsController.approve_review); // pass reviewId + status in body
router.post("/fetch_my_reviews",authentication, ReviewsController.fetch_my_reviews);

router.get("/getBlog", authentication, BlogsController.get_blog);
router.post("/get_blog_by_slug", BlogsController.get_blog_by_slug);
router.get("/getPublishedBlog", BlogsController.get_published_blog);
router.post("/getPublishedBlog", BlogsController.get_published_blog);

router.post("/get_blog_slugs", BlogsController.get_blog_slugs);

module.exports = router;
