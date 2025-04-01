const Pino = require('Pino');

/**
 * Configure Pino logger
 */
const loggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' } 
    : undefined
};

/**
 * Create logger instance
 */
const logger = Pino(loggerOptions);

module.exports = logger;