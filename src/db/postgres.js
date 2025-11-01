const { Pool } = require('pg');
const config = require('../config');

// Get the correct connection URL (handles Docker networking)
const connectionString = config.database.getConnectionUrl 
  ? config.database.getConnectionUrl() 
  : config.database.url;

console.log('🔌 Connecting to PostgreSQL:', connectionString.replace(/:[^:@]+@/, ':***@'));

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000, // Increased to 20 seconds
  statement_timeout: 30000, // 30 second query timeout
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

// Test the connection on initialization
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  query: (text, params) => pool.query(text, params),
};
