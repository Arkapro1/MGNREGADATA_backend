const axios = require('axios');
const config = require('../config');
const db = require('../db/postgres');
const { cacheHelper } = require('../db/redis');

/**
 * Fetch data from MGNREGA Open API
 */
const fetchFromAPI = async (filters = {}) => {
  try {
    const params = {
      'api-key': config.mgnrega.apiKey,
      format: 'json',
      limit: 1000,
      offset: filters.offset || 0,
      ...filters,
    };

    console.log('🔄 Fetching data from MGNREGA API...');
    const response = await axios.get(config.mgnrega.baseUrl, {
      params,
      timeout: 30000,
    });

    console.log(`✅ API fetch successful - ${response.data.records?.length || 0} records`);
    return response.data;
  } catch (error) {
    console.error('❌ API fetch failed:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    }
    throw new Error(`Failed to fetch from MGNREGA API: ${error.message}`);
  }
};

/**
 * Transform raw API data to database schema
 */
const transformData = (record) => {
  return {
    state_name: record.state_name || record.State_Name || record.statename || null,
    state_code: record.state_code || record.State_Code || record.statecode || null,
    district_name: record.district_name || record.District_Name || record.districtname || null,
    district_code: record.district_code || record.District_Code || record.districtcode || null,
    block_name: record.block_name || record.Block_Name || record.blockname || null,
    block_code: record.block_code || record.Block_Code || record.blockcode || null,
    panchayat_name: record.panchayat_name || record.Panchayat_Name || record.panchayatname || null,
    panchayat_code: record.panchayat_code || record.Panchayat_Code || record.panchayatcode || null,
    fin_year: record.fin_year || record.Fin_Year || record.finyear || record.financial_year || '2023-2024',
    total_expenditure: parseFloat(record.Total_Exp || record.total_expenditure || record.expenditure || 0),
    total_households_worked: parseInt(record.Total_Households_Worked || record.total_households_worked || record.households || 0, 10),
    total_persondays_generated: parseInt(record.Persondays_of_Central_Liability_so_far || record.total_persondays_generated || record.persondays || 0, 10),
    total_women_persondays: parseInt(record.Women_Persondays || record.total_women_persondays || record.women_persondays || 0, 10),
    total_sc_persondays: parseInt(record.SC_persondays || record.total_sc_persondays || record.sc_persondays || 0, 10),
    total_st_persondays: parseInt(record.ST_persondays || record.total_st_persondays || record.st_persondays || 0, 10),
    total_works_completed: parseInt(record.Number_of_Completed_Works || record.total_works_completed || record.works_completed || 0, 10),
    total_works_ongoing: parseInt(record.Number_of_Ongoing_Works || record.total_works_ongoing || record.works_ongoing || 0, 10),
    avg_days_employment_provided: parseFloat(record.Average_days_of_employment_provided_per_Household || record.avg_days_employment_provided || record.avg_employment || 0),
    total_payment_made: parseFloat(record.Wages || record.total_payment_made || record.payment || 0),
    avg_wage_rate: parseFloat(record.Average_Wage_rate_per_day_per_person || record.avg_wage_rate || record.wage_rate || 0),
    raw_data: record,
  };
};

/**
 * Store or update MGNREGA data in PostgreSQL
 */
const storeData = async (records) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of records) {
      const data = transformData(record);

      // Skip if essential fields are missing
      if (!data.state_name || !data.district_name) {
        continue;
      }

      const query = `
        INSERT INTO mgnrega_data (
          state_name, state_code, district_name, district_code,
          block_name, block_code, panchayat_name, panchayat_code,
          fin_year, total_expenditure, total_households_worked,
          total_persondays_generated, total_women_persondays,
          total_sc_persondays, total_st_persondays,
          total_works_completed, total_works_ongoing,
          avg_days_employment_provided, total_payment_made,
          avg_wage_rate, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (state_name, district_name, fin_year, block_name, panchayat_name)
        DO UPDATE SET
          state_code = EXCLUDED.state_code,
          district_code = EXCLUDED.district_code,
          block_code = EXCLUDED.block_code,
          panchayat_code = EXCLUDED.panchayat_code,
          total_expenditure = EXCLUDED.total_expenditure,
          total_households_worked = EXCLUDED.total_households_worked,
          total_persondays_generated = EXCLUDED.total_persondays_generated,
          total_women_persondays = EXCLUDED.total_women_persondays,
          total_sc_persondays = EXCLUDED.total_sc_persondays,
          total_st_persondays = EXCLUDED.total_st_persondays,
          total_works_completed = EXCLUDED.total_works_completed,
          total_works_ongoing = EXCLUDED.total_works_ongoing,
          avg_days_employment_provided = EXCLUDED.avg_days_employment_provided,
          total_payment_made = EXCLUDED.total_payment_made,
          avg_wage_rate = EXCLUDED.avg_wage_rate,
          raw_data = EXCLUDED.raw_data,
          updated_at = CURRENT_TIMESTAMP
        RETURNING (xmax = 0) AS inserted
      `;

      const values = [
        data.state_name, data.state_code, data.district_name, data.district_code,
        data.block_name, data.block_code, data.panchayat_name, data.panchayat_code,
        data.fin_year, data.total_expenditure, data.total_households_worked,
        data.total_persondays_generated, data.total_women_persondays,
        data.total_sc_persondays, data.total_st_persondays,
        data.total_works_completed, data.total_works_ongoing,
        data.avg_days_employment_provided, data.total_payment_made,
        data.avg_wage_rate, JSON.stringify(data.raw_data),
      ];

      const result = await client.query(query, values);
      if (result.rows[0].inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`💾 DB save success - ${insertedCount} inserted, ${updatedCount} updated`);

    return { insertedCount, updatedCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ DB save failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update states and districts lookup tables
 */
const updateLookupTables = async () => {
  try {
    // Update states table
    await db.query(`
      INSERT INTO states (state_name, state_code, total_districts, last_synced)
      SELECT DISTINCT 
        state_name, 
        state_code,
        COUNT(DISTINCT district_name) as total_districts,
        CURRENT_TIMESTAMP
      FROM mgnrega_data
      WHERE state_name IS NOT NULL
      GROUP BY state_name, state_code
      ON CONFLICT (state_name) 
      DO UPDATE SET
        total_districts = EXCLUDED.total_districts,
        last_synced = CURRENT_TIMESTAMP
    `);

    // Update districts table
    await db.query(`
      INSERT INTO districts (state_name, district_name, district_code, last_synced)
      SELECT DISTINCT 
        state_name,
        district_name,
        district_code,
        CURRENT_TIMESTAMP
      FROM mgnrega_data
      WHERE state_name IS NOT NULL AND district_name IS NOT NULL
      ON CONFLICT (state_name, district_name)
      DO UPDATE SET
        district_code = EXCLUDED.district_code,
        last_synced = CURRENT_TIMESTAMP
    `);

    console.log('✅ Lookup tables updated');
  } catch (error) {
    console.error('❌ Lookup tables update failed:', error.message);
  }
};

/**
 * Log API sync attempt
 */
const logSync = async (syncData) => {
  try {
    await db.query(
      `INSERT INTO api_sync_log (sync_type, state_name, fin_year, status, records_synced, error_message, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        syncData.sync_type,
        syncData.state_name,
        syncData.fin_year,
        syncData.status,
        syncData.records_synced,
        syncData.error_message,
        syncData.started_at,
        syncData.completed_at,
      ]
    );
  } catch (error) {
    console.error('Failed to log sync:', error.message);
  }
};

/**
 * Main function: Fetch and store MGNREGA data with batch support
 */
const fetchAndStoreMGNREGAData = async (state = null, year = null, batchSize = 5000) => {
  const startTime = new Date();
  const syncLog = {
    sync_type: 'scheduled',
    state_name: state,
    fin_year: year,
    status: 'failed',
    records_synced: 0,
    error_message: null,
    started_at: startTime,
    completed_at: null,
  };

  try {
    console.log(`\n🔄 Starting MGNREGA data sync...`);
    if (state) console.log(`   State: ${state}`);
    if (year) console.log(`   Year: ${year}`);
    console.log(`   Batch size: ${batchSize} records\n`);

    const filters = {};
    if (state) filters['filters[state_name]'] = state;
    if (year) filters['filters[fin_year]'] = year;

    let totalInserted = 0;
    let totalUpdated = 0;
    let offset = 0;
    let hasMoreData = true;
    let batchCount = 0;

    // Fetch data in batches
    while (hasMoreData && batchCount < 10) { // Limit to 10 batches (10,000 records max per sync)
      batchCount++;
      console.log(`📦 Fetching batch ${batchCount} (offset: ${offset})...`);
      
      filters.offset = offset;
      const apiData = await fetchFromAPI(filters);

      if (!apiData.records || apiData.records.length === 0) {
        console.log('⚠️  No more records found');
        hasMoreData = false;
        break;
      }

      // Store batch in database
      const { insertedCount, updatedCount } = await storeData(apiData.records);
      totalInserted += insertedCount;
      totalUpdated += updatedCount;

      console.log(`   ✅ Batch ${batchCount}: ${insertedCount} new, ${updatedCount} updated`);

      // Check if we should fetch more
      if (apiData.records.length < 1000) {
        hasMoreData = false;
      } else {
        offset += 1000;
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Update lookup tables after all batches
    console.log('\n📊 Updating lookup tables...');
    await updateLookupTables();

    // Clear relevant caches
    await cacheHelper.clearPattern('mgnrega:*');

    syncLog.status = 'success';
    syncLog.records_synced = totalInserted + totalUpdated;
    syncLog.completed_at = new Date();
    await logSync(syncLog);

    console.log(`\n✅ Sync completed successfully`);
    console.log(`   Total batches: ${batchCount}`);
    console.log(`   Total records: ${syncLog.records_synced}`);
    console.log(`   New: ${totalInserted}, Updated: ${totalUpdated}`);
    console.log(`   Duration: ${(syncLog.completed_at - startTime) / 1000}s\n`);

    return {
      success: true,
      recordsProcessed: syncLog.records_synced,
      insertedCount: totalInserted,
      updatedCount: totalUpdated,
      batches: batchCount,
    };
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    syncLog.error_message = error.message;
    syncLog.completed_at = new Date();
    await logSync(syncLog);

    throw error;
  }
};

/**
 * Get all states
 */
const getStates = async () => {
  const cacheKey = 'mgnrega:states';

  // Try cache first
  const cached = await cacheHelper.get(cacheKey);
  if (cached) {
    console.log('⚡ Serving states from cache');
    return cached;
  }

  // Query database
  const result = await db.query(`
    SELECT state_name, state_code, total_districts, last_synced
    FROM states
    ORDER BY state_name
  `);

  // Cache for 1 hour
  await cacheHelper.set(cacheKey, result.rows, 3600);

  return result.rows;
};

/**
 * Get districts by state
 */
const getDistricts = async (stateName) => {
  const cacheKey = `mgnrega:districts:${stateName}`;

  // Try cache first
  const cached = await cacheHelper.get(cacheKey);
  if (cached) {
    console.log('⚡ Serving districts from cache');
    return cached;
  }

  // Query database
  const result = await db.query(
    `SELECT district_name, district_code, last_synced
     FROM districts
     WHERE state_name = $1
     ORDER BY district_name`,
    [stateName]
  );

  // Cache for 1 hour
  await cacheHelper.set(cacheKey, result.rows, 3600);

  return result.rows;
};

/**
 * Get performance data for a district
 */
const getPerformanceData = async (districtName, year = null) => {
  const cacheKey = `mgnrega:performance:${districtName}:${year || 'all'}`;

  // Try cache first
  const cached = await cacheHelper.get(cacheKey);
  if (cached) {
    console.log('⚡ Serving performance data from cache');
    return cached;
  }

  // Build query
  let query = `
    SELECT 
      state_name,
      district_name,
      fin_year,
      SUM(total_expenditure) as total_expenditure,
      SUM(total_households_worked) as total_households_worked,
      SUM(total_persondays_generated) as total_persondays_generated,
      SUM(total_women_persondays) as total_women_persondays,
      SUM(total_sc_persondays) as total_sc_persondays,
      SUM(total_st_persondays) as total_st_persondays,
      SUM(total_works_completed) as total_works_completed,
      SUM(total_works_ongoing) as total_works_ongoing,
      AVG(avg_days_employment_provided) as avg_days_employment_provided,
      SUM(total_payment_made) as total_payment_made,
      AVG(avg_wage_rate) as avg_wage_rate,
      MAX(updated_at) as last_updated,
      COUNT(*) as total_records
    FROM mgnrega_data
    WHERE district_name = $1
  `;

  const params = [districtName];

  if (year) {
    query += ` AND fin_year = $2`;
    params.push(year);
  }

  query += ` GROUP BY state_name, district_name, fin_year ORDER BY fin_year DESC`;

  // Query database
  const result = await db.query(query, params);

  // Cache for 30 minutes
  await cacheHelper.set(cacheKey, result.rows, 1800);

  return result.rows;
};

module.exports = {
  fetchAndStoreMGNREGAData,
  fetchFromAPI,
  getStates,
  getDistricts,
  getPerformanceData,
};
