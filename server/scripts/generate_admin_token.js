const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('Error: JWT_SECRET not found in environment variables.');
  process.exit(1);
}

const adminPayload = {
  id: 1,
  username: 'admin',
  role: 1, // IT Admin
  role_name: 'IT Admin',
  mfa_verified: true
};

const token = jwt.sign(adminPayload, secret, { expiresIn: '1h' });
console.log(token);
