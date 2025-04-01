const { User, sequelize } = require('../models');

class UserService {
  /**
   * Get user by ID
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} - The user object
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  /**
   * Update user balance - the critical method for handling concurrent updates
   * @param {number} userId - The user ID
   * @param {number} amount - The amount to add (positive) or subtract (negative)
   * @returns {Promise<Object>} - The updated user object
   */
  async updateBalance(userId, amount) {
    // Start a database transaction
    const transaction = await sequelize.transaction();

    try {
      // Get the current user with a row lock
      const user = await User.findByPk(userId, { 
        transaction,
        lock: true 
      });

      if (!user) {
        await transaction.rollback();
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Calculate new balance
      const newBalance = parseFloat(user.balance) + amount;
      
      // Check for negative balance and reject if necessary
      if (newBalance < 0) {
        await transaction.rollback();
        const error = new Error('Insufficient funds');
        error.statusCode = 400;
        throw error;
      }

      // Update the balance using the optimized update method
      // This is much more efficient than user.update() for concurrent operations
      const [updatedRows] = await User.update(
        { 
          balance: newBalance,
          updatedAt: new Date()
        },
        { 
          where: { 
            id: userId,
            // Use optimistic locking to ensure we're updating the same record we checked
            balance: user.balance
          },
          transaction
        }
      );

      // If no rows were updated, another transaction updated the user balance
      if (updatedRows === 0) {
        await transaction.rollback();
        const error = new Error('Balance was modified by another transaction');
        error.statusCode = 409;
        throw error;
      }

      // Get the updated user
      const updatedUser = await User.findByPk(userId, { 
        transaction 
      });
      
      // Commit the transaction
      await transaction.commit();
      
      return updatedUser;
    } catch (error) {
      // Rollback transaction if not already done
      if (transaction) {
        await transaction.rollback();
      }
      
      // Rethrow the error with proper status code
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }
}

module.exports = new UserService();