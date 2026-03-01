// ━━━━━━━━━━━━━━━━━ PROJECT MODEL ━━━━━━━━━━━━━━━━━
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  stack: {
    type: [String],
    required: [true, 'Tech stack is required'],
    validate: {
      validator: arr => arr.length > 0,
      message: 'At least one technology is required',
    },
  },
  category: {
    type: String,
    enum: ['Frontend', 'Full Stack', 'API', 'Backend'],
    required: [true, 'Category is required'],
  },
  image: { type: String, default: '' },
  demo: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+/.test(v),
      message: 'Demo URL must be a valid URL',
    },
    default: '',
  },
  github: {
    type: String,
    validate: {
      validator: v => !v || /^https?:\/\/.+/.test(v),
      message: 'GitHub URL must be a valid URL',
    },
    default: '',
  },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  caseStudy: { type: mongoose.Schema.Types.ObjectId, ref: 'CaseStudy' },
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ CASE STUDY MODEL ━━━━━━━━━━━━━━━
const CaseStudySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  problem: { type: String, required: true },
  challenges: { type: String, required: true },
  architecture: { type: String, required: true },
  security: { type: String },
  performance: { type: String },
  results: { type: String },
  images: [{ type: String }], // Array of screenshot URLs
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ CONTACT MODEL ━━━━━━━━━━━━━━━━━
const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      message: 'Please enter a valid email',
    },
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
  },
  service: {
    type: String,
    trim: true,
    enum: ['website', 'frontend', 'animation', 'consulting', 'other'],
  },
  budget: {
    type: String,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
    default: 'General Inquiry',
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'replied', 'archived'],
    default: 'unread',
  },
  ip: { type: String, default: '' }, // For spam tracking
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ BLOG MODEL ━━━━━━━━━━━━━━━━━━━━━
const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  content: { type: String, required: true }, // Markdown supported
  excerpt: { type: String, trim: true },
  tags: [{ type: String }],
  image: { type: String },
  views: { type: Number, default: 0 },
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ AUDIT MODEL ━━━━━━━━━━━━━━━━━━━━
const AuditSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  websiteUrl: { type: String, required: true, trim: true },
  concern: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'reviewed', 'completed'], default: 'pending' },
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ TESTIMONIAL MODEL ━━━━━━━━━━━━━
const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role/Position is required'],
    trim: true,
    maxlength: [120, 'Role cannot exceed 120 characters'],
  },
  text: {
    type: String,
    required: [true, 'Testimonial text is required'],
    trim: true,
    maxlength: [500, 'Testimonial cannot exceed 500 characters'],
  },
  stars: {
    type: Number,
    min: 1, max: 5,
    default: 5,
  },
  company: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' },
  approved: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// ━━━━━━━━━━━━━━━━━ ADMIN MODEL ━━━━━━━━━━━━━━━━━━━
const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
  },
  lastLogin: { type: Date },
}, { timestamps: true });

const Project = mongoose.model('Project', ProjectSchema);
const Contact = mongoose.model('Contact', ContactSchema);
const Testimonial = mongoose.model('Testimonial', TestimonialSchema);
const Admin = mongoose.model('Admin', AdminSchema);
const CaseStudy = mongoose.model('CaseStudy', CaseStudySchema);
const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
const Audit = mongoose.model('Audit', AuditSchema);

module.exports = { Project, Contact, Testimonial, Admin, CaseStudy, BlogPost, Audit };