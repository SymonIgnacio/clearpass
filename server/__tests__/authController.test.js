const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authController = require('../authController');

// Mock database
jest.mock('../database', () => ({
  query: jest.fn(),
  getConnection: jest.fn(() => ({
    execute: jest.fn(),
    release: jest.fn()
  }))
}));

const db = require('../database');

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn()
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.get('/api/auth/profile', authController.getProfile);

describe('Authentication Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      // Mock database response
      const mockUser = {
        id: 1,
        username: 'captain',
        password_hash: 'hashed_password',
        role: 'captain',
        full_name: 'Juan Dela Cruz',
        is_active: true
      };

      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_jwt_token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'captain',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('captain');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE username = ? AND is_active = true',
        ['captain']
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
    });

    test('should reject login with invalid username', async () => {
      db.query.mockResolvedValue([[]]); // No user found

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject login with wrong password', async () => {
      const mockUser = {
        id: 1,
        username: 'captain',
        password_hash: 'hashed_password'
      };

      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(false); // Wrong password

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'captain',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject login for inactive user', async () => {
      const mockUser = {
        id: 1,
        username: 'captain',
        password_hash: 'hashed_password',
        is_active: false
      };

      db.query.mockResolvedValue([[mockUser]]);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'captain',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Account is inactive');
    });

    test('should handle database errors', async () => {
      db.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'captain',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({}); // Missing username and password

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn()
      };

      db.getConnection.mockResolvedValue(mockConnection);
      mockConnection.execute.mockResolvedValue([{ insertId: 1 }]);
      bcrypt.hash.mockResolvedValue('hashed_new_password');

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'newpassword123',
          role: 'clerk',
          full_name: 'New User',
          email: 'new@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user_id', 1);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    test('should reject registration with existing username', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        release: jest.fn(),
        rollback: jest.fn()
      };

      db.getConnection.mockResolvedValue(mockConnection);
      // First query checks for existing user - returns existing user
      mockConnection.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) // User exists
        .mockResolvedValueOnce(); // Second call not reached

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'captain', // Existing username
          password: 'password123',
          role: 'clerk'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username already exists');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    test('should validate required fields for registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser'
          // Missing password and role
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should return user profile when authenticated', async () => {
      const mockUser = {
        id: 1,
        username: 'captain',
        full_name: 'Juan Dela Cruz',
        role: 'captain',
        email: 'captain@example.com'
      };

      db.query.mockResolvedValue([[mockUser]]);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('captain');
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, username, full_name, role, email, contact_number, last_login, created_at FROM users WHERE id = ?',
        [1]
      );
    });

    test('should handle database errors in profile fetch', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer mock_token');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });
});
