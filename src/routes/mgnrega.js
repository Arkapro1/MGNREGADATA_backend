const express = require('express');
const router = express.Router();
const {
  getStates,
  getDistricts,
  getPerformanceData,
} = require('../services/mgnregaService');

/**
 * GET /api/states
 * Get list of all available states
 */
router.get('/states', async (req, res) => {
  try {
    const states = await getStates();

    if (states.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No states found. Data may need to be synced.',
        data: [],
      });
    }

    res.json({
      success: true,
      count: states.length,
      data: states,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch states',
      error: error.message,
    });
  }
});

/**
 * GET /api/districts/:state
 * Get list of all districts in a state
 */
router.get('/districts/:state', async (req, res) => {
  try {
    const stateName = req.params.state;
    const districts = await getDistricts(stateName);

    if (districts.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No districts found for state: ${stateName}`,
        data: [],
      });
    }

    res.json({
      success: true,
      state: stateName,
      count: districts.length,
      data: districts,
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
      error: error.message,
    });
  }
});

/**
 * GET /api/performance/:district
 * Get performance data for a district
 * Query params: ?year=YYYY (optional)
 */
router.get('/performance/:district', async (req, res) => {
  try {
    const districtName = req.params.district;
    const year = req.query.year || null;

    const performance = await getPerformanceData(districtName, year);

    if (performance.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No performance data found for district: ${districtName}${
          year ? ` in year ${year}` : ''
        }`,
        data: [],
      });
    }

    res.json({
      success: true,
      district: districtName,
      year: year || 'all',
      count: performance.length,
      data: performance,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance data',
      error: error.message,
    });
  }
});

module.exports = router;
