const axios = require('axios');
const { performance } = require('perf_hooks');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = `http://localhost:${process.env.PORT || 3002}/api`;
// Assuming we have a way to get a token (e.g. login as admin)
// For benchmark, we might need to login first.

async function login() {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      username: 'superadmin',
      password: process.env.SEED_DEFAULT_PASSWORD || 'Admin123!'
    });
    return res.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function benchmarkEndpoint(name, url, token, iterations = 50) {
  console.log(`\n📉 Benchmarking ${name} (${iterations} reqs)...`);
  const times = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      times.push(performance.now() - start);
    } catch (e) {
      errors++;
    }
    if (i % 10 === 0) process.stdout.write('.');
  }
  
  if (times.length === 0) return;

  times.sort((a, b) => a - b);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];

  console.log(`\n✅ Results for ${name}:`);
  console.log(`   Avg: ${avg.toFixed(2)}ms`);
  console.log(`   p95: ${p95.toFixed(2)}ms`);
  console.log(`   p99: ${p99.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);
  console.log(`   Errors: ${errors}`);
}

async function run() {
  console.log('🚀 Starting AI Service Benchmarks');
  const token = await login();
  
  await benchmarkEndpoint('Dashboard Summary', `${API_URL}/ai-analytics/dashboard-summary`, token);
  await benchmarkEndpoint('Secretary Risk Analytics', `${API_URL}/ai-analytics/secretary-analytics`, token);
  // await benchmarkEndpoint('Patrol Suggestions (AI Proxy)', `${API_URL}/ai/patrol`, token, 10); // Slower, fewer iters
}

run();
