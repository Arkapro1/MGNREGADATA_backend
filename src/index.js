const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const db = require('./db/postgres');
const { redis } = require('./db/redis');
const { initCronJob } = require('./utils/cronJobs');

// Import routes
const indexRoutes = require('./routes/index');
const mgnregaRoutes = require('./routes/mgnrega');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Middleware - Allow all CORS requests
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', indexRoutes);
app.use('/api', mgnregaRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: config.server.env === 'development' ? err.stack : undefined,
  });
});

// Initialize server
const startServer = async () => {
  try {
    console.log('\n🚀 Starting MGNREGA Dashboard Backend...\n');

    // Test PostgreSQL connection
    await db.testConnection();

    // Test Redis connection (optional - won't fail if unavailable)
    try {
      if (redis) {
        await redis.ping();
      }
    } catch (error) {
      console.log('⚠️  Redis unavailable - system will work without caching');
    }

    // Initialize cron jobs
    initCronJob();

    // Start Express server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${config.server.env}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
      console.log('═══════════════════════════════════════════════');
      console.log('🎯 Available Endpoints:');
      console.log('═══════════════════════════════════════════════');
      console.log('  GET  /api/health              - Health check');
      console.log('  GET  /api/states              - List all states');
      console.log('  GET  /api/districts/:state    - Districts by state');
      console.log('  GET  /api/performance/:district?year=YYYY');
      console.log('  POST /api/admin/sync          - Trigger data sync');
      console.log('  GET  /api/admin/sync-status   - Sync logs');
      console.log('  GET  /api/admin/stats         - Database stats');
      console.log('═══════════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
  await db.pool.end();
  if (redis) {
    redis.disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received. Shutting down gracefully...');
  await db.pool.end();
  if (redis) {
    redis.disconnect();
  }
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
