const rabbitmq = require('../utils/rabbitmq');
const config = require('../config/rabbitmq');

/**
 * Notification worker that consumes messages from the notification queue
 * and processes them (e.g., sending emails, push notifications)
 */
async function startNotificationWorker() {
  try {
    console.log('Starting notification worker...');
    
    await rabbitmq.consume(config.queues.notifications, async (message) => {
      try {
        console.log('Processing notification:', message);
        
        // In a real application, this would send an actual notification
        // For example, an email, SMS, or push notification
        const { userId, type, data } = message;
        
        if (type === 'balance_update') {
          // In a real application, you'd send a notification to the user
          console.log(`Balance update notification for user ${userId}: new balance = ${data.newBalance}`);
          
          // Simulate sending notification
          await new Promise(resolve => setTimeout(resolve, 50));
          
          console.log(`Notification for user ${userId} sent successfully`);
        }
      } catch (error) {
        console.error('Error processing notification message:', error);
      }
    });
    
    console.log('Notification worker started and listening for messages');
  } catch (error) {
    console.error('Error starting notification worker:', error);
    
    // Try to restart after 5 seconds
    setTimeout(startNotificationWorker, 5000);
  }
}

// Allow this to be started directly or imported
if (require.main === module) {
  startNotificationWorker();
} else {
  module.exports = { startNotificationWorker };
}