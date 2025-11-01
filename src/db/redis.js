const Redis = require('ioredis');
const config = require('../config');

let redis = null;
let isRedisAvailable = false;

try {
  // Create Redis client
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    retryStrategy: (times) => {
      if (times > 3) {
        console.log('⚠️  Redis unavailable - continuing without cache');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  // Connection events
  redis.on('connect', () => {
    console.log('⚡ Redis cache connected');
    isRedisAvailable = true;
  });

  redis.on('error', (err) => {
    console.error('⚠️  Redis connection error:', err.message);
    isRedisAvailable = false;
  });

  redis.on('ready', () => {
    console.log('⚡ Redis cache ready');
    isRedisAvailable = true;
  });

  // Try to connect
  redis.connect().catch((err) => {
    console.log('⚠️  Redis unavailable - system will work without caching');
    isRedisAvailable = false;
  });
} catch (error) {
  console.log('⚠️  Redis unavailable - system will work without caching');
  isRedisAvailable = false;
}

// Helper functions for cache operations
const cacheHelper = {
  // Get cached data
  get: async (key) => {
    if (!isRedisAvailable || !redis) {
      return null;
    }
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis GET error:', error.message);
      return null;
    }
  },

  // Set cache with optional TTL (in seconds)
  set: async (key, value, ttl = 3600) => {
    if (!isRedisAvailable || !redis) {
      return false;
    }
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      console.error('Redis SET error:', error.message);
      return false;
    }
  },

  // Delete cache key
  del: async (key) => {
    if (!isRedisAvailable || !redis) {
      return false;
    }
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error.message);
      return false;
    }
  },

  // Clear all cache with pattern
  clearPattern: async (pattern) => {
    if (!isRedisAvailable || !redis) {
      return false;
    }
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis CLEAR error:', error.message);
      return false;
    }
  },
};

module.exports = {
  redis,
  cacheHelper,
  isRedisAvailable: () => isRedisAvailable,
};
