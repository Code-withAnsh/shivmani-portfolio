const express = require('express');
const { submitAuditRequest } = require('../controllers');
const router = express.Router();

router.post('/', submitAuditRequest);

module.exports = router;
