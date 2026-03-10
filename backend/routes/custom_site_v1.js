const express = require('express');
const router = express.Router();
const CustomSiteController = require('../controller/CustomSiteController');

// Builder and CustomSite related APIs

// Get Hero Component Data
// Returns project name, image, description, and Font Awesome icon
router.post('/get_herocomponetdata', CustomSiteController.getHeroComponentData);

// Get Services Component Data
// Returns array of services with service_name, service_description, fas_fa_icon, and images
router.post('/get_servicescomponentdata', CustomSiteController.getServicesComponentData);

// Get CTA Component Data
// Returns array of CTAs with title and description from UserProject.cta
router.post('/get_ctacomponentdata', CustomSiteController.getCTAComponentData);

// Rewrite Text
// Rewrites text based on prompt, optionally with target word count
// Body: { currentText: string, promptText: string, words?: number, userId?: string, projectId?: string, pageId?: string }
router.post('/rewrite_text', CustomSiteController.rewriteText);

// Get Component Layout
// Returns hierarchical structure: Pages -> Components -> Elements (with children)
// Body: { projectId, pageId?: string, uniqueId?: string }
router.post('/component_layout', CustomSiteController.component_layout);

// Get Element Children
// Returns children of a specific element
// Body: { projectId, pageId?: string, uniqueId?: string, elementId: string }
router.post('/get_element_children', CustomSiteController.getElementChildren);

// Reorder Layout
// Reorders elements/components in the layout hierarchy
// Body: { projectId, pageId?: string, uniqueId?: string, elementId: string, parentElementId?: string, direction: 'up' | 'down' }
router.post('/reorder_layout', CustomSiteController.reorderLayout);

module.exports = router;

