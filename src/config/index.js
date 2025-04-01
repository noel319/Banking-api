require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  database: require('./database')[process.env.NODE_ENV || 'development'],
  initialBalance: 10000
};