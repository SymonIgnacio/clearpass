const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Test data
const testResident = {
  first_name: 'Test',
  last_name: 'Resident',
  middle_name: '',
  age: 30,
  gender: 'Male',
  sitio_id: 1,
  is_senior: false,
  is_pwd: false,
  is_single_parent: false,
  employment_status: 'Test Job',
  monthly_income: 5000
};

const testBlotterCase = {
  complainant_name: 'Test Complainant',
  respondent_id: null, // Will be set after resident creation
  respondent_name: 'Test Respondent',
  incident_type: 'Test Incident',
  location: 'Test Location',
  sitio_id: 1,
  description: 'Test incident for business rule validation',
  status: 'Pending',
  severity: 'Low',
  reported_by: 'Test Officer'
};

let testResidentId = null;
let testBlotterId = null;

describe('Critical Business Rule Tests', () => {

  beforeAll(async () => {
    // Setup test data
    try {
      // Create test resident
      const residentResponse = await axios.post(`${API_BASE_URL}/residents`, testResident);
      testResidentId = residentResponse.data.id;

      // Create test blotter case with pending status
      testBlotterCase.respondent_id = testResidentId;
      const blotterResponse = await axios.post(`${API_BASE_URL}/blotter`, testBlotterCase);
      testBlotterId = blotterResponse.data.id;

      console.log('✅ Test data setup complete');
    } catch (error) {
      console.error('❌ Failed to setup test data:', error.message);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    try {
      if (testBlotterId) {
        await axios.delete(`${API_BASE_URL}/blotter/${testBlotterId}`);
      }
      if (testResidentId) {
        await axios.delete(`${API_BASE_URL}/residents/${testResidentId}`);
      }
      console.log('✅ Test data cleanup complete');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error.message);
    }
  });

  describe('Certificate-Blotter Integration Tests', () => {

    test('❌ Resident with active blotter CANNOT get clearance', async () => {
      const certificateData = {
        resident_id: testResidentId,
        certificate_type: 'Barangay Clearance',
        purpose: 'Test certificate with active blotter case'
      };

      try {
        await axios.post(`${API_BASE_URL}/certificates`, certificateData);
        throw new Error('Expected certificate issuance to be blocked');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('BLOCK ISSUANCE');
        expect(error.response.data.details.activeCases).toBeGreaterThan(0);
        console.log('✅ PASS: Certificate blocked for resident with active blotter');
      }
    });

    test('✅ Resident with resolved blotter CAN get clearance', async () => {
      // First resolve the blotter case
      await axios.put(`${API_BASE_URL}/blotter/${testBlotterId}`, {
        status: 'Resolved',
        resolution: 'Case resolved for testing'
      });

      const certificateData = {
        resident_id: testResidentId,
        certificate_type: 'Barangay Clearance',
        purpose: 'Test certificate after blotter resolution'
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/certificates`, certificateData);
        expect(response.status).toBe(201);
        expect(response.data.certificate_number).toBeDefined();

        // Cleanup: delete the created certificate
        const certResponse = await axios.get(`${API_BASE_URL}/certificates`);
        const testCert = certResponse.data.find(c => c.purpose === 'Test certificate after blotter resolution');
        if (testCert) {
          await axios.delete(`${API_BASE_URL}/certificates/${testCert.id}`);
        }

        console.log('✅ PASS: Certificate issued after blotter resolution');
      } catch (error) {
        throw new Error('Expected certificate issuance to succeed after blotter resolution');
      }
    });

    test('✅ Warning message displays correctly', async () => {
      // Reset blotter to pending status
      await axios.put(`${API_BASE_URL}/blotter/${testBlotterId}`, {
        status: 'Pending'
      });

      const certificateData = {
        resident_id: testResidentId,
        certificate_type: 'Barangay Clearance',
        purpose: 'Test warning message display'
      };

      try {
        await axios.post(`${API_BASE_URL}/certificates`, certificateData);
      } catch (error) {
        expect(error.response.data.error).toBe('BLOCK ISSUANCE: Active blotter case found for this resident');
        expect(error.response.data.details.message).toContain('pending blotter cases');
        console.log('✅ PASS: Warning message displays correctly');
      }
    });

    test('✅ Other certificate types also check blotter', async () => {
      const certificateTypes = ['Certificate of Residency', 'Certificate of Indigency'];

      for (const certType of certificateTypes) {
        const certificateData = {
          resident_id: testResidentId,
          certificate_type: certType,
          purpose: `Test ${certType} with active blotter`
        };

        try {
          await axios.post(`${API_BASE_URL}/certificates`, certificateData);
          throw new Error(`Expected ${certType} to be blocked`);
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toContain('BLOCK ISSUANCE');
          console.log(`✅ PASS: ${certType} also blocked by active blotter`);
        }
      }
    });

  });

  describe('Blotter Status Updates Tests', () => {

    test('✅ Can create blotter with "Pending" status', async () => {
      const newBlotterData = {
        complainant_name: 'Status Test Complainant',
        respondent_name: 'Status Test Respondent',
        incident_type: 'Status Test Incident',
        location: 'Status Test Location',
        sitio_id: 1,
        description: 'Test blotter for status updates',
        status: 'Pending',
        severity: 'Low',
        reported_by: 'Status Test Officer'
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/blotter`, newBlotterData);
        expect(response.status).toBe(201);
        expect(response.data.status).toBe('Pending');

        // Cleanup
        await axios.delete(`${API_BASE_URL}/blotter/${response.data.id}`);
        console.log('✅ PASS: Can create blotter with "Pending" status');
      } catch (error) {
        throw new Error('Failed to create blotter with Pending status');
      }
    });

    test('✅ Can update status to "Forwarded to Lupon"', async () => {
      try {
        const response = await axios.put(`${API_BASE_URL}/blotter/${testBlotterId}`, {
          status: 'Forwarded to Lupon',
          resolution: 'Forwarded to Lupon for mediation'
        });

        expect(response.status).toBe(200);

        // Verify status was updated
        const getResponse = await axios.get(`${API_BASE_URL}/blotter`);
        const updatedBlotter = getResponse.data.find(b => b.id === testBlotterId);
        expect(updatedBlotter.status).toBe('Forwarded to Lupon');

        console.log('✅ PASS: Can update status to "Forwarded to Lupon"');
      } catch (error) {
        throw new Error('Failed to update blotter status');
      }
    });

    test('✅ Status change reflects in certificate checks', async () => {
      // First ensure status is "Forwarded to Lupon" (should still block)
      await axios.put(`${API_BASE_URL}/blotter/${testBlotterId}`, {
        status: 'Forwarded to Lupon'
      });

      const certificateData = {
        resident_id: testResidentId,
        certificate_type: 'Barangay Clearance',
        purpose: 'Test status change reflection'
      };

      try {
        await axios.post(`${API_BASE_URL}/certificates`, certificateData);
        throw new Error('Expected certificate to be blocked');
      } catch (error) {
        expect(error.response.data.error).toContain('BLOCK ISSUANCE');
        console.log('✅ PASS: Status change reflects in certificate checks');
      }
    });

  });

});
