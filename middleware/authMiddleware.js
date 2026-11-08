// middleware/authMiddleware.js - Express middleware to verify JWT auth cookies and protect user routes
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'modern_todo_pbl_super_secret_jwt_key_2026';

// Extracts and verifies JWT from HTTP-only cookie or Bearer header to authenticate requests.
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: 'Invalid authentication session.',
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.clearCookie('authToken');
      return res.status(401).json({
        error: 'User account not found. Please log in again.',
      });
    }

    if (!user.isVerified) {
      res.clearCookie('authToken');
      return res.status(403).json({
        error: 'Please verify your email address to continue.',
      });
    }

    req.userId = user._id;
    req.user = user;

    next();
  } catch (error) {
    console.error('Session authentication error:', error.message);
    res.clearCookie('authToken');
    return res.status(401).json({
      error: 'Session expired or invalid. Please log in again.',
    });
  }
};
