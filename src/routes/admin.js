const express = require('express');
const router = express.Router();
const { triggerManualSync } = require('../utils/cronJobs');
const db = require('../db/postgres');

/**
 * GET /api/admin/sync
 * Manually trigger data sync
 * Query params: ?state=StateName&year=YYYY (optional)
 */
router.post('/sync', async (req, res) => {
  try {
    const { state, year } = req.query;

    console.log('📡 Manual sync requested via API');

    // Trigger sync in background
    triggerManualSync(state, year)
      .then((result) => {
        console.log('✅ Manual sync completed:', result);
      })
      .catch((error) => {
        console.error('❌ Manual sync failed:', error);
      });

    res.json({
      success: true,
      message: 'Data sync initiated. This may take a few minutes.',
      params: {
        state: state || 'all',
        year: year || 'all',
      },
    });
  } catch (error) {
    console.error('Error initiating sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate sync',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/sync-status
 * Get recent sync logs
 */
router.get('/sync-status', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await db.query(
      `SELECT * FROM api_sync_log 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync status',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/stats
 * Get database statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT state_name) as total_states,
        COUNT(DISTINCT district_name) as total_districts,
        COUNT(DISTINCT fin_year) as total_years,
        MAX(updated_at) as last_updated,
        MIN(created_at) as first_record,
        SUM(total_expenditure) as total_expenditure_all,
        SUM(total_households_worked) as total_households_all
      FROM mgnrega_data
    `;

    const result = await db.query(statsQuery);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
});

module.exports = router;
