const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = db => {
  // Officer dashboard
  router.get(
    '/dashboard',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const [pendingCases] = await db.execute(
        'SELECT COUNT(*) as total FROM blotter WHERE Status = "Pending"'
      );
      const [ongoingCases] = await db.execute(
        'SELECT COUNT(*) as total FROM blotter WHERE Status = "Ongoing"'
      );
      const [resolvedToday] = await db.execute(
        'SELECT COUNT(*) as total FROM blotter WHERE Status = "Resolved" AND DATE(updated_at) = CURDATE()'
      );
      const [totalCases] = await db.execute('SELECT COUNT(*) as total FROM blotter');

      res.json({
        pending_cases: pendingCases[0].total,
        ongoing_cases: ongoingCases[0].total,
        resolved_today: resolvedToday[0].total,
        total_cases: totalCases[0].total,
      });
    })
  );

  // Case management
  router.get(
    '/cases',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const { status, incident_type, date_from, date_to } = req.query;

      let whereConditions = [];
      let values = [];

      if (status) {
        whereConditions.push('Status = ?');
        values.push(status);
      }

      if (incident_type) {
        whereConditions.push('Incident_Type = ?');
        values.push(incident_type);
      }

      if (date_from) {
        whereConditions.push('DateTime_Incident >= ?');
        values.push(date_from);
      }

      if (date_to) {
        whereConditions.push('DateTime_Incident <= ?');
        values.push(date_to + ' 23:59:59');
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const [cases] = await db.execute(
        `
      SELECT b.*, 
             JSON_UNQUOTE(JSON_EXTRACT(b.Complainant_Details, '$.name')) as complainant_name,
             JSON_UNQUOTE(JSON_EXTRACT(b.Respondent_Details, '$.name')) as respondent_name
      FROM blotter b
      ${whereClause}
      ORDER BY b.DateTime_Incident DESC
    `,
        values
      );

      res.json(cases);
    })
  );

  // Resolve case
  router.put(
    '/cases/:caseNumber/resolve',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const { caseNumber } = req.params;
      const { resolution_notes, resolution_type } = req.body;

      await db.execute(
        `
      UPDATE blotter 
      SET Status = ?, resolution_notes = ?, resolution_type = ?, resolved_by = ?, resolved_at = NOW(), updated_at = NOW()
      WHERE Case_Number = ?
    `,
        [
          resolution_type || 'Amicably Settled',
          resolution_notes,
          resolution_type,
          req.user.id,
          caseNumber,
        ]
      );

      res.json({ message: 'Case resolved successfully' });
    })
  );

  // Update case status
  router.put(
    '/cases/:caseNumber/status',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const { caseNumber } = req.params;
      const { status, notes } = req.body;

      await db.execute(
        `
      UPDATE blotter 
      SET Status = ?, status_notes = ?, updated_by = ?, updated_at = NOW()
      WHERE Case_Number = ?
    `,
        [status, notes, req.user.id, caseNumber]
      );

      res.json({ message: 'Case status updated successfully' });
    })
  );

  // AI analytics for crime patterns
  router.get(
    '/ai-analytics',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const [incidentTypes] = await db.execute(`
      SELECT Incident_Type, COUNT(*) as count
      FROM blotter
      WHERE DateTime_Incident >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY Incident_Type
      ORDER BY count DESC
    `);

      const [monthlyTrends] = await db.execute(`
      SELECT 
        YEAR(DateTime_Incident) as year,
        MONTH(DateTime_Incident) as month,
        COUNT(*) as incident_count
      FROM blotter
      WHERE DateTime_Incident >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(DateTime_Incident), MONTH(DateTime_Incident)
      ORDER BY year DESC, month DESC
    `);

      const [locationHotspots] = await db.execute(`
      SELECT Location_Sitio, COUNT(*) as incident_count
      FROM blotter
      WHERE DateTime_Incident >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY Location_Sitio
      ORDER BY incident_count DESC
      LIMIT 10
    `);

      res.json({
        incident_types: incidentTypes,
        monthly_trends: monthlyTrends,
        location_hotspots: locationHotspots,
        analysis_period: '6 months',
        generated_at: new Date().toISOString(),
      });
    })
  );

  // Reports
  router.get(
    '/reports',
    verifyToken,
    checkRole(['blotter_officer']),
    asyncHandler(async (req, res) => {
      const { report_type, date_from, date_to } = req.query;

      let dateFilter = '';
      let values = [];

      if (date_from && date_to) {
        dateFilter = 'WHERE DateTime_Incident BETWEEN ? AND ?';
        values = [date_from, date_to + ' 23:59:59'];
      } else {
        dateFilter = 'WHERE DateTime_Incident >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      }

      const [summary] = await db.execute(
        `
      SELECT 
        Status,
        COUNT(*) as count,
        AVG(DATEDIFF(COALESCE(resolved_at, NOW()), DateTime_Incident)) as avg_resolution_days
      FROM blotter
      ${dateFilter}
      GROUP BY Status
    `,
        values
      );

      res.json({
        report_type: report_type || 'summary',
        period: { from: date_from, to: date_to },
        summary: summary,
        generated_at: new Date().toISOString(),
      });
    })
  );

  return router;
};
