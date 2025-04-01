const rabbitmq = require('../utils/rabbitmq');
const config = require('../config/rabbitmq');

/**
 * Audit worker that consumes messages from the audit queue
 * and logs them for compliance and security purposes
 */
async function startAuditWorker() {
  try {
    console.log('Starting audit worker...');
    
    await rabbitmq.consume(config.queues.auditLog, async (message) => {
      try {
        // In a real application, this would write to a secure audit log
        // For demonstration, we'll just log to console
        console.log('AUDIT LOG:', {
          timestamp: new Date().toISOString(),
          messageType: message.type,
          data: message.data,
          userId: message.userId
        });
        
        // In a production environment, you would write to a database or file
        // await AuditLog.create({
        //   eventType: message.type,
        //   userId: message.userId,
        //   data: JSON.stringify(message.data),
        //   timestamp: new Date()
        // });
      } catch (error) {
        console.error('Error processing audit log message:', error);
      }
    });
    
    console.log('Audit worker started and listening for messages');
  } catch (error) {
    console.error('Error starting audit worker:', error);
    
    // Try to restart after 5 seconds
    setTimeout(startAuditWorker, 5000);
  }
}

// Allow this to be started directly or imported
if (require.main === module) {
  startAuditWorker();
} else {
  module.exports = { startAuditWorker };
}