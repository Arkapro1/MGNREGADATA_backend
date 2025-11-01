require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  mgnrega: {
    apiKey: process.env.MGNREGA_API_KEY,
    baseUrl: process.env.MGNREGA_BASE_URL,
  },
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // Auto-fix for Docker: If DATABASE_URL uses public IP and we're in Docker, use internal hostname
    getConnectionUrl: function() {
      let dbUrl = this.url;
      
      // If in production and using public IP, try to use Docker internal hostname
      if (process.env.NODE_ENV === 'production' && dbUrl && dbUrl.includes('72.60.196.209')) {
        // Try to find PostgreSQL container hostname
        const dockerPgHost = process.env.DOCKER_PG_HOST || 'dbgt-postgt-2sc98v.1.w9j9b052m164pnwa67dtwuafa';
        dbUrl = dbUrl.replace('72.60.196.209', dockerPgHost);
        console.log('🐳 Docker mode detected - Using internal PostgreSQL hostname:', dockerPgHost);
      }
      
      return dbUrl;
    }
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 2 * * *',
  },
};
