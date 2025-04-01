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
    glob: path.join(__dirname, '../migrations/*.js'), // Updated pattern
    resolve: ({ name, path: migrationPath }) => {
      const migration = require(migrationPath);
      return {
        name,
        up: async () => migration.up(sequelize.getQueryInterface(), Sequelize),
        down: async () => migration.down(sequelize.getQueryInterface(), Sequelize)
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
});

// Run migrations
async function migrate() {
  try {
    // Verify migrations path exists (debugging)
    const fs = require('fs');
    const migrationsPath = path.join(__dirname, '../migrations');
    if (!fs.existsSync(migrationsPath)) {
      throw new Error(`Migrations directory not found at: ${migrationsPath}`);
    }
    console.log(`Using migrations from: ${migrationsPath}`);

    const migrations = await umzug.up();
    console.log('Migrations executed successfully:', 
      migrations.map(m => m.name));
    
    return migrations;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export the migration function
module.exports = {
  migrate,
  sequelize
};