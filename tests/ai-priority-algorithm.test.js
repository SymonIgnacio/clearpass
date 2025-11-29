const axios = require('axios');

// Test configuration
const AI_SERVICE_URL = 'http://localhost:5000/api';
const NODE_API_URL = 'http://localhost:3001/api';

// Test data for AI algorithm
const testCases = [
  {
    name: 'Senior with low income',
    input: { monthly_income: 5000, is_senior: true, is_pwd: false, occupation: 'Retired' },
    expected: { priority: 'HIGH', score: 85, reasons: ['Senior citizen', 'Low income (< ₱10,000/month)'] }
  },
  {
    name: 'PWD with moderate income',
    input: { monthly_income: 8000, is_senior: false, is_pwd: true, occupation: 'Unemployed' },
    expected: { priority: 'HIGH', score: 80, reasons: ['Person with Disability (PWD)', 'Low income (< ₱10,000/month)'] }
  },
  {
    name: 'High income employed',
    input: { monthly_income: 25000, is_senior: false, is_pwd: false, occupation: 'Manager' },
    expected: { priority: 'LOW', score: 10, reasons: ['High income and employed'] }
  },
  {
    name: 'Moderate income unemployed',
    input: { monthly_income: 15000, is_senior: false, is_pwd: false, occupation: 'Unemployed' },
    expected: { priority: 'MEDIUM', score: 50, reasons: ['Does not meet high priority criteria'] }
  },
  {
    name: 'Senior and PWD with high income',
    input: { monthly_income: 30000, is_senior: true, is_pwd: true, occupation: 'Retired' },
    expected: { priority: 'HIGH', score: 95, reasons: ['Senior citizen', 'Person with Disability (PWD)'] }
  }
];

// Patrol suggestion test data
const patrolTestData = {
  blotter_data: [
    {
      sitio_name: 'Batia Proper',
      date_filed: new Date().toISOString().split('T')[0],
      incident_type: 'Theft',
      severity: 'High'
    },
    {
      sitio_name: 'Batia Proper',
      date_filed: new Date().toISOString().split('T')[0],
      incident_type: 'Noise Complaint',
      severity: 'Low'
    },
    {
      sitio_name: 'Batia Proper',
      date_filed: new Date().toISOString().split('T')[0],
      incident_type: 'Physical Injury',
      severity: 'Critical'
    },
    {
      sitio_name: 'Batia Proper',
      date_filed: new Date().toISOString().split('T')[0],
      incident_type: 'Vandalism',
      severity: 'Medium'
    },
    {
      sitio_name: 'Batia Proper',
      date_filed: new Date().toISOString().split('T')[0],
      incident_type: 'Disturbance',
      severity: 'Low'
    }
  ]
};

describe('AI Priority Algorithm Tests', () => {

  describe('Social Aid Prioritizer Tests', () => {

    test.each(testCases)('✅ $name → $expected.priority priority', async ({ name, input, expected }) => {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/suggest-aid`, input);
        expect(response.status).toBe(200);

        const result = response.data;
        expect(result.priority).toBe(expected.priority);
        expect(result.score).toBeGreaterThanOrEqual(expected.score - 5); // Allow some variance
        expect(result.score).toBeLessThanOrEqual(expected.score + 5);

        // Check that expected reasons are included
        for (const reason of expected.reasons) {
          expect(result.reasons.some(r => r.includes(reason.split(' ')[0]))).toBe(true);
        }

        console.log(`✅ PASS: ${name} → ${result.priority} priority (Score: ${result.score})`);
      } catch (error) {
        console.error(`❌ FAIL: ${name} - ${error.message}`);
        throw error;
      }
    });

    test('✅ Handles invalid input gracefully', async () => {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/suggest-aid`, {});
        expect(response.status).toBe(400);
        console.log('✅ PASS: Handles invalid input gracefully');
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log('✅ PASS: Handles invalid input gracefully');
        } else {
          throw error;
        }
      }
    });

  });

  describe('Predictive Policing Tests', () => {

    test('✅ High risk area (>5 incidents) gets max patrol', async () => {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/suggest-patrol`, patrolTestData);
        expect(response.status).toBe(200);

        const result = response.data;
        expect(result.overall_risk_level).toBe('High');
        expect(result.hotspot_area).toBe('Batia Proper');
        expect(result.max_incidents).toBe(5);

        // Check that Batia Proper gets high patrol recommendation
        const batiaProper = result.patrol_suggestions['Batia Proper'];
        expect(batiaProper.incidents_this_week).toBe(5);
        expect(batiaProper.risk_level).toBe('High');
        expect(batiaProper.patrol_suggestion).toBe('Deploy 4 Tanods + Roving Patrol');

        console.log('✅ PASS: High risk area gets max patrol deployment');
      } catch (error) {
        console.error('❌ FAIL: High risk patrol test -', error.message);
        throw error;
      }
    });

    test('✅ No incidents returns standard patrol', async () => {
      try {
        const emptyData = { blotter_data: [] };
        const response = await axios.post(`${AI_SERVICE_URL}/suggest-patrol`, emptyData);
        expect(response.status).toBe(200);

        const result = response.data;
        expect(result.overall_risk_level).toBe('Low');
        expect(result.hotspot_area).toBeNull();

        const defaultSuggestion = result.patrol_suggestions['All Areas'];
        expect(defaultSuggestion.risk_level).toBe('Low');
        expect(defaultSuggestion.patrol_suggestion).toContain('Standard Patrol');

        console.log('✅ PASS: No incidents returns standard patrol');
      } catch (error) {
        console.error('❌ FAIL: No incidents patrol test -', error.message);
        throw error;
      }
    });

    test('✅ Medium risk (2-4 incidents) gets moderate patrol', async () => {
      try {
        const mediumRiskData = {
          blotter_data: [
            {
              sitio_name: 'Northville 5',
              date_filed: new Date().toISOString().split('T')[0],
              incident_type: 'Disturbance',
              severity: 'Low'
            },
            {
              sitio_name: 'Northville 5',
              date_filed: new Date().toISOString().split('T')[0],
              incident_type: 'Noise Complaint',
              severity: 'Low'
            }
          ]
        };

        const response = await axios.post(`${AI_SERVICE_URL}/suggest-patrol`, mediumRiskData);
        expect(response.status).toBe(200);

        const result = response.data;
        const northville = result.patrol_suggestions['Northville 5'];
        expect(northville.incidents_this_week).toBe(2);
        expect(northville.risk_level).toBe('Medium');
        expect(northville.patrol_suggestion).toBe('Deploy 2 Tanods');

        console.log('✅ PASS: Medium risk gets moderate patrol deployment');
      } catch (error) {
        console.error('❌ FAIL: Medium risk patrol test -', error.message);
        throw error;
      }
    });

  });

  describe('Node.js AI Integration Tests', () => {

    let testResidentId = null;

    beforeAll(async () => {
      // Create a test resident for integration tests
      try {
        const residentData = {
          first_name: 'AI',
          last_name: 'Test',
          middle_name: '',
          age: 25,
          gender: 'Male',
          sitio_id: 1,
          is_senior: false,
          is_pwd: false,
          is_single_parent: false,
          employment_status: 'Test Job',
          monthly_income: 15000
        };

        const response = await axios.post(`${NODE_API_URL}/residents`, residentData);
        testResidentId = response.data.id;
        console.log('✅ Integration test resident created');
      } catch (error) {
        console.error('❌ Failed to create integration test resident:', error.message);
      }
    });

    afterAll(async () => {
      // Cleanup test resident
      if (testResidentId) {
        try {
          await axios.delete(`${NODE_API_URL}/residents/${testResidentId}`);
          console.log('✅ Integration test resident cleaned up');
        } catch (error) {
          console.error('❌ Failed to cleanup integration test resident:', error.message);
        }
      }
    });

    test('✅ Node.js AI priority endpoint works', async () => {
      try {
        const response = await axios.post(`${NODE_API_URL}/ai/priority`, {
          resident_id: testResidentId
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('priority');
        expect(response.data).toHaveProperty('score');
        expect(response.data).toHaveProperty('reasons');
        expect(response.data.resident_name).toBe('AI Test');

        console.log('✅ PASS: Node.js AI priority endpoint integration');
      } catch (error) {
        console.error('❌ FAIL: Node.js AI priority endpoint -', error.message);
        throw error;
      }
    });

    test('✅ Node.js AI patrol suggestions endpoint works', async () => {
      try {
        const response = await axios.get(`${NODE_API_URL}/ai/patrol-suggestions`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('overall_risk_level');
        expect(response.data).toHaveProperty('patrol_suggestions');
        expect(response.data).toHaveProperty('analysis_period');

        console.log('✅ PASS: Node.js AI patrol suggestions endpoint integration');
      } catch (error) {
        console.error('❌ FAIL: Node.js AI patrol suggestions endpoint -', error.message);
        throw error;
      }
    });

  });

});
