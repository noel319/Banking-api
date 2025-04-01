const path = require('path');
const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const config = require('../config').database;

// Initialize sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Configure Umzug for migrations
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../migrations'),
    params: [
      sequelize.getQueryInterface(),
      Sequelize
    ]
  },
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Run migrations
async function migrate() {
  try {
    const migrations = await umzug.up();
    console.log('Migrations executed successfully:', 
      migrations.map(m => m.name));
    
    // Close connection after successful migration
    await sequelize.close();
    return migrations;
  } catch (error) {
    console.error('Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Export the migration function
module.exports = {
  migrate,
  sequelize
};