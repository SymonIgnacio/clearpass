const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');
const adminController = require('../controllers/adminController');
const AIAnalyticsController = require('../controllers/aiAnalyticsController');
const { requireMfaForRoles } = require('../middleware/mfaMiddleware');

module.exports = db => {
  const requireVerificationMfa = requireMfaForRoles([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]);
  const aiController = new AIAnalyticsController(db);

  // AI Analytics Dashboard
  router.get('/ai-analytics', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN]), (req, res) =>
    aiController.getDashboardSummary(req, res)
  );

  // User Management
  router.get(
    '/roles',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      const [roles] = await db.execute('SELECT * FROM roles ORDER BY hierarchy_level');
      res.json(roles);
    })
  );

  router.get(
    '/users',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      const [users] = await db.execute(`
      SELECT u.id, u.username, u.full_name, u.email, u.contact_number, 
             u.role, u.is_active, u.created_at, u.last_login,
             CASE u.role
               WHEN 1 THEN 'IT Admin'
               WHEN 2 THEN 'Captain' 
               WHEN 3 THEN 'Secretary'
               WHEN 4 THEN 'Clerk'
               WHEN 6 THEN 'Blotter Officer'
               WHEN 12 THEN 'Resident'
               ELSE 'Unknown'
             END as role_name
      FROM users u
      ORDER BY u.role, u.created_at DESC
    `);

      res.json(users);
    })
  );

  // Staff Management
  router.get(
    '/staff',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getAllStaff)
  );
  router.post(
    '/staff',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.createStaff)
  );
  router.put(
    '/staff/:id',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.updateStaff)
  );
  router.delete(
    '/staff/:id',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.deleteStaff)
  );

  // Role Management (CRUD)
  router.post(
    '/roles',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.createRole)
  );
  router.put(
    '/roles/:id',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.updateRole)
  );
  router.delete(
    '/roles/:id',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.deleteRole)
  );

  // Residents Verification Queue
  router.get(
    '/residents-verification',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      // Join with vulnerabilities table to get vulnerability status
      const [residents] = await db.execute(`
      SELECT r.*, s.name as sitio_name, h.Household_Number,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth
      FROM residents r
      LEFT JOIN sitios s ON r.Sitio_ID = s.id
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Residency_Status = 'Pending' 
         OR (v.Is_4Ps = 1 OR v.Is_PWD = 1 OR v.Is_Senior = 1 OR v.Is_Solo_Parent = 1 OR v.Is_Out_of_School_Youth = 1)
         AND r.verified_at IS NULL
      ORDER BY r.created_at DESC
    `);

      res.json(residents);
    })
  );

  // Verify Resident
  router.post(
    '/verify-resident/:id',
    verifyToken,
    requireVerificationMfa,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { verification_type } = req.body;

      if (verification_type === 'residency') {
        await db.execute(
          'UPDATE residents SET Residency_Status = "Active", verified_at = NOW() WHERE Resident_ID = ?',
          [id]
        );
        res.json({ message: 'Residency verified successfully' });
      } else if (verification_type === 'vulnerability') {
        await db.execute('UPDATE residents SET verified_at = NOW() WHERE Resident_ID = ?', [id]);
        res.json({ message: 'Vulnerability status verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid verification type' });
      }
    })
  );

  // Summary reports
  router.get(
    '/reports/users',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getUsersReport)
  );
  router.get(
    '/reports/blotter',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getBlotterReport)
  );
  router.get(
    '/reports/certificates',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getCertificatesReport)
  );
  router.get(
    '/reports/residents',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getResidentsReport)
  );
  router.get(
    '/reports/system',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getSystemReport)
  );
  router.get(
    '/reports/security',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getSecurityReport)
  );
  router.get(
    '/reports/pdf/:type',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.generatePDFReport)
  );

  // Detailed reports (with pagination and filters)
  router.get(
    '/reports/detailed/users',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getDetailedUsersReport)
  );
  router.get(
    '/reports/detailed/blotter',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getDetailedBlotterReport)
  );
  router.get(
    '/reports/detailed/certificates',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getDetailedCertificatesReport)
  );
  router.get(
    '/reports/detailed/residents',
    verifyToken,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(adminController.getDetailedResidentsReport)
  );

  // System Logs & Audit Trail
  router.get(
    '/logs',
    verifyToken,
    requireVerificationMfa,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      const {
        page = 1,
        limit = 25,
        event_type,
        user_role,
        result,
        date_from,
        date_to,
        search,
      } = req.query;

      // Input validation
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 25));

      if (search && search.length > 100) {
        return res.status(400).json({ error: 'Search term too long' });
      }

      let whereConditions = [];
      let values = [];

      if (event_type) {
        whereConditions.push('event_type = ?');
        values.push(event_type);
      }

      if (user_role) {
        whereConditions.push('user_role = ?');
        values.push(user_role);
      }

      if (result) {
        whereConditions.push('result = ?');
        values.push(result);
      }

      if (date_from) {
        whereConditions.push('created_at >= ?');
        values.push(date_from + ' 00:00:00');
      }

      if (date_to) {
        whereConditions.push('created_at <= ?');
        values.push(date_to + ' 23:59:59');
      }

      if (search) {
        whereConditions.push('(resource LIKE ? OR user_id LIKE ? OR ip_address LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const offset = (pageNum - 1) * limitNum;

      // Get total count
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        values
      );
      const total = countResult[0].total;

      // Get logs with pagination
      const [logs] = await db.execute(
        `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...values, limitNum, offset]
      );

      res.json({
        success: true,
        logs,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      });
    })
  );

  // Export logs as CSV
  router.get(
    '/logs/export',
    verifyToken,
    requireVerificationMfa,
    verifyRole([ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      const { event_type, user_role, result, date_from, date_to, search } = req.query;

      let whereConditions = [];
      let values = [];

      if (event_type) {
        whereConditions.push('event_type = ?');
        values.push(event_type);
      }

      if (user_role) {
        whereConditions.push('user_role = ?');
        values.push(user_role);
      }

      if (result) {
        whereConditions.push('result = ?');
        values.push(result);
      }

      if (date_from) {
        whereConditions.push('created_at >= ?');
        values.push(date_from + ' 00:00:00');
      }

      if (date_to) {
        whereConditions.push('created_at <= ?');
        values.push(date_to + ' 23:59:59');
      }

      if (search) {
        whereConditions.push('(resource LIKE ? OR user_id LIKE ? OR ip_address LIKE ?)');
        const searchTerm = `%${search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const [logs] = await db.execute(
        `SELECT event_type, user_id, user_role, ip_address, resource, action, result, created_at 
       FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
        values
      );

      // Convert to CSV
      const csvHeader =
        'Event Type,User ID,User Role,IP Address,Resource,Action,Result,Timestamp\n';
      const csvRows = logs
        .map(
          log =>
            `"${log.event_type}","${log.user_id || ''}","${log.user_role || ''}","${log.ip_address || ''}","${log.resource || ''}","${log.action || ''}","${log.result}","${log.created_at}"`
        )
        .join('\n');

      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.send(csv);
    })
  );

  // System statistics
  router.get(
    '/stats',
    verifyToken,
    verifyRole([ROLES.ADMIN, ROLES.CAPTAIN]),
    asyncHandler(async (req, res) => {
      const [residents] = await db.execute(
        'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
      );
      const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
      const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter');
      const [users] = await db.execute('SELECT COUNT(*) as total FROM users');

      res.json({
        residents: residents[0].total,
        certificates: certificates[0].total,
        blotter_cases: blotter[0].total,
        users: users[0].total,
        generated_at: new Date().toISOString(),
      });
    })
  );

  return router;
};
