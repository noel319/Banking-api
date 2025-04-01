const express = require('express');
const userRoutes = require('./userRoutes');

const router = express.Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/users', userRoutes);

module.exports = router;