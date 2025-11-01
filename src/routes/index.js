const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'MGNREGA Dashboard API is running',
  });
});

/**
 * GET /api/
 * API information endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'MGNREGA Dashboard API',
    version: '1.0.0',
    description: 'Backend API for Our Voice, Our Rights MGNREGA Dashboard',
    endpoints: {
      health: 'GET /api/health',
      states: 'GET /api/states',
      districts: 'GET /api/districts/:state',
      performance: 'GET /api/performance/:district?year=YYYY',
      admin: {
        sync: 'POST /api/admin/sync?state=&year=',
        syncStatus: 'GET /api/admin/sync-status',
        stats: 'GET /api/admin/stats',
      },
    },
  });
});

module.exports = router;
