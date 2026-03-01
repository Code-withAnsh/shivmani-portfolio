const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createProject, updateProject, deleteProject,
  getContacts, updateContactStatus, deleteContact,
  getCaseStudies, getCaseStudy, createCaseStudy, updateCaseStudy, deleteCaseStudy,
  getBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost,
  getAuditRequests, updateAuditStatus, deleteAuditRequest,
  createTestimonial, updateTestimonial, deleteTestimonial,
  getDashboardStats,
} = require('../controllers');

const router = express.Router();

// All admin routes require JWT
router.use(protect);

// Dashboard
router.get('/stats', getDashboardStats);

// Projects CRUD
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Case Studies CRUD
router.get('/case-studies', getCaseStudies); // Admin view
router.post('/case-studies', createCaseStudy);
router.put('/case-studies/:id', updateCaseStudy);
router.delete('/case-studies/:id', deleteCaseStudy);

// Blogs CRUD
router.get('/blogs', getBlogPosts); // Admin view
router.post('/blogs', createBlogPost);
router.put('/blogs/:id', updateBlogPost);
router.delete('/blogs/:id', deleteBlogPost);

// Contact messages
router.get('/contacts', getContacts);
router.patch('/contacts/:id/status', updateContactStatus);
router.delete('/contacts/:id', deleteContact);

// Website Audits
router.get('/audits', getAuditRequests);
router.patch('/audits/:id/status', updateAuditStatus);
router.delete('/audits/:id', deleteAuditRequest);

// Testimonials CRUD
router.post('/testimonials', createTestimonial);
router.put('/testimonials/:id', updateTestimonial);
router.delete('/testimonials/:id', deleteTestimonial);

module.exports = router;