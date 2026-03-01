const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Project, Contact, Testimonial, Admin, CaseStudy, BlogPost, Audit } = require('../models');

// ════════════════════════════════════════════════════
//   PROJECT CONTROLLERS
// ════════════════════════════════════════════════════

/** GET /api/projects - Public: Get all projects */
const getProjects = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const query = {};
    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.featured = true;

    const projects = await Project.find(query)
      .populate('caseStudy', 'slug')
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch projects' });
  }
};

/** GET /api/projects/:id */
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/admin/projects - Protected */
const createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** PUT /api/admin/projects/:id - Protected */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/projects/:id - Protected */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   CONTACT CONTROLLERS
// ════════════════════════════════════════════════════

/** POST /api/contact */
const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, phone, company, service, budget } = req.body;

    // Honeypot check (field hidden from real users)
    if (req.body.website) {
      return res.status(200).json({ success: true, message: 'Message received.' });
    }

    const contact = await Contact.create({
      name, email, subject, message, phone, company, service, budget,
      ip: req.ip || req.connection.remoteAddress,
    });

    res.status(201).json({
      success: true,
      message: "Message sent! I'll get back to you within 24 hours.",
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** GET /api/admin/contacts - Protected */
const getContacts = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const contacts = await Contact.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PATCH /api/admin/contacts/:id - Update status */
const updateContactStatus = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/contacts/:id - Protected */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   CASE STUDY CONTROLLERS
// ════════════════════════════════════════════════════

/** GET /api/case-studies - Public */
const getCaseStudies = async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find().sort({ createdAt: -1 });
    res.json({ success: true, count: caseStudies.length, data: caseStudies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/case-studies/:slug - Public */
const getCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findOne({ slug: req.params.slug });
    if (!caseStudy) return res.status(404).json({ success: false, message: 'Case study not found' });
    res.json({ success: true, data: caseStudy });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/admin/case-studies - Protected */
const createCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.create(req.body);
    res.status(201).json({ success: true, data: caseStudy });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** PUT /api/admin/case-studies/:id - Protected */
const updateCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!caseStudy) return res.status(404).json({ success: false, message: 'Case study not found' });
    res.json({ success: true, data: caseStudy });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/case-studies/:id - Protected */
const deleteCaseStudy = async (req, res) => {
  try {
    await CaseStudy.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Case study deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   BLOG CONTROLLERS
// ════════════════════════════════════════════════════

/** GET /api/blogs - Public */
const getBlogPosts = async (req, res) => {
  try {
    const posts = await BlogPost.find().sort({ createdAt: -1 }).select('-content');
    res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/blogs/:slug - Public */
const getBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/admin/blogs - Protected */
const createBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.create(req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** PUT /api/admin/blogs/:id - Protected */
const updateBlogPost = async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ success: false, message: 'Blog post not found' });
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/blogs/:id - Protected */
const deleteBlogPost = async (req, res) => {
  try {
    await BlogPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   AUDIT CONTROLLERS
// ════════════════════════════════════════════════════

/** POST /api/audits - Public */
const submitAuditRequest = async (req, res) => {
  try {
    const audit = await Audit.create(req.body);
    res.status(201).json({ success: true, message: 'Audit request received!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** GET /api/admin/audits - Protected */
const getAuditRequests = async (req, res) => {
  try {
    const audits = await Audit.find().sort({ createdAt: -1 });
    res.json({ success: true, data: audits });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PATCH /api/admin/audits/:id/status - Protected */
const updateAuditStatus = async (req, res) => {
  try {
    const audit = await Audit.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ success: true, data: audit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/audits/:id - Protected */
const deleteAuditRequest = async (req, res) => {
  try {
    await Audit.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Audit request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   TESTIMONIAL CONTROLLERS
// ════════════════════════════════════════════════════

/** GET /api/testimonials - Public (approved only) */
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true }).sort({ order: 1 });
    res.json({ success: true, count: testimonials.length, data: testimonials });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/admin/testimonials - Protected */
const createTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.create({ ...req.body, approved: true });
    res.status(201).json({ success: true, data: testimonial });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** PUT /api/admin/testimonials/:id - Protected */
const updateTestimonial = async (req, res) => {
  try {
    const t = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!t) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, data: t });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** DELETE /api/admin/testimonials/:id */
const deleteTestimonial = async (req, res) => {
  try {
    const t = await Testimonial.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Testimonial not found' });
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   AUTH CONTROLLERS
// ════════════════════════════════════════════════════

/** POST /api/auth/login */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await Admin.findByIdAndUpdate(admin._id, { lastLogin: new Date() });

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      admin: { username: admin.username, lastLogin: admin.lastLogin },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/** POST /api/auth/setup - One-time admin setup (disable after use!) */
const setupAdmin = async (req, res) => {
  try {
    const existing = await Admin.findOne({});
    if (existing) {
      return res.status(403).json({ success: false, message: 'Admin already exists. Disable this route.' });
    }
    const { username, password } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const admin = await Admin.create({ username, password: hashed });
    res.status(201).json({ success: true, message: 'Admin account created successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/** GET /api/auth/me - Verify token */
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════
//   DASHBOARD STATS
// ════════════════════════════════════════════════════

/** GET /api/admin/stats */
const getDashboardStats = async (req, res) => {
  try {
    const [projects, contacts, testimonials, unread] = await Promise.all([
      Project.countDocuments(),
      Contact.countDocuments(),
      Testimonial.countDocuments({ approved: true }),
      Contact.countDocuments({ status: 'unread' }),
    ]);
    res.json({ success: true, data: { projects, contacts, testimonials, unread } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProjects, getProject, createProject, updateProject, deleteProject,
  submitContact, getContacts, updateContactStatus, deleteContact,
  getCaseStudies, getCaseStudy, createCaseStudy, updateCaseStudy, deleteCaseStudy,
  getBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost,
  submitAuditRequest, getAuditRequests, updateAuditStatus, deleteAuditRequest,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  login, setupAdmin, getMe,
  getDashboardStats,
};