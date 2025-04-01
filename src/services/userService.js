const { User, sequelize } = require('../models');
const redis = require('../utils/redis');
const rabbitmq = require('../utils/rabbitmq');
const config = require('../config/rabbitmq');

class UserService {
  /**
   * Get user by ID with Redis caching
   * @param {number} userId - User ID to fetch
   * @returns {Promise<Object>} - User object
   * @throws {Error} - If user not found
   */
  async getUserById(userId) {   
    const cacheKey = `user:${userId}`;
    const cachedUser = await redis.get(cacheKey);
    
    if (cachedUser) {
      return cachedUser;
    }
    
    // If not in cache, fetch from database
    const user = await User.findByPk(userId);
    
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Store in cache for future requests
    await redis.set(cacheKey, user.toJSON());
    
    return user;
  }

  /**
   * Update user balance with optimistic locking, Redis cache and RabbitMQ events
   * @param {number} userId - User ID to update
   * @param {number} amount - Amount to add (positive) or subtract (negative)
   * @returns {Promise<Object>} - Updated user object
   * @throws {Error} - If user not found or balance would become negative
   */
  async updateBalance(userId, amount) {
    let transaction;
    const cacheKey = `user:${userId}`;

    try {
      transaction = await sequelize.transaction();
     
      const user = await User.findByPk(userId, { 
        lock: transaction.LOCK.UPDATE,
        transaction 
      });

      if (!user) {
        await transaction.rollback();
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      // Calculate new balance
      const currentBalance = parseFloat(user.balance);
      const newBalance = currentBalance + parseFloat(amount);
      
      // Check for negative balance and reject if necessary
      if (newBalance < 0) {
        await transaction.rollback();
        const error = new Error('Insufficient funds');
        error.statusCode = 400;
        throw error;
      }

      // Publish pre-update event (for audit logging)
      await rabbitmq.publish(
        config.exchanges.transactions, 
        'balance.update',
        {
          type: 'balance_update_requested',
          userId,
          data: {
            currentBalance,
            requestedAmount: amount,
            requestedNewBalance: newBalance,
            timestamp: new Date().toISOString()
          }
        }
      );

      // Update the balance using the direct update method for optimal performance
      await User.update(
        { 
          balance: newBalance,
          updatedAt: new Date()
        },
        { 
          where: { 
            id: userId
          },
          transaction
        }
      );

        const updatedUser = await User.findByPk(userId, { 
        transaction 
      });
      
      await transaction.commit();
      
      await redis.del(cacheKey);
      
      // Publish post-update event for notifications and audit logging
      await rabbitmq.publish(
        config.exchanges.transactions, 
        'balance.updated',
        {
          type: 'balance_update',
          userId,
          data: {
            previousBalance: currentBalance,
            amount,
            newBalance: parseFloat(updatedUser.balance),
            timestamp: new Date().toISOString()
          }
        }
      );
      
      return updatedUser;
    } catch (error) {      
      if (transaction) {
        await transaction.rollback();
      }
      
      // Publish failure event for audit logging
      await rabbitmq.publish(
        config.exchanges.transactions, 
        'balance.update.failed',
        {
          type: 'balance_update_failed',
          userId,
          data: {
            requestedAmount: amount,
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      );
      
      // Rethrow the error with proper status code
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      throw error;
    }
  }
}

module.exports = new UserService();