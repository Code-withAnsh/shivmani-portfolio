// ━━━━━━━━━━━━ projectRoutes.js ━━━━━━━━━━━━
const express = require('express');
const { getProjects, getProject } = require('../controllers');
const router = express.Router();

router.get('/', getProjects);
router.get('/:id', getProject);

module.exports = router;