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
