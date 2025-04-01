const userService = require('../services/userService');

class UserController {
  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getUser(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await userService.getUserById(userId);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user balance
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateBalance(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const amount = parseFloat(req.body.amount);
      
      const updatedUser = await userService.updateBalance(userId, amount);
      
      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          balance: updatedUser.balance,
          updatedAt: updatedUser.updatedAt
        },
        message: 'Balance updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();