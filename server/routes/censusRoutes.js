const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = db => {
  router.get(
    '/',
    verifyToken,
    checkRole([ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.ADMIN]),
    asyncHandler(async (req, res) => {
      // Get overall statistics with vulnerability data from joined tables
      const [overallStats] = await db.execute(`
      SELECT 
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents
      FROM residents r
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Residency_Status = 'Active'
    `);

      // Get statistics by sitio with vulnerability data
      const [sitioStats] = await db.execute(`
      SELECT 
        h.Sitio_ID,
        s.name as sitio_name,
        COUNT(r.Resident_ID) as total_residents,
        SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      WHERE r.Residency_Status = 'Active'
      GROUP BY h.Sitio_ID, s.name
      ORDER BY s.name
    `);

      res.json({
        overall: overallStats[0],
        bySitio: sitioStats,
      });
    })
  );

  return router;
};
