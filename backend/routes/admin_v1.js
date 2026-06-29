var express = require('express');
var router = express.Router();
const AdminController = require("../controller/AdminController");
const VpsController = require("../controller/VpsController")
const BlogsController = require("../controller/BlogsController")
const testing = require("../controller/Testing")
const skpkVerify = require("../middlewares/skpkVerify")
const authentication = require('../middlewares/jwtauth')
const ReviewsController=require("../controller/ReviewsController");
const DomainController = require('../controller/DomainController');
const CategoriesController = require('../controller/CategoriesController');
const DynamicFormController = require("../controller/DynamicFormController");
const NotificationController = require("../controller/NotificationController");
const PinterestController = require("../controller/PinterestController");
const ProjectControoler = require("../controller/projectcontrooler");
const projectcontrooler = require('../controller/projectcontrooler');
const WalletSystemController = require("../controller/WalletSystemController");

// Dashboard Stats
router.get("/getDashboardStats", authentication, AdminController.getDashboardStats);

// Notification Routes
router.post("/createNotification", authentication, NotificationController.createNotification);
router.post("/fetchNotifications", authentication, NotificationController.fetchNotifications);
router.get("/fetchLatestNotifications", authentication, NotificationController.fetchLatestNotifications);
router.post("/markNotificationAsRead", authentication, NotificationController.markAsRead);
router.post("/markAllNotificationsAsRead", authentication, NotificationController.markAllAsRead);

// Pintrest Collage Route


router.post("/create_dynamic_form",authentication, DynamicFormController.create_dynamic_form);
router.post("/edit_dynamic_form",authentication, DynamicFormController.edit_dynamic_form);
router.post("/delete_dynamic_form",authentication, DynamicFormController.delete_dynamic_form);
router.post("/enable_disable_form",authentication, DynamicFormController.enable_disable_form);
router.post("/fetch_dynamic_forms", DynamicFormController.fetch_dynamic_forms); // Public access for website - returns latest form only
router.post("/fetch_all_forms_admin", authentication, DynamicFormController.fetch_all_forms_admin); // Admin access - returns all forms
router.post("/submit_form_data", DynamicFormController.submit_form_data); // Public access for website
router.post("/fetch_form_submissions",authentication, DynamicFormController.fetch_form_submissions)

router.post("/make_collage", PinterestController.make_collage);  
router.post("/add_numbering", PinterestController.add_numbering);  
router.get("/get_variants", PinterestController.get_variants);  

// Pinterest Category Routes
router.post("/pinterest/createCategory", authentication, PinterestController.createCategory);
router.post("/pinterest/fetchCategories", authentication, PinterestController.fetchCategories);
router.post("/pinterest/updateCategory", authentication, PinterestController.updateCategory);
router.post("/pinterest/deleteCategory", authentication, PinterestController.deleteCategory);

// Pinterest Project Routes
router.post("/pinterest/createProject", authentication, PinterestController.createProject);
router.post("/pinterest/generatePinTitles", authentication, PinterestController.generatePinTitles);
router.post("/pinterest/generatePinterestBlogs", authentication, PinterestController.generatePinterestBlogs);
router.post("/pinterest/generateNanoBananaImages", authentication, PinterestController.generateNanoBananaImages);

router.post("/addBulkCategoriesWithSubs", CategoriesController.addBulkCategoriesWithSubs);


// Create main category
router.post("/addNewCategory", CategoriesController.addNewCategory);

// Create subcategory
router.post("/addNewSubCategory", CategoriesController.addNewSubCategory);

// Create micro / niche category
router.post("/addNewMicroCategory", CategoriesController.addNewMicroCategory);


// Fetch all categories
router.get('/fetchCategories', CategoriesController.fetchCategories);

// Fetch subcategories for a category
router.post('/fetchSubCategories', CategoriesController.fetchSubCategories);

// Fetch microcategories for a subcategory
router.post('/fetchMicroCategories', CategoriesController.fetchMicroCategories);


router.post("/add_fake_reviews",authentication, ReviewsController.add_fake_reviews); // ✅ new one
router.post("/approve_review", ReviewsController.approve_review); // pass reviewId + status in body
router.post("/fetch_my_reviews",authentication, ReviewsController.fetch_my_reviews);



router.post("/getFocusedKeyword", authentication, AdminController.getFocusedKeyword);                      // Create
router.post("/getProjectKeywords", authentication, AdminController.getProjectKeywords);                      // Create
router.post("/uploadFile", AdminController.uploadFileapi);                      // Create



router.get("/fetch_countries", AdminController.fetch_countries);
router.get("/fetch_states", AdminController.fetch_states);
router.get("/fetch_cities", AdminController.fetch_cities);
router.post("/my_site", AdminController.my_site);
router.post("/getAboutUs", AdminController.getAboutUs);
router.post("/fetch_services", AdminController.fetch_services);
router.post("/fetch_service_location_pages_status", authentication, AdminController.fetch_service_location_pages_status);
router.post("/fetch_ordered_services", AdminController.fetch_ordered_services);
router.post("/create_service", AdminController.create_service);
router.put("/update_service/:serviceId", AdminController.update_service);
router.delete("/delete_service/:serviceId", AdminController.delete_service);
router.get("/clear_redis", AdminController.clear_redis)
router.get("/services/:projectId", AdminController.fetchServicesByProjectId);
router.put("/updateAboutUs", AdminController.updateAboutUs);
router.put("/updateBusinessAboutUs", ProjectControoler.updateBusinessAboutUs);

router.get("/getAboutUs/:projectId", AdminController.getAboutUs);
router.post("/updateProjectTheme", authentication, AdminController.updateProjectTheme);

// Website Design APIs
router.post("/upsertWebsitePage", authentication, AdminController.upsertWebsitePage);
router.post("/bulkUpsertWebsitePages", authentication, AdminController.bulkUpsertWebsitePages);
router.post("/upsertWebsiteComponent", authentication, AdminController.upsertWebsiteComponent);
router.get("/getComponentVariants", authentication, AdminController.getComponentVariants);
router.post("/refreshComponentsFromRegistry", authentication, AdminController.refreshComponentsFromRegistry);
router.post("/terminateAllRedisTasks", authentication, AdminController.terminateAllRedisTasks);
router.post("/clearDangerZoneEntries", authentication, AdminController.clearDangerZoneEntries);
router.post("/createProjectDataBackupZip", authentication, AdminController.createProjectDataBackupZip);
router.post("/restoreProjectDataBackupZip", authentication, AdminController.restoreProjectDataBackupZip);
router.post("/generateTheme", authentication, AdminController.generateTheme);
router.post("/saveWebsiteDesignData", authentication, AdminController.saveWebsiteDesignData);
router.post("/updateWebsiteDesignData", authentication, AdminController.updateWebsiteDesignData);
router.post("/updateComponentElements", AdminController.updateComponentElements);
router.get("/getGenieBuildPageData/:projectId/:pageId", AdminController.getWebsiteDesignData);
router.get("/getWebsitePages/:projectId", authentication, AdminController.getWebsitePages);
router.get("/getPageSlugHistory/:projectId/:pageId", authentication, AdminController.getPageSlugHistory);
router.get("/isBusinessWebsite/:projectId", authentication, AdminController.isBusinessWebsite);
router.post("/upsertBuilderElements", authentication, AdminController.upsertBuilderElements);
router.get("/getBuilderElements", AdminController.getBuilderElements);

// ============================================
// Header/Footer APIs
// ============================================
// Header APIs
router.post("/header/create", authentication, AdminController.headerCreate);
router.put("/header/update/:id", authentication, AdminController.headerUpdate);
router.delete("/header/delete/:id", authentication, AdminController.headerDelete);
// GET endpoints - no authentication required (for public access in customSites)
router.get("/header/:id", AdminController.headerGetById);
router.get("/header/project/:projectId", AdminController.headerGetByProject);
router.get("/header/active/:projectId", AdminController.headerGetActive);
router.post("/header/activate/:id", authentication, AdminController.headerActivate);

// Footer APIs
router.post("/footer/create", authentication, AdminController.footerCreate);
router.put("/footer/update/:id", authentication, AdminController.footerUpdate);
router.delete("/footer/delete/:id", authentication, AdminController.footerDelete);
// GET endpoints - no authentication required (for public access in customSites)
router.get("/footer/:id", AdminController.footerGetById);
router.get("/footer/project/:projectId", AdminController.footerGetByProject);
router.get("/footer/active/:projectId", AdminController.footerGetActive);
router.post("/footer/activate/:id", authentication, AdminController.footerActivate);

// Create Default Header/Footer
router.post("/header-footer/create-default", authentication, AdminController.createDefaultHeaderFooter);

// Update menu URLs when page slug changes
router.post("/header-footer/update-menu-urls", authentication, AdminController.updateMenuUrlsForPage);

// theme routes
router.post("/create_theme", AdminController.create_theme);                      // Create
router.post("/update_theme", AdminController.update_theme);              // Edit
router.post("/change_theme_status", AdminController.change_theme_status); // Change status
router.get("/list_themes", AdminController.list_themes);                         // List
router.post("/seed_themes", AdminController.seed_themes);                        // Seed default themes
// Test route to verify routing works
router.get("/test_scan_route", (req, res) => {
    console.log('✅ TEST ROUTE HIT: /test_scan_route');
    res.json({ message: 'Route is working!', timestamp: new Date().toISOString() });
});

router.get("/scan_website_themes", (req, res, next) => {
    console.log('========================================');
    console.log('📍 ROUTE MIDDLEWARE: scan_website_themes');
    console.log('   Method:', req.method);
    console.log('   URL:', req.url);
    console.log('   Original URL:', req.originalUrl);
    console.log('   Path:', req.path);
    console.log('   Base URL:', req.baseUrl);
    console.log('   Headers:', JSON.stringify(req.headers, null, 2));
    console.log('========================================');
    next();
}, AdminController.scan_website_themes);
        // Scan themes folder
router.post("/update_theme_thumbnail", AdminController.update_theme_thumbnail);  // Update theme thumbnail



router.post("/ytcontent", testing.ytcontent);
router.post("/allnichecontent", testing.allnichecontent);

router.get("/verifytoken", authentication, AdminController.verifytoken)


/* GET home page. */

router.post("/create_user", AdminController.create_user);

// Route to create an author
router.post("/create_author", authentication, AdminController.create_author);

// Route to fetch all authors for the logged-in user
router.get("/fetch_authors", authentication, AdminController.fetch_authors);

// Route to delete an author by authorId
router.post("/delete_author/:authorId", authentication, AdminController.delete_author);

// Route to edit an author's details by authorId
router.post("/edit_author/:authorId", authentication, AdminController.edit_author);

router.post("/fetch_author_by_blog_id", AdminController.fetch_author_by_blog_id);

router.post("/queueLatLngCities", AdminController.queueLatLngCities);

router.get("/fetch_users", authentication, AdminController.fetch_users)

router.post("/openAiTest", AdminController.openAiTest);

router.post("/openAiString", AdminController.openAiString);

router.post("/openAiJSON", AdminController.openAiJSON);




router.delete('/clearAllData', AdminController.clearAllData);




// final project routes
router.post("/getOpenAIUsageByProject", AdminController.getOpenAIUsageByProject);
router.post("/getCreditsUsageReport", authentication, AdminController.getCreditsUsageReport);
// Old subscription endpoints removed in favor of wallet/v2 APIs

// ===== New Wallet/Credits/Plans system (v2) =====
router.post("/wallet/v2/dashboard", authentication, WalletSystemController.walletDashboard);
router.post("/wallet/v2/config/get", authentication, WalletSystemController.getSystemConfig);
router.post("/wallet/v2/config/update", authentication, WalletSystemController.updateSystemConfig);
router.post("/wallet/v2/admin/plan/create", authentication, WalletSystemController.adminCreatePlan);
router.post("/wallet/v2/admin/plan/list", authentication, WalletSystemController.adminListPlans);
router.post("/wallet/v2/admin/package/create", authentication, WalletSystemController.adminCreatePackage);
router.post("/wallet/v2/admin/package/list", authentication, WalletSystemController.adminListPackages);
router.post("/wallet/v2/admin/service/create", authentication, WalletSystemController.adminCreateService);
router.post("/wallet/v2/admin/service/list", authentication, WalletSystemController.adminListServices);
router.post("/wallet/v2/admin/offer/create", authentication, WalletSystemController.adminCreateOffer);
router.post("/wallet/v2/admin/coupon/create", authentication, WalletSystemController.adminCreateCoupon);
router.post("/wallet/v2/checkout/data", authentication, WalletSystemController.listCheckoutData);
router.post("/wallet/v2/purchase/plan", authentication, WalletSystemController.purchasePlan);
router.post("/wallet/v2/purchase/package", authentication, WalletSystemController.purchasePackage);
router.post("/wallet/v2/purchase/credits", authentication, WalletSystemController.purchaseCreditsByAmount);
router.post("/wallet/v2/purchase/service", authentication, WalletSystemController.purchaseService);
router.post("/wallet/v2/subscription/renewal", authentication, WalletSystemController.runSubscriptionRenewal);

router.post("/login", AdminController.login);
router.post("/logout", authentication, AdminController.logout);

router.get("/dashboard", AdminController.dashboard);
router.post("/generateImage", AdminController.generateImage);
router.post("/generate-website-sections", AdminController.generateWebsiteSectionsData);
router.post("/regenerate-failed-sections", AdminController.regenerateFailedSections);

// 1. Create Project Route
router.post("/createProject", AdminController.createProject);
router.post("/createBusinessWebsite", authentication, ProjectControoler.createBusinessWebsite);
// Business website wizard steps 1–5 (sequential; design/preview later)
router.get("/businessWebsite/:projectId/basicInfo", authentication, ProjectControoler.getBusinessWebsiteBasicInfo);
router.put("/businessWebsite/:projectId/basicInfo", authentication, ProjectControoler.updateBusinessWebsiteBasicInfo);
router.get("/businessWebsite/:projectId/locations", authentication, ProjectControoler.getBusinessWebsiteLocations);
router.post("/businessWebsite/:projectId/locations", authentication, ProjectControoler.syncBusinessWebsiteLocations);
router.get("/businessWebsite/:projectId/localAreas", authentication, ProjectControoler.getBusinessWebsiteLocalAreas);
router.post("/businessWebsite/:projectId/localAreas", authentication, ProjectControoler.syncBusinessWebsiteLocalAreas);
router.get("/businessWebsite/:projectId/services", authentication, ProjectControoler.getBusinessWebsiteServices);
router.get("/businessWebsite/:projectId/contact", authentication, ProjectControoler.getBusinessWebsiteContact);
router.put("/businessWebsite/:projectId/contact", authentication, ProjectControoler.updateBusinessAboutUs);
router.get("/businessWebsite/:projectId/design", authentication, ProjectControoler.getBusinessWebsiteDesign);
router.post("/saveBusinessLocation", authentication, ProjectControoler.saveBusinessLocation);
router.post("/fetchBusinessLocations", authentication, ProjectControoler.fetchBusinessLocations);
router.post("/updateGoogleSiteVerification", authentication, AdminController.updateGoogleSiteVerification);
router.post("/uploadGoogleSiteVerificationHtml", authentication, AdminController.uploadGoogleSiteVerificationHtml);
router.post("/deleteProject/:id", AdminController.deleteProject);
router.post("/addTheme", AdminController.addTheme);
router.post("/fetchThemeById", AdminController.fetchThemeById);

router.post("/getUserProjects", authentication, AdminController.getUserProjects);

// 2. Update Country Route
router.post("/updateCountryInProject", ProjectControoler.updateCountryInProject);

// 3. Update State Route
router.post("/updateStateInProject", ProjectControoler.updateStateInProject);

// 4. Update City Route
router.post("/updateCityInProject", ProjectControoler.updateCityInProject);

// 5. Update Local Area Route
router.post("/updateLocalAreaInProject", ProjectControoler.updateLocalAreaInProject);

router.post("/makeEachLocaionPage", AdminController.makeEachLocaionPage);
router.post("/makeEachLocationServicePage", AdminController.makeEachLocationServicePage);

router.post("/generateServices", AdminController.generateServices);

// 6. Fetch the selected locations by project id
router.post("/getProjectLocations", authentication, ProjectControoler.getProjectLocationsHierarchy)
router.post("/generateBlogTitles", authentication, AdminController.generateBlogTitles)

router.post("/addBusinessServicesToLocation", authentication, projectcontrooler.addBusinessServicesToLocation)
router.post("/generateBusinessServicePageContent", authentication, projectcontrooler.generateBusinessServicePageContent)
router.post("/regenerateServiceLocationPageContent", authentication, projectcontrooler.regenerateServiceLocationPageContent)
router.post("/enqueueSectionsContentGeneration", authentication, projectcontrooler.enqueueSectionsContnetGeneration);
router.post("/getBusinessLocationHierarchy", authentication, projectcontrooler.getBusinessLocationHierarchy);
router.post("/toggleBusinessLocationStatus", authentication, projectcontrooler.toggleBusinessLocationStatus);
router.post("/generateBusinessLocationPages", authentication, projectcontrooler.generateBusinessLocationPages);
router.put("/toggleWebsitePagePublished/:projectId", authentication, projectcontrooler.toggleWebsitePagePublished);
router.post("/createProjectServicesWizard", authentication, projectcontrooler.createProjectServicesWizard);
router.post("/upsertSectionContentFromBuilder", authentication, AdminController.upsertSectionContentFromBuilder);
router.post("/addNewServices", AdminController.addNewServices)

router.post("/generateTnC_Au_Pp", AdminController.generateTnC_Au_Pp)
router.post("/generateUnsplashImages", AdminController.generateUnsplashImages);

router.post("/openAi", AdminController.openai);
router.post("/genSNofSt", AdminController.genSNofSt);
router.get("/queueLatLngCitiesCount", AdminController.queueLatLngCitiesCount);


// Route to update or create SEO settings for a page
router.post('/update', AdminController.updateSeoSettings);

// Route to get SEO settings for a page
router.post('/seo', AdminController.getSeoSettings);

router.get('/getWebsitePageSeo/:projectId/:pageId', authentication, AdminController.getWebsitePageSeo);
router.post('/updateWebsitePageSeo', authentication, AdminController.updateWebsitePageSeo);
router.post('/generateWebsitePageSeo', authentication, AdminController.generateWebsitePageSeo);
router.post('/regenerateAllMissingSeo', authentication, AdminController.regenerateAllMissingSeo);

// Route to delete SEO settings for a page
router.delete('/:pageUrl', AdminController.deleteSeoSettings);

// routes/admin.js or wherever appropriate
router.post('/addHosting', authentication, AdminController.addHosting);
router.put('/updateHosting/:id', authentication, AdminController.updateHosting);
router.delete('/deleteHosting/:id', authentication, AdminController.deleteHosting);

router.get('/getMyHostings', authentication, AdminController.getMyHostings);
router.post('/setCurrentHostingForProject', AdminController.setCurrentHostingForProject);
router.post('/getCurrentHostingForProject', AdminController.getCurrentHostingForProject);
router.post('/getProjectConfiguration', AdminController.getProjectConfiguration);

router.post('/browseHostingDirectories', authentication, AdminController.browseHostingDirectories);
router.post('/linkProjectToHosting', authentication, AdminController.linkProjectToHosting);
router.post('/getProjectDeploymentId', authentication, AdminController.getProjectDeploymentId);

router.get('/getLinkedHostings/:projectId', authentication, AdminController.getLinkedHostings);
router.put('/updateLinkedHosting/:id', authentication, AdminController.updateLinkedHosting);
router.delete('/deleteLinkedHosting/:id', authentication, AdminController.deleteLinkedHosting);
router.post('/uploadToHosting', authentication, AdminController.uploadToHosting);
router.post('/updateHostingSitemap', AdminController.updateHostingSitemap);

router.post('/buildStaticSite', authentication, AdminController.buildStaticSite);
router.get('/getStaticBuildStatus', authentication, AdminController.getStaticBuildStatus);
router.post('/uploadToHostingFromBuild', AdminController.uploadToHostingFromBuild);
router.post('/generateSitemap', AdminController.generateSitemap);
router.post('/updateProjectDomain', AdminController.updateProjectDomain);
router.post('/connectDomain', authentication, VpsController.connectDomain);
router.post('/unlinkDomain', authentication, VpsController.unlinkDomain);
router.post('/getOurHostedDetails', AdminController.getOurHostedDetails);

router.post('/getDeployInfo', AdminController.getDeployInfo);
router.post('/checkDomain', AdminController.checkDomain);
// AI service names preview (no DB writes)
router.post('/genrateAiProjectServices', authentication, AdminController.genrateAiProjectServices);
router.post("/getLocalAreasWithPincodes", authentication, AdminController.getLocalAreasWithPincodes);



// Blogs controller

router.post("/blog/meta-title", authentication, AdminController.getBlogMetaTitle);
router.post("/blog/meta-keywords", authentication, AdminController.getBlogMetaKeywords);
router.post("/blog/meta-description", authentication, AdminController.getBlogMetaDescription);

// Create a new blog
router.post("/createBlog", authentication, BlogsController.create_blog);

// Update an existing blog
router.post("/updateBlog/:id", authentication, BlogsController.update_blog);

// Delete a blog
router.delete("/deleteBlog", authentication, BlogsController.delete_blog);

// Get single blog
router.get("/getBlog", authentication, BlogsController.get_blog);

// List all blogs (with filters/pagination)
router.get("/listBlogs", authentication, BlogsController.list_blogs);
router.post("/related_blogs", BlogsController.related_blogs);

// Like & Unlike
router.post("/likeBlog", authentication, BlogsController.like_blog);
router.post("/unlikeBlog", authentication, BlogsController.unlike_blog);

// Increment blog views
router.post("/viewBlog", authentication, BlogsController.increment_views);

// Change blog status (draft/published/archived)
router.post("/setBlogStatus", authentication, BlogsController.set_blog_status);
router.post("/create_ai_blog", authentication, BlogsController.create_ai_blog);
router.post("/fetch_and_save_images", BlogsController.fetch_and_save_images);









// Add a domain
router.post('/domains', authentication, DomainController.addDomain);

// Remove a domain (by :id OR by domainName in body/query)
router.post('/deleteDomain/:id?', authentication, DomainController.removeDomain);
// routes/domains.js (or wherever your router is defined)
router.get('/domains/list', authentication, DomainController.listDomains); // list domains for the authed user

// Verify domains (bulk by page/limit, or single by body.domainName or :id)
router.post('/domains/verify', authentication, DomainController.verifyDomain);
router.post('/domains/:id/verify', authentication, DomainController.verifyDomain);
module.exports = router;
