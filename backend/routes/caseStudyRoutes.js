const express = require('express');
const { getCaseStudies, getCaseStudy } = require('../controllers');
const router = express.Router();

router.get('/', getCaseStudies);
router.get('/:slug', getCaseStudy);

module.exports = router;
