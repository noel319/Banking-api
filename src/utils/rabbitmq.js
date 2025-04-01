const amqp = require('amqplib');
const config = require('../config/rabbitmq');

let connection = null;
let channel = null;

const rabbitmq = {
  /**
   * Connect to RabbitMQ
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      if (!connection) {
        connection = await amqp.connect(config.url);        
        
        connection.on('error', (error) => {
          console.error('RabbitMQ connection error:', error);
          setTimeout(() => this.connect(), 5000);
        });        
        
        connection.on('close', () => {
          console.log('RabbitMQ connection closed, reconnecting...');
          setTimeout(() => this.connect(), 5000);
        });
        
        console.log('Connected to RabbitMQ');
      }
      
      if (!channel) {
        channel = await connection.createChannel();        
        
        await channel.assertExchange(config.exchanges.transactions, 'topic', { durable: true });   
        
        await channel.assertQueue(config.queues.balanceUpdates, { durable: true });
        await channel.assertQueue(config.queues.notifications, { durable: true });
        await channel.assertQueue(config.queues.auditLog, { durable: true });        
        
        await channel.bindQueue(config.queues.balanceUpdates, config.exchanges.transactions, 'balance.update');
        await channel.bindQueue(config.queues.notifications, config.exchanges.transactions, 'balance.updated');
        await channel.bindQueue(config.queues.auditLog, config.exchanges.transactions, '#');
        
        console.log('RabbitMQ channel created and exchanges/queues configured');
      }
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);     
      setTimeout(() => this.connect(), 5000);
    }
  },
  
  /**
   * Publish message to an exchange
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key
   * @param {Object} message - Message to publish
   * @param {Object} [options={}] - Publishing options
   * @returns {Promise<boolean>} - Success or failure
   */
  async publish(exchange, routingKey, message, options = {}) {
    try {
      if (!channel) {
        await this.connect();
      }
      
      return channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true, ...options }
      );
    } catch (error) {
      console.error('Failed to publish message:', error);
      return false;
    }
  },
  
  /**
   * Consume messages from a queue
   * @param {string} queue - Queue name
   * @param {Function} callback - Callback function
   * @param {Object} [options={}] - Consuming options
   * @returns {Promise<string>} - Consumer tag
   */
  async consume(queue, callback, options = {}) {
    try {
      if (!channel) {
        await this.connect();
      }
      
      return channel.consume(queue, (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          callback(content, msg);
          channel.ack(msg);
        }
      }, options);
    } catch (error) {
      console.error(`Failed to consume from queue ${queue}:`, error);
      throw error;
    }
  },
  
  /**
   * Close RabbitMQ connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (channel) {
        await channel.close();
        channel = null;
      }
      
      if (connection) {
        await connection.close();
        connection = null;
      }
      
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
};

rabbitmq.connect();

module.exports = rabbitmq;