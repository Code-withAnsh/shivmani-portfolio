const express = require('express');
const { getBlogPosts, getBlogPost } = require('../controllers');
const router = express.Router();

router.get('/', getBlogPosts);
router.get('/:slug', getBlogPost);

module.exports = router;
