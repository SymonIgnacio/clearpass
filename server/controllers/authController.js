const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const [users] = await db.execute(
      `SELECT u.*, r.role_name, r.hierarchy_level, r.permissions 
       FROM users u 
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? AND u.is_active = TRUE`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Account not configured' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role_name,
        role_id: user.role_id,
        hierarchy_level: user.hierarchy_level
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role_name,
        role_id: user.role_id,
        email: user.email,
        full_name: user.full_name,
        hierarchy_level: user.hierarchy_level
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { username, password, email, full_name, role_id } = req.body;

    if (!username || !password || !role_id) {
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
      'INSERT INTO users (username, password_hash, email, full_name, role_id) VALUES (?, ?, ?, ?, ?)',
      [username, password_hash, email, full_name, role_id]
    );

    res.status(201).json({ success: true, message: 'User created successfully' });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

module.exports = { login, register };
