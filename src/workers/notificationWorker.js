const rabbitmq = require('../utils/rabbitmq');
const config = require('../config/rabbitmq');

// Track active state for graceful shutdown
let isRunning = false;
let currentConsumer = null;

/**
 * Notification worker that consumes messages from the notification queue
 * and processes them (e.g., sending emails, push notifications)
 */
async function startNotificationWorker(maxRetries = 5, retryDelay = 5000) {
  if (isRunning) {
    console.log('Worker is already running');
    return;
  }

  try {
    isRunning = true;
    console.log('Starting notification worker...');
    
    // Verify RabbitMQ connection first
    await ensureRabbitMQConnection(maxRetries, retryDelay);
    
    currentConsumer = await rabbitmq.consume(
      config.queues.notifications, 
      messageHandler,
      { noAck: false } // Ensure manual acknowledgment
    );
    
    console.log('Notification worker started and listening for messages');
  } catch (error) {
    console.error('Error starting notification worker:', error);
    isRunning = false;
    
    // Exponential backoff for retries
    const delay = Math.min(retryDelay * 2, 30000); // Cap at 30s
    console.log(`Retrying in ${delay/1000} seconds...`);
    setTimeout(() => startNotificationWorker(maxRetries, delay), delay);
  }
}

async function messageHandler(message) {
  try {
    console.log('Processing notification:', message);
    
    const { userId, type, data } = message;
    
    if (type === 'balance_update') {
      console.log(`Balance update notification for user ${userId}: new balance = ${data.newBalance}`);
      
      // Simulate notification processing      
      
      console.log(`Notification for user ${userId} sent successfully`);
    }
    
    // Acknowledge message only after successful processing
    message.ack();
  } catch (error) {
    console.error('Error processing notification message:', error);
    // Negative acknowledgment - can choose to requeue or not
    message.nack(false); // false = don't requeue
  }
}

async function ensureRabbitMQConnection(maxRetries, retryDelay) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await rabbitmq.connect(); // Ensure you have this method in rabbitmq.js
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`RabbitMQ connection attempt ${attempt} failed, retrying...`);      
    }
  }
}

async function stopNotificationWorker() {
  if (!isRunning) return;
  
  isRunning = false;
  console.log('Stopping notification worker...');
  
  if (currentConsumer) {
    await currentConsumer.cancel();
    currentConsumer = null;
  }
  
  console.log('Notification worker stopped');
}

// Handle graceful shutdown
process.on('SIGTERM', stopNotificationWorker);
process.on('SIGINT', stopNotificationWorker);

// Allow this to be started directly or imported
if (require.main === module) {
  startNotificationWorker();
} else {
  module.exports = { 
    startNotificationWorker,
    stopNotificationWorker
  };
}