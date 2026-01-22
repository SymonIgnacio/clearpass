describe('auditMiddleware DB logging', () => {
  test('writes audited requests into audit_logs when db is available', async () => {
    const { auditMiddleware } = require('../middleware/auditLogger');

    const execute = jest.fn().mockResolvedValueOnce([{ insertId: 1 }]);
    const req = {
      method: 'POST',
      originalUrl: '/api/documents/requests',
      headers: {},
      get: () => 'jest-agent',
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      user: { id: 123, role: 12 },
      app: { locals: { db: { execute } } },
    };

    const res = {
      statusCode: 201,
      json: payload => payload,
    };

    const next = jest.fn();
    auditMiddleware({ auditAll: true })(req, res, next);
    res.json({ ok: true });

    await new Promise(resolve => setImmediate(resolve));

    expect(next).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][1][0]).toBe('DOCUMENT_REQUEST_CREATED');
  });
});
