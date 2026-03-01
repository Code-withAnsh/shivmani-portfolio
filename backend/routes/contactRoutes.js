const express = require('express');
const { submitContact } = require('../controllers');
const router = express.Router();

router.post('/', submitContact);

module.exports = router;