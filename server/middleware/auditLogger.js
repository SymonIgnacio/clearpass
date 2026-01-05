const winston = require('winston');
const path = require('path');

// Create audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'clearpass-audit' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/security.log'),
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
});

// Audit event types
const AUDIT_EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  
  // Resident Management
  RESIDENT_REGISTERED: 'RESIDENT_REGISTERED',
  RESIDENT_VERIFIED: 'RESIDENT_VERIFIED',
  RESIDENT_UPDATED: 'RESIDENT_UPDATED',
  
  // Certificate Operations
  CERTIFICATE_REQUESTED: 'CERTIFICATE_REQUESTED',
  CERTIFICATE_ISSUED: 'CERTIFICATE_ISSUED',
  CERTIFICATE_REJECTED: 'CERTIFICATE_REJECTED',
  CERTIFICATE_DOWNLOADED: 'CERTIFICATE_DOWNLOADED',
  
  // Blotter Operations
  BLOTTER_CREATED: 'BLOTTER_CREATED',
  BLOTTER_UPDATED: 'BLOTTER_UPDATED',
  BLOTTER_RESOLVED: 'BLOTTER_RESOLVED',
  VULNERABLE_CASE_FILED: 'VULNERABLE_CASE_FILED',
  
  // System Operations
  BACKUP_CREATED: 'BACKUP_CREATED',
  BACKUP_RESTORED: 'BACKUP_RESTORED',
  SYSTEM_CONFIG_CHANGED: 'SYSTEM_CONFIG_CHANGED',
  
  // Security Events
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  DATA_EXPORT: 'DATA_EXPORT',
  ADMIN_ACTION: 'ADMIN_ACTION'
};

// Audit logging function
const logAuditEvent = (eventType, details = {}) => {
  const auditEntry = {
    event_type: eventType,
    timestamp: new Date().toISOString(),
    user_id: details.user_id || null,
    user_role: details.user_role || null,
    ip_address: details.ip_address || null,
    user_agent: details.user_agent || null,
    resource: details.resource || null,
    action: details.action || null,
    result: details.result || 'SUCCESS',
    details: details.additional_details || {},
    session_id: details.session_id || null
  };

  // Log to audit file
  auditLogger.info('AUDIT_EVENT', auditEntry);

  // Log security events to security file
  if (isSecurityEvent(eventType)) {
    auditLogger.warn('SECURITY_EVENT', auditEntry);
  }

  return auditEntry;
};

// Check if event is security-related
const isSecurityEvent = (eventType) => {
  const securityEvents = [
    AUDIT_EVENTS.LOGIN_FAILED,
    AUDIT_EVENTS.UNAUTHORIZED_ACCESS,
    AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
    AUDIT_EVENTS.TOKEN_EXPIRED,
    AUDIT_EVENTS.ROLE_CHANGED,
    AUDIT_EVENTS.ADMIN_ACTION,
    AUDIT_EVENTS.DATA_EXPORT,
    AUDIT_EVENTS.SYSTEM_CONFIG_CHANGED
  ];
  return securityEvents.includes(eventType);
};

// Middleware to automatically log API requests
const auditMiddleware = (options = {}) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Determine if this should be audited
      if (shouldAuditRequest(req, options)) {
        const auditDetails = {
          user_id: req.user?.id || null,
          user_role: req.user?.role || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          resource: req.originalUrl,
          action: req.method,
          result: res.statusCode >= 400 ? 'FAILED' : 'SUCCESS',
          additional_details: {
            method: req.method,
            url: req.originalUrl,
            status_code: res.statusCode,
            duration_ms: duration,
            body_size: JSON.stringify(data).length
          },
          session_id: req.sessionID
        };

        // Log appropriate event type based on the request
        const eventType = determineEventType(req, res.statusCode);
        logAuditEvent(eventType, auditDetails);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Determine if request should be audited
const shouldAuditRequest = (req, options) => {
  // Always audit authentication endpoints
  if (req.originalUrl.includes('/auth/')) return true;
  
  // Always audit admin endpoints
  if (req.originalUrl.includes('/admin/')) return true;
  
  // Always audit data modification operations
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return true;
  
  // Audit sensitive GET operations
  const sensitiveEndpoints = ['/users', '/residents', '/blotter', '/certificates'];
  if (sensitiveEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) {
    return true;
  }
  
  return options.auditAll || false;
};

// Determine event type based on request
const determineEventType = (req, statusCode) => {
  const url = req.originalUrl.toLowerCase();
  const method = req.method;
  
  // Authentication events
  if (url.includes('/auth/login')) {
    return statusCode < 400 ? AUDIT_EVENTS.LOGIN_SUCCESS : AUDIT_EVENTS.LOGIN_FAILED;
  }
  if (url.includes('/auth/logout')) return AUDIT_EVENTS.LOGOUT;
  
  // User management events
  if (url.includes('/users')) {
    if (method === 'POST') return AUDIT_EVENTS.USER_CREATED;
    if (method === 'PUT') return AUDIT_EVENTS.USER_UPDATED;
    if (method === 'DELETE') return AUDIT_EVENTS.USER_DELETED;
  }
  
  // Resident events
  if (url.includes('/resident')) {
    if (method === 'POST' && url.includes('/register')) return AUDIT_EVENTS.RESIDENT_REGISTERED;
    if (method === 'PUT') return AUDIT_EVENTS.RESIDENT_UPDATED;
  }
  
  // Certificate events
  if (url.includes('/certificate')) {
    if (method === 'POST') return AUDIT_EVENTS.CERTIFICATE_REQUESTED;
    if (method === 'PUT' && url.includes('/issue')) return AUDIT_EVENTS.CERTIFICATE_ISSUED;
    if (method === 'GET' && url.includes('/download')) return AUDIT_EVENTS.CERTIFICATE_DOWNLOADED;
  }
  
  // Blotter events
  if (url.includes('/blotter')) {
    if (method === 'POST') return AUDIT_EVENTS.BLOTTER_CREATED;
    if (method === 'PUT') return AUDIT_EVENTS.BLOTTER_UPDATED;
  }
  
  // Admin events
  if (url.includes('/admin/')) {
    return AUDIT_EVENTS.ADMIN_ACTION;
  }
  
  // Unauthorized access
  if (statusCode === 401 || statusCode === 403) {
    return AUDIT_EVENTS.UNAUTHORIZED_ACCESS;
  }
  
  // Default for other operations
  return 'API_REQUEST';
};

// Database audit logging (for storing in database)
const logAuditToDatabase = async (db, eventType, details = {}) => {
  try {
    const auditEntry = {
      event_type: eventType,
      user_id: details.user_id,
      user_role: details.user_role,
      ip_address: details.ip_address,
      user_agent: details.user_agent,
      resource: details.resource,
      action: details.action,
      result: details.result || 'SUCCESS',
      details: JSON.stringify(details.additional_details || {}),
      session_id: details.session_id,
      created_at: new Date()
    };

    await db.execute(
      `INSERT INTO audit_logs (
        event_type, user_id, user_role, ip_address, user_agent, 
        resource, action, result, details, session_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditEntry.event_type,
        auditEntry.user_id,
        auditEntry.user_role,
        auditEntry.ip_address,
        auditEntry.user_agent,
        auditEntry.resource,
        auditEntry.action,
        auditEntry.result,
        auditEntry.details,
        auditEntry.session_id,
        auditEntry.created_at
      ]
    );

    return auditEntry;
  } catch (error) {
    console.error('Failed to log audit event to database:', error);
    // Still log to file as fallback
    logAuditEvent(eventType, details);
  }
};

module.exports = {
  auditMiddleware,
  logAuditEvent,
  logAuditToDatabase,
  AUDIT_EVENTS,
  auditLogger
};