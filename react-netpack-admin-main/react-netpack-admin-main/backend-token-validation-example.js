// Example backend endpoint for token validation
// Add this to your backend server

const jwt = require('jsonwebtoken');

// Token validation endpoint - matches your loginAdmin token structure
app.post('/admin/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    const authHeader = req.headers.authorization;
    
    // Get token from body or Authorization header
    const tokenToValidate = token || (authHeader ? authHeader.replace('Bearer ', '') : null);
    
    if (!tokenToValidate) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Token is required' 
      });
    }

    // Verify token using your JWT secret - matches loginAdmin structure
    jwt.verify(tokenToValidate, process.env.JWT_ADMIN_SECRET, (err, decoded) => {
      if (err) {
        console.log('Token validation failed:', err.message);
        return res.status(401).json({ 
          valid: false, 
          message: 'Invalid token' 
        });
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Token expired' 
        });
      }

      // Verify the token structure matches your loginAdmin
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Invalid token structure' 
        });
      }

      // Token is valid - return admin info matching your loginAdmin response
      return res.status(200).json({ 
        valid: true, 
        message: 'Token is valid',
        admin: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        }
      });
    });

  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Internal server error' 
    });
  }
});

// Alternative: Middleware for protecting routes
const validateTokenMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        valid: false, 
        message: 'Authorization header required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    jwt.verify(token, process.env.JWT_ADMIN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Invalid token' 
        });
      }

      // Check expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Token expired' 
        });
      }

      // Verify token structure
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return res.status(401).json({ 
          valid: false, 
          message: 'Invalid token structure' 
        });
      }

      // Add admin info to request
      req.admin = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      next();
    });

  } catch (error) {
    console.error('Token validation middleware error:', error);
    return res.status(500).json({ 
      valid: false, 
      message: 'Internal server error' 
    });
  }
};

// Use middleware to protect routes
app.use('/admin/*', validateTokenMiddleware);
app.use('/api/*', validateTokenMiddleware);

module.exports = {
  validateTokenMiddleware
}; 