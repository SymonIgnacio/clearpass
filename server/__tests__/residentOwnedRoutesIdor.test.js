const residentController = require('../controllers/residentController');
const CertificateRequestController = require('../controllers/certificateRequestController');
const { ROLES } = require('../config/roles');

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status: jest.fn(code => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn(payload => {
      res.body = payload;
      return res;
    }),
    setHeader: jest.fn((key, value) => {
      res.headers[key] = value;
      return res;
    }),
    send: jest.fn(payload => {
      res.body = payload;
      return res;
    }),
    once: jest.fn(),
  };
  return res;
};

describe('resident-owned route IDOR protections', () => {
  test.each([
    ['list documents', residentController.listDocuments, { id: 'resident-2' }],
    ['download document', residentController.downloadDocument, { id: 'resident-2', docId: '10' }],
    ['blotter history', residentController.getBlotterHistory, { id: 'resident-2' }],
  ])('blocks residents from another resident owned %s route', async (_label, handler, params) => {
    const db = { execute: jest.fn() };
    const req = {
      app: { locals: { db } },
      params,
      user: { id: 'resident-1', resident_id: 'resident-1', role: ROLES.RESIDENT },
      get: jest.fn(),
    };
    const res = createResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toMatchObject({ error: 'Access denied. Insufficient permissions.' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  test('certificate request cancellation scopes update by token resident_id', async () => {
    const db = {
      execute: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
    };
    const controller = new CertificateRequestController(db);
    const req = {
      app: { locals: { db } },
      params: { request_id: 'REQ-OTHER' },
      user: { id: 'resident-1', resident_id: 'resident-1', role: ROLES.RESIDENT },
    };
    const res = createResponse();

    await controller.cancelRequest(req, res);

    expect(db.execute).toHaveBeenCalledWith(
      'UPDATE document_requests SET status = "rejected" WHERE request_id = ? AND resident_id = ? AND status = "pending"',
      ['REQ-OTHER', 'resident-1']
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
