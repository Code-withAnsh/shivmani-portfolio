/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   SHIVMANI SINGH — PORTFOLIO BACKEND
 *   Node.js + Express + MongoDB (MVC Architecture)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const path = require('path');

console.log('\n\n❤️❤️❤️❤️ PORTFOLIO SERVER STARTING ❤️❤️❤️❤️\n\n');


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── 2. Primary Portfolio DB Connection ────────────────────────
const connectDB = require('./config/db');


// ── Import routes ──────────────────────────────────
const projectRoutes = require('./routes/projectRoutes');
const contactRoutes = require('./routes/contactRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const blogRoutes = require('./routes/blogRoutes');
const auditRoutes = require('./routes/auditRoutes');




// ── Connect to MongoDB ─────────────────────────────
connectDB();


const app = express();

// Render sits behind a proxy: trust it so req.ip is the real visitor (used for the admin lock and spam tracking)
app.set('trust proxy', 1);

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


// ── Logger (dev only) ──────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Serve the built React app (client/dist) ───────
const CLIENT_DIST = path.join(__dirname, '../client/dist');
app.use(express.static(CLIENT_DIST));

// ── API Routes ─────────────────────────────────────
app.use('/api/projects', projectRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/audits', auditRoutes);






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
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
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