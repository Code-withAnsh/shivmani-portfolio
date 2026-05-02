/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   SHIVMANI SINGH — PORTFOLIO BACKEND
 *   Node.js + Express + MongoDB (MVC Architecture)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

console.log('\n\n❤️❤️❤️❤️ PORTFOLIO SERVER STARTING UPDATED ❤️❤️❤️❤️\n\n');

// ── 1. JSArena (js-arena-core) DB Initialization (PRIORITY) ─────
const jsArenaUri = process.env.JSARENA_MONGO_URI;
const jsArenaSecret = process.env.JSARENA_JWT_SECRET;

console.log('💎💎💎 JSArena Environment Check 💎💎💎');
console.log(`📡 DB URI: ${jsArenaUri ? jsArenaUri.substring(0, 25) + '...' : 'MISSING'}`);
console.log(`🔑 JWT Secret: ${jsArenaSecret ? '*** PRESENT ***' : 'MISSING'}\n`);


const jsArenaConn = mongoose.createConnection(jsArenaUri);
global.jsArenaConn = jsArenaConn;
jsArenaConn.on('connected', () => console.log('✅ JSArena DB connected (from server.js)'));
jsArenaConn.on('error', (err) => console.error('❌ JSArena DB error:', err));


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── 2. Primary Portfolio DB Connection ────────────────────────
const connectDB = require('./config/db');

const { Admin } = require('./models');
const bcrypt = require('bcryptjs');


// ── Import routes ──────────────────────────────────
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const blogRoutes = require('./routes/blogRoutes');
const auditRoutes = require('./routes/auditRoutes');

// ── JSArena (js-arena-core) Routes ──────────────────
const jsArenaAuth = require('../js-arena-core/backend/routes/auth');
const jsArenaProblems = require('../js-arena-core/backend/routes/problems');
const jsArenaSubmissions = require('../js-arena-core/backend/routes/submissions');
const jsArenaUsers = require('../js-arena-core/backend/routes/users');
const jsArenaAI = require('../js-arena-core/backend/routes/ai');
const jsArenaAdmin = require('../js-arena-core/backend/routes/admin');



// ── Connect to MongoDB and Initialize Admin ────────
connectDB().then(async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      console.log('No admin found. Creating default admin from .env...');
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await Admin.create({
        username: process.env.ADMIN_USERNAME,
        password: hashed
      });
      console.log('✅ Default admin account created successfully.');
    }

    console.log('✅ Default admin account created successfully.');
  } catch (err) {
    console.error('Failed to initialize admin:', err);
  }
});


const app = express();

// ── Security middleware ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));


// ── CORS ───────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || origin === 'null') return callback(null, true);
    // In dev, you could allow all, but let's be safe
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.options('*', cors());

// Handle preflight requests
app.options("*", cors());
// ── Global rate limiter ────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', globalLimiter);

// ── Stricter limiter for contact form ─────────────
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many contact submissions. Please wait an hour.' },
});

// ── Body parsing ───────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── JSArena Frontend (Native serving via root static middleware) ──




// ── Logger (dev only) ──────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Serve static frontend ──────────────────────────
app.use(express.static(path.join(__dirname, '../')));

// ── API Routes ─────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/audits', auditRoutes);

// ── JSArena API ────────────────────────────────────
app.use('/api/js-arena/auth', jsArenaAuth);
app.use('/api/js-arena/problems', jsArenaProblems);
app.use('/api/js-arena/submissions', jsArenaSubmissions);
app.use('/api/js-arena/users', jsArenaUsers);
app.use('/api/js-arena/ai', jsArenaAI);
app.use('/api/js-arena/admin', jsArenaAdmin);





// ── Health check ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Portfolio API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── Serve frontend for all non-API routes ──────────
app.get('*', (req, res) => {
  // Skip if it's an API route or a file with an extension (e.g. .pdf, .png, .css)
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '../index.html'));
  }
});

// ── Global error handler ───────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// ── Start server ───────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}\n`);
});