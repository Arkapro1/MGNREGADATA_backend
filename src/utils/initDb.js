const fs = require('fs');
const path = require('path');
const db = require('../db/postgres');

/**
 * Initialize database with schema
 */
const initDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await db.query(schema);

    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
