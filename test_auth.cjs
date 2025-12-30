// Test file to check if authController loads properly
const authController = require('./server/authController');
console.log('✅ authController loaded successfully');
console.log('Available functions:', Object.keys(authController));
console.log('register function:', typeof authController.register);
