const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { createErrorResponse, createSuccessResponse } = require('../middleware/errorHandler');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json(createErrorResponse('Username and password required', 400));
    }

    if (username.length > 50 || password.length > 100) {
      return res.status(400).json(createErrorResponse('Invalid input length', 400));
    }

    // CLEARPASS: Use role column directly (Database Aligned)
    const [users] = await db.execute(
      `SELECT u.*, 
        CASE u.role 
          WHEN 1 THEN 'IT Admin'
          WHEN 2 THEN 'Captain'
          WHEN 3 THEN 'Secretary'
          WHEN 4 THEN 'Clerk'
          WHEN 6 THEN 'Blotter Officer'
          WHEN 12 THEN 'Resident'
        END as role_name
       FROM users u 
       WHERE u.username = ? AND u.is_active = TRUE`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }

    const user = users[0];
    
    if (!user.password_hash) {
      return res.status(401).json(createErrorResponse('Account not configured', 401));
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json(createErrorResponse('Server configuration error', 500));
    }

    // CLEARPASS: JWT with role (Database Aligned)
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,  // Database hierarchy (2,3,4,5,6,12)
        role_name: user.role_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Set httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,  // THEMIS hierarchy (1-6)
        role_name: user.role_name,
        email: user.email,
        full_name: user.full_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed', 500));
  }
};

const register = async (req, res) => {
  try {
    const { username, password, email, full_name, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role required' });
    }

    const [existing] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await db.execute(
      'INSERT INTO users (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, password_hash, email, full_name, role]
    );

    res.status(201).json({ success: true, message: 'User created successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const logout = async (req, res) => {
  try {
    // Clear the httpOnly cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const me = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // CLEARPASS: Use role column (Database Aligned)
    const [users] = await db.execute(
      `SELECT u.*, 
        CASE u.role 
          WHEN 1 THEN 'IT Admin'
          WHEN 2 THEN 'Captain'
          WHEN 3 THEN 'Secretary'
          WHEN 4 THEN 'Clerk'
          WHEN 6 THEN 'Blotter Officer'
          WHEN 12 THEN 'Resident'
        END as role_name
       FROM users u 
       WHERE u.id = ? AND u.is_active = TRUE`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,  // THEMIS hierarchy (1-6)
        role_name: user.role_name,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
};

module.exports = { login, register, logout, me };
