const CertificateRequestController = require('../controllers/certificateRequestController');

describe('CertificateRequestController', () => {
  let controller;
  let mockDb;
  let req, res;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn(),
    };
    controller = new CertificateRequestController(mockDb);

    req = {
      user: { resident_id: 'RES-123', id: 'user-123', role: 'resident' },
      body: {},
      params: {},
      query: {},
      files: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
    global.createBulkNotification = jest.fn();
    global.createNotification = jest.fn();
  });

  describe('submitRequest', () => {
    test('should return 400 if files are missing', async () => {
      req.files = {};
      await controller.submitRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('required') })
      );
    });

    test('should return 404 if resident not found', async () => {
      req.files = {
        front_id: [{ buffer: Buffer.from('front'), mimetype: 'image/jpeg' }],
        back_id: [{ buffer: Buffer.from('back'), mimetype: 'image/jpeg' }],
      };
      req.body = { document_type: 'Clearance', purpose: 'Job', additional_data: '{}' };

      mockDb.execute.mockResolvedValueOnce([[]]); // Resident not found

      await controller.submitRequest(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should submit request successfully', async () => {
      req.files = {
        front_id: [{ buffer: Buffer.from('front'), mimetype: 'image/jpeg' }],
        back_id: [{ buffer: Buffer.from('back'), mimetype: 'image/jpeg' }],
      };
      req.body = { document_type: 'Clearance', purpose: 'Job', additional_data: '{}' };

      mockDb.execute
        .mockResolvedValueOnce([[{ Resident_ID: 'RES-123', First_Name: 'John', Last_Name: 'Doe' }]]) // Resident found
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Insert request
        .mockResolvedValueOnce([[{ id: 1 }]]); // Fetch staff for notification

      await controller.submitRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ request_id: expect.stringMatching(/^REQ-/) }),
        })
      );
      expect(global.createBulkNotification).toHaveBeenCalled();
    });
  });

  describe('updateRequestStatus', () => {
    test('should return 400 for invalid status', async () => {
      req.params.request_id = 'REQ-1';
      req.body.status = 'invalid';
      await controller.updateRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should update status and notify resident', async () => {
      req.params.request_id = 'REQ-1';
      req.body.status = 'approved';

      mockDb.execute
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update
        .mockResolvedValueOnce([[{ resident_id: 'RES-123', document_type: 'Clearance' }]]); // Get resident info

      await controller.updateRequestStatus(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(global.createNotification).toHaveBeenCalled();
    });

    test('should return 404 if request not found', async () => {
      req.params.request_id = 'REQ-1';
      req.body.status = 'approved';

      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await controller.updateRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('cancelRequest', () => {
    test('should cancel pending request', async () => {
      req.params.request_id = 'REQ-1';
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      await controller.cancelRequest(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getAllRequests', () => {
    test('should return paginated requests', async () => {
      mockDb.execute
        .mockResolvedValueOnce([[{ request_id: 'REQ-1' }]]) // Data
        .mockResolvedValueOnce([[{ total: 1 }]]); // Count

      await controller.getAllRequests(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.any(Array) })
      );
    });
  });
});
