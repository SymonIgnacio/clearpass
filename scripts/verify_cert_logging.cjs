const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/database');
const documentController = require('../server/controllers/documentController');
const { ROLES } = require('../server/config/roles');

// Mock Express Request/Response
const mockReq = (body = {}, user = {}, params = {}, query = {}) => ({
  body,
  user,
  params,
  query,
  app: { locals: { db } }
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  res.setHeader = () => {};
  res.send = () => {};
  return res;
};

async function runTest() {
  console.log('🧪 Starting Certificate Logging Verification...');

  try {
    // 1. Get a resident and admin
    const [residents] = await db.execute('SELECT * FROM residents LIMIT 1');
    if (residents.length === 0) throw new Error('No residents found');
    const resident = residents[0];

    const [admins] = await db.execute('SELECT * FROM users WHERE role = 1 LIMIT 1');
    if (admins.length === 0) throw new Error('No admin found');
    const admin = admins[0];

    console.log(`👤 Using Resident: ${resident.First_Name} ${resident.Last_Name} (${resident.Resident_ID})`);
    console.log(`👮 Using Admin: ${admin.username} (${admin.id})`);

    // 2. Create a Document Request
    console.log('📝 Creating Document Request...');
    const reqCreate = mockReq({
      resident_id: resident.Resident_ID,
      document_type: 'barangay_clearance',
      request_data: { purpose: 'Test Purpose' }
    }, { role: 'resident', id: resident.Resident_ID, account_status: 'Verified' }); // Mock verified status

    const resCreate = mockRes();
    
    // We need to bind the controller method to the controller instance because it uses `this`
    await documentController.createDocumentRequest.call(documentController, reqCreate, resCreate);

    if (resCreate.statusCode && resCreate.statusCode !== 201) {
      throw new Error(`Failed to create request: ${JSON.stringify(resCreate.data)}`);
    }

    const requestId = resCreate.data.data.request_id;
    console.log(`✅ Request Created: ${requestId}`);

    // 3. Approve the Request
    console.log('👍 Approving Request...');
    const reqApprove = mockReq({
      ctc_number: 'CTC-TEST-001',
      or_number: 'OR-TEST-001',
      validity_days: 90
    }, { role: 1, id: admin.id }, { request_id: requestId });

    const resApprove = mockRes();
    await documentController.approveDocumentRequest.call(documentController, reqApprove, resApprove);

    if (resApprove.statusCode && resApprove.statusCode !== 200) {
      throw new Error(`Failed to approve request: ${JSON.stringify(resApprove.data)}`);
    }

    const controlNo = resApprove.data.data.control_number;
    console.log(`✅ Request Approved. Control No: ${controlNo}`);

    // 4. Verify certificates_log
    console.log('🔍 Verifying certificates_log...');
    const [logs] = await db.execute('SELECT * FROM certificates_log WHERE control_no = ?', [controlNo]);

    if (logs.length > 0) {
      console.log('🎉 SUCCESS: Record found in certificates_log!');
      console.log(logs[0]);
    } else {
      console.error('❌ FAILURE: No record found in certificates_log!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTest();
