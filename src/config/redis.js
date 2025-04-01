require('dotenv').config();

module.exports = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  keyPrefix: 'banking:',
  ttl: 3600 // 1 hour cache TTL (in seconds)
};