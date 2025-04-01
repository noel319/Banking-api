const Pino = require('Pino');

const loggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' } 
    : undefined
};

const logger = Pino(loggerOptions);

module.exports = logger;