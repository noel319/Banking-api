require('dotenv').config();

module.exports = {
  url: process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672',
  exchanges: {
    transactions: 'banking.transactions'
  },
  queues: {
    balanceUpdates: 'balance-updates',
    notifications: 'notifications',
    auditLog: 'audit-log'
  },
  connection: {
    url: process.env.RABBITMQ_URL || 'amqp://user:password@rabbitmq:5672'
  }
};
