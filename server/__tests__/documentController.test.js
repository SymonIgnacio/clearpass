
const mockKnex = jest.fn();
mockKnex.fn = { now: jest.fn() };

jest.mock('knex', () => () => mockKnex);
jest.mock('pdfkit');
jest.mock('pdf-lib', () => ({ PDFDocument: { load: jest.fn() } }));
jest.mock('pizzip');
jest.mock('docxtemplater');
jest.mock('../middleware/auditLogger', () => ({
  logAuditToDatabase: jest.fn(),
  AUDIT_EVENTS: {}
}));

const DocumentController = require('../controllers/documentController');

describe('DocumentController', () => {
  let req, res;

  // Helper to create a chainable mock
  const createMockChain = (resolveValue = []) => {
    // Create a real promise that resolves to the value
    const chain = Promise.resolve(resolveValue);
    
    // Chainable methods - attach to the promise instance
    ['select', 'where', 'whereIn', 'join', 'leftJoin', 'orderBy', 'limit', 'offset', 'update', 'count'].forEach(method => {
      chain[method] = jest.fn().mockReturnValue(chain);
    });

    // Terminators - attach to the promise instance
    chain.first = jest.fn().mockResolvedValue(undefined);
    chain.insert = jest.fn().mockResolvedValue([1]);
    
    return chain;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    
    // Restore knex.fn.now because resetAllMocks might have cleared it if it was a spy
    // But here it is a property on the mock. 
    // Just to be safe:
    mockKnex.fn = { now: jest.fn() };
    
    req = {
      user: { id: 'user123', role: 'resident', account_status: 'Verified' },
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('createDocumentRequest', () => {
    test('should block request if account is not verified', async () => {
      req.user.account_status = 'Pending';
      await DocumentController.createDocumentRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('not verified') }));
    });

    test('should block request if active blotter cases exist', async () => {
      req.body = { resident_id: 'RES-123', document_type: 'barangay_clearance' };
      
      // 1. Blotter check chain
      // Based on controller logic accessing [0].total after destructuring, it expects [[{total: N}]]
      const blotterChain = createMockChain([[{ total: 1 }]]);
      mockKnex.mockReturnValueOnce(blotterChain);

      await DocumentController.createDocumentRequest(req, res);
      
      expect(blotterChain.count).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ clearpass_status: 'BLOCKED' }));
    });

    test('should create request if no blotter cases', async () => {
      req.body = { resident_id: 'RES-123', document_type: 'barangay_clearance' };
      
      // 1. Blotter check (0 cases)
      const blotterChain = createMockChain([[{ total: 0 }]]);
      mockKnex.mockReturnValueOnce(blotterChain);
      
      // 2. Resident fetch
      const residentChain = createMockChain();
      residentChain.first.mockResolvedValue({ Resident_ID: 'RES-123' });
      mockKnex.mockReturnValueOnce(residentChain);
      
      // 3. Insert
      const insertChain = createMockChain();
      mockKnex.mockReturnValueOnce(insertChain);

      await DocumentController.createDocumentRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('approveDocumentRequest', () => {
    test('should approve request and generate control number', async () => {
      req.params.request_id = 'REQ-123';
      req.body = { validity_days: 365 };

      // 1. Fetch request
      const fetchChain = createMockChain();
      fetchChain.first.mockResolvedValue({ request_id: 'REQ-123', document_type: 'barangay_clearance' });
      mockKnex.mockReturnValueOnce(fetchChain);
      
      // 2. Update
      const updateChain = createMockChain();
      updateChain.update.mockResolvedValue(1);
      mockKnex.mockReturnValueOnce(updateChain);

      await DocumentController.approveDocumentRequest(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.objectContaining({ status: 'approved' }) }));
    });

    test('should return 404 if request not found', async () => {
      req.params.request_id = 'REQ-123';
      
      const fetchChain = createMockChain();
      fetchChain.first.mockResolvedValue(undefined);
      mockKnex.mockReturnValueOnce(fetchChain);

      await DocumentController.approveDocumentRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('validateDocument', () => {
    test('should validate valid document', async () => {
      req.body.qr_data = 'valid-qr';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const chain = createMockChain();
      chain.first.mockResolvedValue({
        control_number: 'DOC-123',
        valid_until: futureDate,
        approved_at: new Date()
      });
      mockKnex.mockReturnValueOnce(chain);

      await DocumentController.validateDocument(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ is_valid: true, status: 'VALID' })
      }));
    });

    test('should invalidate expired document', async () => {
      req.body.qr_data = 'expired-qr';
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const chain = createMockChain();
      chain.first.mockResolvedValue({
        control_number: 'DOC-123',
        valid_until: pastDate,
        approved_at: new Date()
      });
      mockKnex.mockReturnValueOnce(chain);

      await DocumentController.validateDocument(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ is_valid: false, status: 'EXPIRED' })
      }));
    });
  });

  describe('verifyQRCode', () => {
    test('should verify certificate QR', async () => {
      req.body.qr_code_data = 'cert-hash';
      
      const chain = createMockChain();
      chain.first.mockResolvedValue({
        control_no: 'CERT-001',
        certificate_type: 'Clearance'
      });
      mockKnex.mockReturnValueOnce(chain);

      await DocumentController.verifyQRCode(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'VALID', type: 'certificate' }));
    });

    test('should verify ID QR', async () => {
      req.body.qr_code_data = 'id-hash';
      
      // 1. Cert check (not found)
      const certChain = createMockChain();
      certChain.first.mockResolvedValue(undefined);
      mockKnex.mockReturnValueOnce(certChain);
      
      // 2. Resident check (found)
      const residentChain = createMockChain();
      residentChain.first.mockResolvedValue({
        Resident_ID: 'RES-123',
        First_Name: 'John'
      });
      mockKnex.mockReturnValueOnce(residentChain);

      await DocumentController.verifyQRCode(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'VALID', type: 'barangay_id' }));
    });
  });
});
