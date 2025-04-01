const app = require('./app');
const config = require('./config');
const db = require('./models');
const migrator = require('./utils/migrator');
const redis = require('./utils/redis');
const rabbitmq = require('./utils/rabbitmq');

const server = app.listen(config.port, async () => {
  try {
    
    await db.sequelize.authenticate();
    console.log('Database connection established successfully');    
  
    await rabbitmq.connect();
    console.log('RabbitMQ connection established successfully');    
   
    await migrator.migrate();
    console.log('Migrations completed successfully');
    
    console.log(`Server running on port ${config.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
     
      await rabbitmq.close();
      console.log('RabbitMQ connection closed');      
      
      await redis.close();
      console.log('Redis connection closed');      
      
      await db.sequelize.close();
      console.log('Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });  
  
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

module.exports = server; 