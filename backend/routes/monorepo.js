const express = require('express');
const router = express.Router();
const monorepoController = require('../controllers/monorepoController');

// Hero section API
router.get('/hero', monorepoController.getHeroSection);

// Features section API
router.get('/features', monorepoController.getFeaturesSection);

// All Elements section API
router.get('/all-elements', monorepoController.getAllElementsSection);

// Element content APIs
router.post('/element-content', monorepoController.getElementContent);
router.get('/heading-content', monorepoController.getHeadingContent);
router.get('/text-content', monorepoController.getTextContent);
router.get('/description-content', monorepoController.getDescriptionContent);
router.get('/button-content', monorepoController.getButtonContent);

module.exports = router;
