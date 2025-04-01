const Redis = require('ioredis');
const config = require('../config/redis');

// Create Redis client
const redisClient = new Redis({
  host: config.host,
  port: config.port,
  keyPrefix: config.keyPrefix
});

// Handle Redis errors
redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

// Helper functions for Redis operations
const redis = {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Parsed value or null if not found
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to store (will be JSON.stringified)
   * @param {number} [ttl=config.ttl] - Time to live in seconds
   * @returns {Promise<boolean>} - Success or failure
   */
  async set(key, value, ttl = config.ttl) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success or failure
   */
  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  /**
   * Clear all values with the configured prefix
   * @returns {Promise<boolean>} - Success or failure
   */
  async clear() {
    try {
      const keys = await redisClient.keys(`${config.keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  },

  /**
   * Close Redis connection
   * @returns {Promise<void>}
   */
  async close() {
    await redisClient.quit();
  }
};

module.exports = redis;