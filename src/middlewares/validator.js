const { body, param, validationResult } = require('express-validator');

const validator = {
  
  updateBalance: [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    
    body('amount')
      .isFloat()
      .withMessage('Amount must be a number')
      .custom(value => {
        return !isNaN(parseFloat(value));
      })
      .withMessage('Invalid amount format'),
  ],

  /**
   * Middleware to validate the request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  validate: (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    
    next();
  }
};

module.exports = validator;