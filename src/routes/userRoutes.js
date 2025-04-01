const express = require('express');
const userController = require('../controllers/userController');
const validator = require('../middlewares/validator');

const router = express.Router();

/**
 * @route GET /users/:userId
 * @description Get user by ID
 * @access Public
 */
router.get('/:userId', userController.getUser);

/**
 * @route PUT /users/:userId/balance
 * @description Update user balance
 * @access Public
 */
router.put(
  '/:userId/balance',
  validator.updateBalance,
  validator.validate,
  userController.updateBalance
);

module.exports = router;