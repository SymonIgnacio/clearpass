const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Seeding database with sample data...');

try {
  // Change to server directory
  process.chdir(path.join(__dirname, '..', 'server'));
  
  // Run migrations first
  console.log('📊 Running database migrations...');
  execSync('npx knex migrate:latest', { stdio: 'inherit' });
  
  // Run seeds
  console.log('🌱 Running database seeds...');
  execSync('npx knex seed:run', { stdio: 'inherit' });
  
  console.log('✅ Database seeded successfully!');
  console.log('📈 Dashboard should now show actual data instead of zeros.');
  
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  process.exit(1);
}