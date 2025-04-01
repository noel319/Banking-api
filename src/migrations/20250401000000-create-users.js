const config = require('../config');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index on balance
    await queryInterface.addIndex('users', ['balance']);

    // Create initial user with 10000 balance
    return queryInterface.bulkInsert('users', [{
      balance: config.initialBalance,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface) {
    return queryInterface.dropTable('users');
  }
};