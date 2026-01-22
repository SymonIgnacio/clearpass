const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = db => {
  // Firebase users - Admin and Captain access for oversight
  router.get(
    '/auth/firebase-users',
    verifyToken,
    checkRole(['admin', 'captain']),
    asyncHandler(async (req, res) => {
      res.json([]); // Return empty array - no firebase users in current system
    })
  );

  // Residency verifications - Admin access only
  router.get(
    '/auth/residency-verifications/pending',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      res.json([]); // Return empty array - simplified system
    })
  );

  // Programs - Captain and Secretary access
  router.get(
    '/programs',
    verifyToken,
    checkRole(['captain', 'secretary']),
    asyncHandler(async (req, res) => {
      const [programs] = await db.execute(
        'SELECT * FROM community_programs ORDER BY program_date DESC'
      );
      res.json(programs);
    })
  );

  // Templates - Clerk, Captain, and Secretary access
  router.get(
    '/templates',
    verifyToken,
    checkRole(['captain', 'admin', 'secretary', 'clerk']),
    asyncHandler(async (req, res) => {
      try {
        const [templates] = await db.execute(
          `
          SELECT
            id,
            template_name,
            document_type,
            certificate_type_id,
            template_content,
            is_active,
            created_at,
            updated_at
          FROM document_templates
          WHERE is_active = 1
          ORDER BY template_name
        `
        );
        res.json(templates);
      } catch (error) {
        res.json([]); // Return empty array if table doesn't exist
      }
    })
  );

  // Households - Read access for staff roles
  router.get(
    '/households',
    verifyToken,
    checkRole(['admin', 'clerk', 'captain', 'secretary']),
    asyncHandler(async (req, res) => {
      const [households] = await db.execute('SELECT * FROM households ORDER BY Household_Number');
      res.json(households);
    })
  );

  // Sitios - Read access for all officer roles
  router.get(
    '/sitios',
    verifyToken,
    checkRole(['admin', 'clerk', 'blotter_officer', 'captain', 'secretary']),
    asyncHandler(async (req, res) => {
      const [sitios] = await db.execute('SELECT * FROM sitios ORDER BY name');
      res.json(sitios);
    })
  );

  // Certificate types - Staff access
  router.get(
    '/certificate-types',
    verifyToken,
    checkRole(['captain', 'admin', 'secretary', 'clerk']),
    asyncHandler(async (req, res) => {
      try {
        const [types] = await db.execute(
          'SELECT * FROM certificate_types WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: types });
      } catch (error) {
        res.json({ success: true, data: [] });
      }
    })
  );

  // Census data - Read access for authorized staff
  router.get(
    '/census',
    verifyToken,
    checkRole(['captain', 'secretary', 'clerk', 'admin']),
    asyncHandler(async (req, res) => {
      const [stats] = await db.execute(`
      SELECT s.name as sitio_name, COUNT(r.Resident_ID) as total_residents
      FROM sitios s
      LEFT JOIN households h ON s.id = h.Sitio_ID
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      GROUP BY s.id, s.name
    `);
      res.json(stats);
    })
  );

  // Dashboard data - All authenticated users
  router.get(
    '/dashboard',
    verifyToken,
    asyncHandler(async (req, res) => {
      try {
        // Get total residents
        const [residentStats] = await db.execute(
          'SELECT COUNT(*) as total_residents FROM residents'
        );

        // Get vulnerable groups counts
        const [seniorStats] = await db.execute(
          'SELECT COUNT(*) as total_seniors FROM residents WHERE TIMESTAMPDIFF(YEAR, Birthdate, CURDATE()) >= 60'
        );
        const [pwdStats] = await db.execute(
          'SELECT COUNT(*) as total_pwd FROM vulnerabilities WHERE Is_PWD = 1'
        );
        const [singleParentStats] = await db.execute(
          'SELECT COUNT(*) as total_single_parents FROM vulnerabilities WHERE Is_Solo_Parent = 1'
        );

        // Get active blotter cases
        const [blotterStats] = await db.execute(
          'SELECT COUNT(*) as active_blotter FROM blotter WHERE Status = "Pending"'
        );

        // Get certificates count
        const [certStats] = await db.execute(
          'SELECT COUNT(*) as certificates FROM certificates_log'
        );

        const dashboardData = {
          overall: {
            total_residents: residentStats[0]?.total_residents || 0,
            total_seniors: seniorStats[0]?.total_seniors || 0,
            total_pwd: pwdStats[0]?.total_pwd || 0,
            total_single_parents: singleParentStats[0]?.total_single_parents || 0,
          },
          residents: residentStats[0]?.total_residents || 0,
          active_blotter: blotterStats[0]?.active_blotter || 0,
          certificates: certStats[0]?.certificates || 0,
        };

        res.json(dashboardData);
      } catch (error) {
        console.error('Dashboard API error:', error);
        // Return default values on error
        res.json({
          overall: {
            total_residents: 0,
            total_seniors: 0,
            total_pwd: 0,
            total_single_parents: 0,
          },
          residents: 0,
          active_blotter: 0,
          certificates: 0,
        });
      }
    })
  );

  // Document QR verification (public endpoint)
  router.post(
    '/documents/verify-qr',
    asyncHandler(async (req, res) => {
      const qr_hash = req.body?.qr_hash || req.body?.qr_code_data;
      if (!qr_hash) {
        return res.status(400).json({ status: 'INVALID', message: 'QR value is required' });
      }
      const [certs] = await db.execute(
        'SELECT * FROM certificates_log WHERE qr_validation_string = ?',
        [qr_hash]
      );
      if (certs.length === 0) return res.json({ status: 'INVALID', message: 'QR code not found' });
      res.json({ status: 'VALID', certificate: certs[0] });
    })
  );

  return router;
};
