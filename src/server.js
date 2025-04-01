const app = require('./app');
const config = require('./config');
const db = require('./models');
const migrator = require('./utils/migrator');

// Start server
const server = app.listen(config.port, async () => {
  try {
    // Connect to database
    await db.sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Run migrations
    await migrator.migrate();
    console.log('Migrations completed successfully');
    
    console.log(`Server running on port ${config.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await db.sequelize.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

module.exports = server; // Export for testing