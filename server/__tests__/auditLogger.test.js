const { auditMiddleware, logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');
const winston = require('winston');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
  },
}));

describe('Audit Logger Middleware', () => {
  let req, res, next;
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request and response
    req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      user: { id: 'user123', role: 'admin' },
      app: { locals: { db: mockDb } }
    };

    res = {
      statusCode: 200,
      json: jest.fn(),
      on: jest.fn(),
    };

    next = jest.fn();

    // Mock DB
    mockDb = {
      execute: jest.fn().mockResolvedValue([{}]),
    };
    req.app = { locals: { db: mockDb } };
  });

  describe('auditMiddleware', () => {
    test('should call next()', () => {
      const middleware = auditMiddleware();
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should intercept res.json and log audit event', () => {
      const middleware = auditMiddleware({ auditAll: true });
      middleware(req, res, next);

      // Trigger the intercepted json method
      res.json({ success: true });

      // Verify logAuditEvent was called (via winston mock inspection)
      // Since logAuditEvent uses the global logger instance, we check the logger mock
      const logger = winston.createLogger();
      expect(logger.info).toHaveBeenCalledWith('AUDIT_EVENT', expect.objectContaining({
        user_id: 'user123',
        action: 'GET',
        resource: '/api/test'
      }));
    });

    test('should log to database if db is available', () => {
      const middleware = auditMiddleware({ auditAll: true });
      middleware(req, res, next);
      res.json({ success: true });

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        expect.any(Array)
      );
    });

    test('should identify security events', () => {
      req.originalUrl = '/api/auth/login';
      res.statusCode = 401; // Failed login

      const middleware = auditMiddleware();
      middleware(req, res, next);
      res.json({ error: 'Invalid credentials' });

      const logger = winston.createLogger();
      expect(logger.warn).toHaveBeenCalledWith('SECURITY_EVENT', expect.objectContaining({
        event_type: AUDIT_EVENTS.LOGIN_FAILED,
        result: 'FAILED'
      }));
    });
  });

  describe('logAuditEvent', () => {
    test('should log info event', () => {
      logAuditEvent(AUDIT_EVENTS.USER_CREATED, { user_id: '123' });
      const logger = winston.createLogger();
      expect(logger.info).toHaveBeenCalledWith('AUDIT_EVENT', expect.objectContaining({
        event_type: AUDIT_EVENTS.USER_CREATED
      }));
    });

    test('should log security event as warn', () => {
      logAuditEvent(AUDIT_EVENTS.UNAUTHORIZED_ACCESS, { ip_address: '1.1.1.1' });
      const logger = winston.createLogger();
      expect(logger.warn).toHaveBeenCalledWith('SECURITY_EVENT', expect.objectContaining({
        event_type: AUDIT_EVENTS.UNAUTHORIZED_ACCESS
      }));
    });
  });

  describe('logAuditToDatabase', () => {
    test('should execute insert query', async () => {
      await logAuditToDatabase(mockDb, AUDIT_EVENTS.USER_UPDATED, { user_id: '123' });
      expect(mockDb.execute).toHaveBeenCalledTimes(1);
    });

    test('should handle db errors gracefully', async () => {
      mockDb.execute.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await logAuditToDatabase(mockDb, AUDIT_EVENTS.USER_UPDATED, {});
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
