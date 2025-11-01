const cron = require('node-cron');
const config = require('../config');
const { fetchAndStoreMGNREGAData } = require('../services/mgnregaService');

/**
 * Initialize cron job for daily data refresh
 */
const initCronJob = () => {
  console.log(`⏰ Scheduling cron job: ${config.cron.schedule}`);

  // Schedule daily data refresh
  cron.schedule(config.cron.schedule, async () => {
    console.log('\n🕐 Cron job triggered - Starting scheduled data refresh');
    try {
      await fetchAndStoreMGNREGAData();
      console.log('✅ Scheduled data refresh completed\n');
    } catch (error) {
      console.error('❌ Scheduled data refresh failed:', error.message);
    }
  });

  console.log('✅ Cron job initialized successfully');
};

/**
 * Manual trigger for testing
 */
const triggerManualSync = async (state = null, year = null) => {
  console.log('🔄 Manual sync triggered');
  return await fetchAndStoreMGNREGAData(state, year);
};

module.exports = {
  initCronJob,
  triggerManualSync,
};
