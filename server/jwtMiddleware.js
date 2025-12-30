const jwt = require('jsonwebtoken');

/**
 * JWT Middleware for Resident Authentication
 * Pure MySQL authentication system replacing Firebase
 */

/**
 * Verify JWT token for resident authentication
 * Checks Authorization header and validates JWT token
 */
function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Invalid token format'
      });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
      account_status: decoded.account_status
    };

    next();

  } catch (error) {
    console.error('JWT verification error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    res.status(500).json({
      error: 'Internal server error during token verification'
    });
  }
}

module.exports = {
  verifyToken
};
