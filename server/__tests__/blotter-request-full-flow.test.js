const request = require('supertest');
const {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  test,
  expect,
} = require('@jest/globals');

const db = require('../../server/database');

const TEST_RESIDENT_ID = 'TEST-RES-001';
const TEST_OFFICER_ID = 1;
let server;
let authToken;

describe('Blotter Request Flow - Resident to Admin', () => {
  beforeAll(async () => {
    await db.execute(`DELETE FROM blotter_requests WHERE complainant_resident_id = ?`, [
      TEST_RESIDENT_ID,
    ]);
    await db.execute(`DELETE FROM blotter WHERE complainant_resident_id = ?`, [TEST_RESIDENT_ID]);
    await db.execute(
      `DELETE FROM blotter_request_audits WHERE request_id IN (SELECT id FROM blotter_requests WHERE complainant_resident_id = ?)`,
      [TEST_RESIDENT_ID]
    );

    const [existingUser] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [
      TEST_RESIDENT_ID,
    ]);

    if (!existingUser.length) {
      await db.execute(
        `INSERT INTO users (id, username, password, role, resident_id, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [999, 'test-resident', '$2b$10$dummyhashedpassword', 12, TEST_RESIDENT_ID]
      );
    }

    await db.execute(
      `INSERT INTO residents (Resident_ID, First_Name, Last_Name, Mobile_Number, Email, Household_ID, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE Resident_ID = Resident_ID`,
      [TEST_RESIDENT_ID, 'Test', 'Resident', '09171234567', 'test@example.com', 'HH-001']
    );

    server = require('../../server');
  });

  afterAll(async () => {
    await db.execute(`DELETE FROM blotter_requests WHERE complainant_resident_id = ?`, [
      TEST_RESIDENT_ID,
    ]);
    await db.execute(`DELETE FROM blotter WHERE complainant_resident_id = ?`, [TEST_RESIDENT_ID]);
    await db.execute(
      `DELETE FROM blotter_request_audits WHERE request_id IN (SELECT id FROM blotter_requests WHERE complainant_resident_id = ?)`,
      [TEST_RESIDENT_ID]
    );
    await db.execute(`DELETE FROM residents WHERE Resident_ID = ?`, [TEST_RESIDENT_ID]);
    await db.execute(`DELETE FROM users WHERE id = 999`, [999]);

    if (server && server.close) {
      server.close();
    }
  });

  beforeEach(async () => {
    await db.execute(`DELETE FROM blotter_requests WHERE complainant_resident_id = ?`, [
      TEST_RESIDENT_ID,
    ]);

    const loginRes = await request(server).post('/api/auth/login').send({
      username: 'test-resident',
      pin_code: '123456',
      device_id: 'test-device',
    });

    authToken = loginRes.body.data?.authToken;
  });

  afterEach(() => {
    authToken = null;
  });

  describe('Step 1: Resident Submits Blotter Request', () => {
    test('should create blotter request with all fields', async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          incident_date: '2024-01-23',
          incident_time: '14:30',
          location_sitio: 'Batia Proper',
          location_details: 'Near the sari-sari store',
          description_text: 'Someone stole my wallet with cash and IDs.',
          respondent_name: 'John Doe',
          respondent_alias: 'Juan',
          respondent_address: 'Batia Proper HH-123',
          respondent_contact: '09187654321',
          complainant_contact_method: 'call',
          complainant_address: 'Batia Proper HH-001',
          complainant_id_type: 'voters_id',
          complainant_id_number: '123456789',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('request_id');

      const [requests] = await db.execute(
        'SELECT * FROM blotter_requests WHERE complainant_resident_id = ?',
        [TEST_RESIDENT_ID]
      );

      expect(requests.length).toBe(1);
      const request = requests[0];
      expect(request.incident_type).toBe('Theft (Petty)');
      expect(request.location_sitio).toBe('Batia Proper');
      expect(request.description_text).toBe('Someone stole my wallet with cash and IDs.');
      expect(request.respondent_name).toBe('John Doe');
      expect(request.complainant_contact_method).toBe('call');
      expect(request.complainant_address).toBe('Batia Proper HH-001');
      expect(request.complainant_id_type).toBe('voters_id');
      expect(request.status).toBe('pending_review');

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ?',
        [request.id]
      );

      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits.find(a => a.action === 'submitted')).toBeDefined();
    });

    test('should reject request without required fields', async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: '',
          description_text: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Step 2: Officer Starts Validation', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for validation',
        });

      requestId = response.body.data.request_id;
    });

    test('should start validation and assign officer', async () => {
      const officerResponse = await request(server)
        .patch(`/api/blotter-requests/${requestId}/validate`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          assign_officer_id: TEST_OFFICER_ID,
          due_at: '2024-01-30 17:00:00',
          note: 'Initial validation started',
        });

      expect(officerResponse.status).toBe(200);
      expect(officerResponse.body.success).toBe(true);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].status).toBe('for_validation');
      expect(requests[0].validation_assigned_officer_id).toBe(TEST_OFFICER_ID);
      expect(requests[0].validation_due_at).toBeTruthy();
    });

    test('should log contact with complainant', async () => {
      const response = await request(server)
        .post(`/api/blotter-requests/${requestId}/contact-complainant`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          method: 'call',
          notes: 'Called complainant, verified incident details',
          outcome: 'Verified',
        });

      expect(response.status).toBe(200);

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'contacted_complainant']
      );

      expect(audits.length).toBeGreaterThan(0);
      expect(audits[0].contact_method).toBe('call');
    });

    test('should update investigation checklist', async () => {
      const checklist = JSON.stringify({
        reviewed_complaint: true,
        contacted_complainant: true,
        attempted_contact_respondent: false,
        reviewed_evidence: true,
        conducted_investigation: false,
        documented_findings: false,
        verified_location: false,
        confirmed_jurisdiction: true,
      });

      const response = await request(server)
        .patch(`/api/blotter-requests/${requestId}/investigation`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          investigation_checklist: checklist,
          investigation_findings: 'Initial investigation complete',
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].investigation_checklist).toBe(checklist);
      expect(requests[0].investigation_findings).toBe('Initial investigation complete');
    });
  });

  describe('Step 3: Resident Responds to Information Request', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for resident response',
        });

      requestId = response.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/validate`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          assign_officer_id: TEST_OFFICER_ID,
        });
    });

    test('officer should request additional information', async () => {
      const response = await request(server)
        .post(`/api/blotter-requests/${requestId}/request-info`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          message: 'Please provide a more detailed description of the stolen items',
          required_fields: JSON.stringify(['stolen_items', 'witnesses']),
        });

      expect(response.status).toBe(200);

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'requested_info']
      );

      expect(audits.length).toBeGreaterThan(0);
    });

    test('resident should respond with additional information', async () => {
      await request(server)
        .post(`/api/blotter-requests/${requestId}/request-info`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          message: 'Please provide more details',
        });

      const response = await request(server)
        .post(`/api/blotter-requests/${requestId}/respond-info`)
        .set('Cookie', `authToken=${authToken}`)
        .send({
          message:
            'I lost my brown leather wallet containing 5000 pesos, ATM card, and driver license',
        });

      expect(response.status).toBe(200);

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'resident_response']
      );

      expect(audits.length).toBeGreaterThan(0);
      expect(audits[0].message_text).toContain('brown leather wallet');
    });
  });

  describe('Step 4: Officer Rejects Request', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for rejection',
        });

      requestId = response.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/validate`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          assign_officer_id: TEST_OFFICER_ID,
        });
    });

    test('should reject request with reason', async () => {
      const response = await request(server)
        .patch(`/api/blotter-requests/${requestId}/status`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          action: 'reject',
          reason: 'insufficient_evidence',
          notes: 'No evidence provided to support the claim',
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].status).toBe('rejected');
      expect(requests[0].rejection_reason_category).toBe('insufficient_evidence');
      expect(requests[0].officer_notes).toBe('No evidence provided to support the claim');

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'rejected']
      );

      expect(audits.length).toBeGreaterThan(0);
    });
  });

  describe('Step 5: Resident Appeals Rejected Request', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for appeal',
        });

      requestId = response.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/status`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          action: 'reject',
          reason: 'insufficient_evidence',
          notes: 'Test rejection',
        });
    });

    test('resident should submit appeal', async () => {
      const response = await request(server)
        .post(`/api/blotter-requests/${requestId}/appeal`)
        .set('Cookie', `authToken=${authToken}`)
        .send({
          message: 'I have CCTV footage from a nearby store showing the theft',
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].status).toBe('under_appeal');
      expect(requests[0].appeal_requested_at).toBeTruthy();
      expect(requests[0].allow_appeal).toBe(true);

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'appealed']
      );

      expect(audits.length).toBeGreaterThan(0);
    });

    test('should reject appeal from non-rejected request', async () => {
      const pendingResponse = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case',
        });

      const pendingId = pendingResponse.body.data.request_id;

      const response = await request(server)
        .post(`/api/blotter-requests/${pendingId}/appeal`)
        .set('Cookie', `authToken=${authToken}`)
        .send({
          message: 'Test appeal',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Step 6: Officer Handles Appeal', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for appeal handling',
        });

      requestId = response.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/status`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          action: 'reject',
          reason: 'insufficient_evidence',
        });

      await request(server)
        .post(`/api/blotter-requests/${requestId}/appeal`)
        .set('Cookie', `authToken=${authToken}`)
        .send({
          message: 'Appeal test',
        });
    });

    test('should approve appeal and reopen for validation', async () => {
      const response = await request(server)
        .patch(`/api/blotter-requests/${requestId}/handle-appeal`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          action: 'approve_appeal',
          message: 'Appeal accepted, investigating new evidence',
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].status).toBe('for_validation');
      expect(requests[0].validation_assigned_officer_id).toBeTruthy();

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'appeal_approved']
      );

      expect(audits.length).toBeGreaterThan(0);
    });

    test('should deny appeal', async () => {
      const freshResponse = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Fresh test for denial',
        });

      const freshId = freshResponse.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${freshId}/status`)
        .set('Cookie', `authToken=admin-token`)
        .send({
          action: 'reject',
          reason: 'insufficient_evidence',
        });

      await request(server)
        .post(`/api/blotter-requests/${freshId}/appeal`)
        .set('Cookie', `authToken=${authToken}`)
        .send({
          message: 'Appeal denial test',
        });

      const response = await request(server)
        .patch(`/api/blotter-requests/${freshId}/handle-appeal`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          action: 'deny_appeal',
          message: 'After review, evidence does not substantiate the claim',
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [freshId]);

      expect(requests[0].status).toBe('rejected');
      expect(requests[0].appeal_response).toBe(
        'After review, evidence does not substantiate the claim'
      );

      const [audits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [freshId, 'appeal_denied']
      );

      expect(audits.length).toBeGreaterThan(0);
    });
  });

  describe('Step 7: Bulk Operations', () => {
    let requestIds = [];

    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(server)
          .post('/api/blotter-requests')
          .set('Cookie', `authToken=${authToken}`)
          .send({
            incident_type: 'Theft (Petty)',
            location_sitio: 'Batia Proper',
            description_text: `Test case for bulk ${i}`,
          });

        requestIds.push(response.body.data.request_id);
      }
    });

    test('should bulk assign requests to officer', async () => {
      const response = await request(server)
        .post('/api/blotter-requests/bulk-assign')
        .set('Cookie', `authToken=admin-token`)
        .send({
          request_ids: requestIds,
          officer_id: TEST_OFFICER_ID,
        });

      expect(response.status).toBe(200);

      const [requests] = await db.execute(
        `SELECT * FROM blotter_requests WHERE id IN (${requestIds.map(() => '?').join(',')})`,
        requestIds
      );

      requests.forEach(r => {
        expect(r.validation_assigned_officer_id).toBe(TEST_OFFICER_ID);
        expect(r.status).toBe('for_validation');
      });
    });

    test('should bulk request info from residents', async () => {
      const response = await request(server)
        .post('/api/blotter-requests/bulk-request-info')
        .set('Cookie', `authToken=admin-token`)
        .send({
          request_ids: requestIds,
          message: 'Please provide additional details about the incidents',
        });

      expect(response.status).toBe(200);

      const [audits] = await db.execute(
        `SELECT * FROM blotter_request_audits WHERE request_id IN (${requestIds.map(() => '?').join(',')}) AND action = ?`,
        [...requestIds, 'requested_info']
      );

      expect(audits.length).toBe(3);
    });
  });

  describe('Step 8: Final Approval and Conversion', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(server)
        .post('/api/blotter-requests')
        .set('Cookie', `authToken=${authToken}`)
        .send({
          incident_type: 'Theft (Petty)',
          location_sitio: 'Batia Proper',
          description_text: 'Test case for final approval',
        });

      requestId = response.body.data.request_id;

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/validate`)
        .set('Cookie', `authToken=admin-token`)
        .send({ assign_officer_id: TEST_OFFICER_ID });

      const checklist = JSON.stringify({
        reviewed_complaint: true,
        contacted_complainant: true,
        attempted_contact_respondent: true,
        reviewed_evidence: true,
        conducted_investigation: true,
        documented_findings: true,
        verified_location: true,
        confirmed_jurisdiction: true,
      });

      await request(server)
        .patch(`/api/blotter-requests/${requestId}/investigation`)
        .set('Cookie', `authToken=officer-token`)
        .send({
          investigation_checklist: checklist,
          investigation_findings: 'Investigation complete, ready for decision',
        });
    });

    test('should approve request and convert to blotter case', async () => {
      const response = await request(server)
        .patch(`/api/blotter-requests/${requestId}/status`)
        .set('Cookie', `authToken=officer-token`)
        .send({ action: 'approve' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('case_number');

      const [requests] = await db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        requestId,
      ]);

      expect(requests[0].status).toBe('approved');
      expect(requests[0].approved_blotter_case_number).toBeTruthy();

      const [blotterCases] = await db.execute('SELECT * FROM blotter WHERE Case_Number = ?', [
        requests[0].approved_blotter_case_number,
      ]);

      expect(blotterCases.length).toBe(1);
      expect(blotterCases[0].Incident_Type).toBe('Theft (Petty)');
      expect(blotterCases[0].Status).toBe('Pending');

      const [requestAudits] = await db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? AND action = ?',
        [requestId, 'approved']
      );

      expect(requestAudits.length).toBeGreaterThan(0);
    });
  });
});
