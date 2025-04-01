/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(err, req, res, next) {
    // Log the error
    console.error('Error:', err);
    
    // Get status code (default to 500 if not set)
    const statusCode = err.statusCode || 500;
    
    // Send error response
    res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: statusCode
      }
    });
  }
  
  module.exports = errorHandler;