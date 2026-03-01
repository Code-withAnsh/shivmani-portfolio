const express = require('express');
const { getTestimonials } = require('../controllers');
const router = express.Router();

router.get('/', getTestimonials);

module.exports = router;