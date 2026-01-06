const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const adminController = require('../controllers/adminController');

module.exports = (db) => {
  // Summary reports
  router.get('/reports/users', verifyToken, checkRole(['admin']), asyncHandler(adminController.getUsersReport));
  router.get('/reports/blotter', verifyToken, checkRole(['admin']), asyncHandler(adminController.getBlotterReport));
  router.get('/reports/certificates', verifyToken, checkRole(['admin']), asyncHandler(adminController.getCertificatesReport));
  router.get('/reports/residents', verifyToken, checkRole(['admin']), asyncHandler(adminController.getResidentsReport));
  router.get('/reports/system', verifyToken, checkRole(['admin']), asyncHandler(adminController.getSystemReport));
  router.get('/reports/security', verifyToken, checkRole(['admin']), asyncHandler(adminController.getSecurityReport));
  
  // Detailed reports (with pagination and filters)
  router.get('/reports/detailed/users', verifyToken, checkRole(['admin']), asyncHandler(adminController.getDetailedUsersReport));
  router.get('/reports/detailed/blotter', verifyToken, checkRole(['admin']), asyncHandler(adminController.getDetailedBlotterReport));
  router.get('/reports/detailed/certificates', verifyToken, checkRole(['admin']), asyncHandler(adminController.getDetailedCertificatesReport));
  router.get('/reports/detailed/residents', verifyToken, checkRole(['admin']), asyncHandler(adminController.getDetailedResidentsReport));
  
  // System Logs & Audit Trail
  router.get('/logs', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 25,
      event_type,
      user_role,
      result,
      date_from,
      date_to,
      search
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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
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
      pages: Math.ceil(total / limitNum)
    });
  }));

  // Export logs as CSV
  router.get('/logs/export', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
    const {
      event_type,
      user_role,
      result,
      date_from,
      date_to,
      search
    } = req.query;

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

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [logs] = await db.execute(
      `SELECT event_type, user_id, user_role, ip_address, resource, action, result, created_at 
       FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
      values
    );

    // Convert to CSV
    const csvHeader = 'Event Type,User ID,User Role,IP Address,Resource,Action,Result,Timestamp\n';
    const csvRows = logs.map(log => 
      `"${log.event_type}","${log.user_id || ''}","${log.user_role || ''}","${log.ip_address || ''}","${log.resource || ''}","${log.action || ''}","${log.result}","${log.created_at}"`
    ).join('\n');
    
    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }));
  
  // System statistics
  router.get('/stats', verifyToken, checkRole(['admin', 'captain']), asyncHandler(async (req, res) => {
    const [residents] = await db.execute('SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"');
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    const [blotter] = await db.execute('SELECT COUNT(*) as total FROM blotter');
    const [users] = await db.execute('SELECT COUNT(*) as total FROM users');
    
    res.json({
      residents: residents[0].total,
      certificates: certificates[0].total,
      blotter_cases: blotter[0].total,
      users: users[0].total,
      generated_at: new Date().toISOString()
    });
  }));

  return router;
};
