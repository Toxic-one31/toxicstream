require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const searchRoutes = require('./routes/search');
const streamRoutes = require('./routes/stream');
const torrentRoutes = require('./routes/torrent');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// ROUTES
// ============================================

app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/torrent', torrentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'ToxicStream API',
    version: '2.0.0',
    status: 'active',
    providers: 18,
    endpoints: {
      search: '/api/search?q={query}&type={movie|tv|anime}&provider={optional}',
      stream: '/api/stream?url={video_page_url}&provider={provider_name}',
      torrent: '/api/torrent/stream (POST)',
      analytics: '/api/analytics (POST)',
      health: '/health'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🔥 TOXICSTREAM API v2.0                ║
║   🚀 Server: http://localhost:${PORT}       ║
║   💚 Health: http://localhost:${PORT}/health║
║   🌐 Providers: 18+ Active                ║
╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;