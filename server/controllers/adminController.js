const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');
const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
const PDFDocument = require('pdfkit');
const axios = require('axios');
const NotificationController = require('./notificationController');

// IT Admin User Management - All Users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await knex('users as u')
      .select([
        'u.id',
        'u.username',
        'u.full_name',
        'u.email',
        'u.role',
        'u.is_active',
        'u.created_at',
        knex.raw("COALESCE(r.role_name, CONCAT('Role ', u.role)) as role_name"),
      ])
      .leftJoin('roles as r', 'u.role', 'r.id')
      .orderBy(['u.role', 'u.username']);

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  const {
    username,
    email,
    first_name,
    last_name,
    role,
    role_id,
    password,
    is_active = true,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();

    const normalizedRole = role ?? role_id;
    const roleNum = Number.parseInt(normalizedRole, 10);

    if (!Number.isFinite(roleNum)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const [insertId] = await knex('users').insert({
      username,
      email,
      full_name,
      password_hash: hashedPassword,
      role: roleNum,
      is_active,
      created_at: knex.fn.now(),
    });

    res.status(201).json({ message: 'User created successfully', id: insertId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role, role_id, password, is_active } = req.body;

  try {
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();
    const normalizedRole = role ?? role_id;
    const roleNum = Number.parseInt(normalizedRole, 10);

    if (!Number.isFinite(roleNum)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updateObj = {
      updated_at: knex.fn.now(),
    };

    if (username !== undefined) updateObj.username = username;
    if (email !== undefined) updateObj.email = email;
    if (first_name !== undefined || last_name !== undefined) updateObj.full_name = full_name;
    if (Number.isFinite(roleNum)) updateObj.role = roleNum;
    if (is_active !== undefined) updateObj.is_active = is_active;

    if (password) {
      updateObj.password_hash = await bcrypt.hash(password, 10);
    }

    await knex('users').where('id', id).update(updateObj);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // SECURITY: Hierarchy Check
    const requesterLevel = await getRoleLevel(req.user.role);

    // 1. Check Target User's Current Level
    const targetUser = await knex('users').select('role').where('id', id).first();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targetCurrentLevel = await getRoleLevel(targetUser.role);

    if (requesterLevel > targetCurrentLevel) {
      return res
        .status(403)
        .json({ error: 'Access denied. You cannot delete a user with higher authority.' });
    }
    // Prevent self-deletion if needed, though typically handled by UI.
    // Ideally, peers can delete peers (level === level), but subordinates cannot delete superiors.

    await knex('users').where('id', id).del();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// IT Admin Staff Management
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await knex('users as u')
      .select([
        'u.id',
        'u.username',
        'u.full_name',
        'u.email',
        'u.role',
        'u.is_active',
        'u.created_at',
        knex.raw("COALESCE(r.role_name, CONCAT('Role ', u.role)) as role_name"),
      ])
      .leftJoin('roles as r', 'u.role', 'r.id')
      .whereNot('u.role', ROLES.RESIDENT)
      .orderBy(['u.role', 'u.username']);

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

// Helper to get hierarchy level
const getRoleLevel = async roleId => {
  const rows = await knex('roles').select('hierarchy_level').where('id', roleId);
  return rows.length > 0 ? rows[0].hierarchy_level : 999; // Default to lowest priority if not found
};

exports.createStaff = async (req, res) => {
  const {
    username,
    email,
    first_name,
    last_name,
    role,
    role_id,
    password,
    is_active = true,
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const full_name = `${first_name || ''} ${last_name || ''}`.trim();

    const normalizedRole = role ?? role_id;
    const roleNum = Number.parseInt(normalizedRole, 10);
    if (!Number.isFinite(roleNum)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // SECURITY: Hierarchy Check
    // 1. Get Requester's Level
    const requesterLevel = await getRoleLevel(req.user.role);
    // 2. Get Target Role's Level
    const targetLevel = await getRoleLevel(roleNum);

    // Ensure requester has higher authority (Lower Level Number = Higher Authority)
    // Exception: Admin (Level 1) can create other Admins (Level 1)
    if (requesterLevel > targetLevel) {
      return res.status(403).json({
        error: 'Access denied. You cannot create a user with a higher or equal role hierarchy.',
      });
    }
    // Prevent non-super-admins from creating admins (if policy requires) - strictly enforced hierarchy
    if (requesterLevel === targetLevel && requesterLevel !== 1) {
      return res
        .status(403)
        .json({ error: 'Access denied. You cannot create a user with the same role hierarchy.' });
    }

    await knex('users').insert({
      username,
      email,
      full_name,
      password_hash: hashedPassword,
      role: roleNum,
      is_active,
      created_at: knex.fn.now(),
    });

    res.status(201).json({ message: 'Staff created successfully' });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff' });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role, role_id, password, is_active } = req.body;

  try {
    // SECURITY: Hierarchy Check
    const requesterLevel = await getRoleLevel(req.user.role);

    // 1. Check Target User's Current Level
    const targetUser = await knex('users').select('role').where('id', id).first();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targetCurrentLevel = await getRoleLevel(targetUser.role);

    if (requesterLevel > targetCurrentLevel) {
      return res
        .status(403)
        .json({ error: 'Access denied. You cannot edit a user with higher authority.' });
    }

    // 2. Check New Role Level (if changing role)
    const normalizedRole = role ?? role_id;
    const roleNum = Number.parseInt(normalizedRole, 10);

    if (Number.isFinite(roleNum)) {
      const newTargetLevel = await getRoleLevel(roleNum);
      if (requesterLevel > newTargetLevel) {
        return res.status(403).json({
          error: 'Access denied. You cannot promote a user to a higher authority than yourself.',
        });
      }
    }

    const full_name = `${first_name || ''} ${last_name || ''}`.trim();
    if (!Number.isFinite(roleNum)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updateObj = {
      username,
      email,
      full_name,
      role: roleNum,
      is_active,
      updated_at: knex.fn.now(),
    };

    if (password) {
      updateObj.password_hash = await bcrypt.hash(password, 10);
    }

    await knex('users').where('id', id).update(updateObj);
    res.json({ message: 'Staff updated successfully' });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff' });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    // SECURITY: Hierarchy Check
    const requesterLevel = await getRoleLevel(req.user.role);

    // 1. Check Target User's Current Level
    const targetUser = await knex('users').select('role').where('id', id).first();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targetCurrentLevel = await getRoleLevel(targetUser.role);

    if (requesterLevel > targetCurrentLevel) {
      return res
        .status(403)
        .json({ error: 'Access denied. You cannot delete a user with higher authority.' });
    }

    await knex('users').where('id', id).whereNot('role', ROLES.RESIDENT).del();
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
};

// Secretary User Management - Residency & Vulnerability Verification
exports.getResidentsForVerification = async (req, res) => {
  try {
    const residents = await knex('residents as r')
      .select([
        'r.*',
        'h.Household_Number',
        's.name as sitio_name',
        'v.Is_4Ps',
        'v.Is_PWD',
        'v.Is_Senior',
        'v.Is_Solo_Parent',
        'v.Vulnerability_Score',
      ])
      .leftJoin('households as h', 'r.Household_ID', 'h.Household_ID')
      .leftJoin('sitios as s', 'h.Sitio_ID', 's.id')
      .leftJoin('vulnerabilities as v', 'r.Resident_ID', 'v.Resident_ID')
      .orderBy('r.Last_Name');

    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents for verification:', error);
    res.status(500).json({ error: 'Failed to fetch residents' });
  }
};

exports.verifyResident = async (req, res) => {
  const { id } = req.params;
  const { verification_type } = req.body;

  const trx = await knex.transaction();

  try {
    if (verification_type === 'residency') {
      // 1. Update Resident Status
      await trx('residents').where('Resident_ID', id).update({
        Residency_Status: 'Active',
        updated_at: knex.fn.now(),
      });

      // 2. Promote User Role (Guest -> Resident)
      await trx('users').where('resident_id', id).update({ role: ROLES.RESIDENT });

      // 3. Update Related Documents (Fix for "Approved but Pending" issue)
      // Update resident_documents
      await trx('resident_documents')
        .where('resident_id', id)
        .andWhere('verification_status', 'Pending')
        .update({
          verification_status: 'Approved',
          reviewed_by: req.user.id,
          reviewed_at: knex.fn.now(),
        });

      // Update application_documents (if linked via application)
      // First find the application for this resident
      const application = await trx('resident_applications')
        .where('resident_id', id)
        .orderBy('created_at', 'desc')
        .first();

      if (application) {
        await trx('application_documents')
          .where('application_id', application.application_id)
          .andWhere('verification_status', 'Pending')
          .update({
            verification_status: 'Approved',
            reviewed_by: req.user.id,
            reviewed_at: knex.fn.now(),
          });

        // Also mark application as Approved
        await trx('resident_applications')
          .where('application_id', application.application_id)
          .update({ status: 'Approved' });
      }

      // 4. Send Notification
      try {
        const user = await trx('users').where('resident_id', id).first();
        if (user) {
          // Use req.app.locals.db for NotificationController (it uses mysql2 pool)
          const notificationController = new NotificationController(req.app.locals.db);
          await notificationController.createNotification(
            user.id,
            'Residency Verified',
            'Your residency status has been verified. You now have full access to resident features.',
            'success',
            'high'
          );
        }
      } catch (notifError) {
        console.error('Failed to send verification notification:', notifError);
      }
    } else if (verification_type === 'vulnerability') {
      await trx('vulnerabilities').where('Resident_ID', id).update({
        verified_at: knex.fn.now(),
        verified_by: req.user.id,
      });
    }

    await trx.commit();
    res.json({ message: `${verification_type} verification completed successfully` });
  } catch (error) {
    await trx.rollback();
    console.error('Error verifying resident:', error);
    res.status(500).json({ error: 'Failed to verify resident' });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await knex('roles').select('*').orderBy('hierarchy_level');
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

exports.createRole = async (req, res) => {
  const { role_name, description, hierarchy_level, permissions } = req.body;
  try {
    await knex('roles').insert({
      role_name,
      description,
      hierarchy_level,
      permissions: JSON.stringify(permissions),
    });
    res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_name, description, hierarchy_level, permissions } = req.body;
  try {
    await knex('roles')
      .where('id', id)
      .update({
        role_name,
        description,
        hierarchy_level,
        permissions: JSON.stringify(permissions),
      });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if role is in use
    const result = await knex('users').where('role', id).count('* as count').first();
    if (result.count > 0) {
      return res
        .status(400)
        .json({ error: 'Cannot delete role: It is currently assigned to users.' });
    }
    await knex('roles').where('id', id).del();
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

// --- REPORTS SECTION (Refactored to use knex.raw for complex queries while maintaining compatibility) ---

exports.getUsersReport = async (req, res) => {
  try {
    const [userStats] = await knex.raw(`
      SELECT COUNT(*) as total_users, SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as it_admins,
        SUM(CASE WHEN role = 2 THEN 1 ELSE 0 END) as clerks,
        SUM(CASE WHEN role = 3 THEN 1 ELSE 0 END) as blotter_officers,
        SUM(CASE WHEN role = 4 THEN 1 ELSE 0 END) as residents,
        SUM(CASE WHEN role = 5 THEN 1 ELSE 0 END) as captains,
        SUM(CASE WHEN role = 6 THEN 1 ELSE 0 END) as secretaries,
        AVG(DATEDIFF(CURDATE(), DATE(created_at))) as avg_account_age_days
      FROM users
    `);

    const [recentRegs] = await knex.raw(`
      SELECT COUNT(*) as recent_registrations FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    // Login Statistics
    let loginStats = { total_attempts: 0, successful_logins: 0, failed_logins: 0 };
    try {
      const [lStats] = await knex.raw(`
        SELECT COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_logins,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_logins
        FROM login_attempts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);
      if (lStats && lStats[0]) loginStats = lStats[0];
    } catch (e) {
      console.warn('Login stats query failed', e);
    }

    // Recent Users
    const [recentUsers] = await knex.raw(`
      SELECT id, username, role, is_active, created_at 
      FROM users ORDER BY created_at DESC LIMIT 5
    `);

    const stats = userStats[0];
    res.json({
      user_statistics: {
        total_users: stats.total_users || 0,
        active_users: stats.active_users || 0,
        inactive_users: stats.inactive_users || 0,
        recent_registrations: recentRegs[0].recent_registrations || 0,
        role_breakdown: {
          it_admins: stats.it_admins || 0,
          clerks: stats.clerks || 0,
          blotter_officers: stats.blotter_officers || 0,
          residents: stats.residents || 0,
          captains: stats.captains || 0,
          secretaries: stats.secretaries || 0,
        },
        firebase_users: stats.firebase_users || 0,
        avg_account_age_days: Math.round(stats.avg_account_age_days || 0),
      },
      login_statistics: {
        total_attempts: loginStats.total_attempts || 0,
        successful_logins: loginStats.successful_logins || 0,
        failed_logins: loginStats.failed_logins || 0,
      },
      recent_users: recentUsers,
      generated_at: new Date().toISOString(),
      report_type: 'user_management',
    });
  } catch (error) {
    console.error('Error generating users report:', error);
    res.status(500).json({ error: 'Failed to generate users report' });
  }
};

exports.getBlotterReport = async (req, res) => {
  try {
    const [blotterStats] = await knex.raw(`
      SELECT COUNT(*) as total_cases,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_cases,
        SUM(CASE WHEN status = 'Dismissed' THEN 1 ELSE 0 END) as dismissed_cases,
        AVG(DATEDIFF(CURDATE(), DATE(created_at))) as avg_case_age_days,
        SUM(CASE WHEN respondent_id IS NOT NULL THEN 1 ELSE 0 END) as cases_with_respondents
      FROM blotter
    `);

    const [caseTypes] = await knex.raw(`
      SELECT Incident_Type, COUNT(*) as count FROM blotter GROUP BY Incident_Type ORDER BY count DESC
    `);

    const [recentCases] = await knex.raw(`
      SELECT COUNT(*) as recent_cases FROM blotter WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [monthlyTrends] = await knex.raw(`
      SELECT YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as cases_count 
      FROM blotter 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at) 
      ORDER BY year DESC, month DESC
    `);

    const [activeLocations] = await knex.raw(`
      SELECT Location_Sitio, COUNT(*) as incidents 
      FROM blotter 
      GROUP BY Location_Sitio 
      ORDER BY incidents DESC LIMIT 5
    `);

    const stats = blotterStats[0];
    res.json({
      blotter_statistics: {
        total_cases: stats.total_cases || 0,
        active_cases: stats.pending_cases || 0,
        resolved_cases: stats.resolved_cases || 0,
        dismissed_cases: stats.dismissed_cases || 0,
        recent_cases: recentCases[0].recent_cases || 0,
        avg_case_age_days: Math.round(stats.avg_case_age_days || 0),
        cases_with_respondents: stats.cases_with_respondents || 0,
        resolution_rate:
          stats.total_cases > 0
            ? Math.round(((stats.resolved_cases + stats.dismissed_cases) / stats.total_cases) * 100)
            : 0,
      },
      incident_types: caseTypes.map(ct => ({ type: ct.Incident_Type, count: ct.count })),
      monthly_trends: monthlyTrends,
      active_locations: activeLocations,
      generated_at: new Date().toISOString(),
      report_type: 'blotter_cases',
    });
  } catch (error) {
    console.error('Error generating blotter report:', error);
    res.status(500).json({ error: 'Failed to generate blotter report' });
  }
};

exports.getCertificatesReport = async (req, res) => {
  try {
    const [certStats] = await knex.raw(`
      SELECT COUNT(*) as total_certificates, COUNT(DISTINCT certificate_type) as unique_types,
        SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released_certificates,
        AVG(DATEDIFF(CURDATE(), DATE(date_issued))) as avg_certificate_age_days
      FROM certificates_log WHERE date_issued IS NOT NULL
    `);

    // Fetch pending requests from document_requests table
    const [pendingReqs] = await knex.raw(`
        SELECT COUNT(*) as count FROM document_requests WHERE status = 'pending'
    `);

    const [certTypes] = await knex.raw(`
      SELECT certificate_type, COUNT(*) as count FROM certificates_log GROUP BY certificate_type ORDER BY count DESC
    `);

    const [recentCerts] = await knex.raw(`
      SELECT COUNT(*) as recent_certificates FROM certificates_log WHERE date_issued >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [monthlyIssuance] = await knex.raw(`
      SELECT YEAR(date_issued) as year, MONTH(date_issued) as month, COUNT(*) as certificates_count 
      FROM certificates_log 
      WHERE date_issued IS NOT NULL AND date_issued >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY YEAR(date_issued), MONTH(date_issued) 
      ORDER BY year DESC, month DESC
    `);

    // Top Issuers from Audit Logs
    let topIssuers = [];
    try {
      const [issuers] = await knex.raw(`
            SELECT u.full_name, u.username, COUNT(*) as issued_count
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE a.entity_type = 'certificate' AND a.action LIKE '%Issued%'
            GROUP BY u.id, u.full_name, u.username
            ORDER BY issued_count DESC
            LIMIT 5
        `);
      topIssuers = issuers;
    } catch (e) {
      console.warn('Failed to fetch top issuers from audit logs:', e);
    }

    const stats = certStats[0];
    res.json({
      certificate_statistics: {
        total_certificates: stats.total_certificates || 0,
        unique_types: stats.unique_types || 0,
        released_certificates: stats.released_certificates || 0,
        pending_certificates: pendingReqs[0].count || 0,
        recent_certificates: recentCerts[0].recent_certificates || 0,
        avg_certificate_age_days: Math.round(stats.avg_certificate_age_days || 0),
      },
      certificate_types: certTypes.map(ct => ({ type: ct.certificate_type, count: ct.count })),
      monthly_issuance: monthlyIssuance,
      top_issuers: topIssuers,
      generated_at: new Date().toISOString(),
      report_type: 'certificates',
    });
  } catch (error) {
    console.error('Error generating certificates report:', error);
    res.status(500).json({ error: 'Failed to generate certificates report' });
  }
};

exports.getResidentsReport = async (req, res) => {
  try {
    const [residentStats] = await knex.raw(`
      SELECT COUNT(*) as total_residents,
        SUM(CASE WHEN Residency_Status = 'Active' THEN 1 ELSE 0 END) as active_residents,
        SUM(CASE WHEN Residency_Status = 'Pending' THEN 1 ELSE 0 END) as pending_residents,
        SUM(CASE WHEN Residency_Status = 'Transferred Out' THEN 1 ELSE 0 END) as transferred_residents,
        AVG(DATEDIFF(CURDATE(), DATE(Date_Arrival))) as avg_residency_days,
        SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as male_residents,
        SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as female_residents
      FROM residents
    `);

    const [vulnerableStats] = await knex.raw(`
      SELECT SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as solo_parents,
        SUM(CASE WHEN v.Is_4Ps = 1 THEN 1 ELSE 0 END) as four_ps
      FROM residents r LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    const [recentResidents] = await knex.raw(`
      SELECT COUNT(*) as recent_residents FROM residents WHERE Date_Arrival >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [ageDemographics] = await knex.raw(`
        SELECT 
            SUM(CASE WHEN TIMESTAMPDIFF(YEAR, Birthdate, CURDATE()) < 18 THEN 1 ELSE 0 END) as minors,
            SUM(CASE WHEN TIMESTAMPDIFF(YEAR, Birthdate, CURDATE()) BETWEEN 18 AND 59 THEN 1 ELSE 0 END) as adults,
            SUM(CASE WHEN TIMESTAMPDIFF(YEAR, Birthdate, CURDATE()) >= 60 THEN 1 ELSE 0 END) as seniors
        FROM residents
    `);

    const [verificationStatus] = await knex.raw(`
        SELECT 
            SUM(CASE WHEN Residency_Status = 'Active' THEN 1 ELSE 0 END) as verified_residents,
            SUM(CASE WHEN Residency_Status = 'Pending' THEN 1 ELSE 0 END) as pending_verification,
            SUM(CASE WHEN Residency_Status NOT IN ('Active', 'Pending') THEN 1 ELSE 0 END) as unverified_residents
        FROM residents
    `);

    const [sitioDistribution] = await knex.raw(`
        SELECT s.name as sitio_name, COUNT(*) as resident_count 
        FROM residents r 
        JOIN households h ON r.Household_ID = h.Household_ID 
        JOIN sitios s ON h.Sitio_ID = s.id 
        GROUP BY s.name 
        ORDER BY resident_count DESC
    `);

    const stats = residentStats[0];
    const vuln = vulnerableStats[0];
    res.json({
      resident_statistics: {
        total_residents: stats.total_residents || 0,
        active_residents: stats.active_residents || 0,
        pending_residents: stats.pending_residents || 0,
        transferred_residents: stats.transferred_residents || 0,
        recent_residents: recentResidents[0].recent_residents || 0,
        avg_residency_days: Math.round(stats.avg_residency_days || 0),
        gender_distribution: {
          male: stats.male_residents || 0,
          female: stats.female_residents || 0,
        },
        vulnerable_groups: {
          seniors: vuln.seniors || 0,
          pwds: vuln.pwds || 0,
          solo_parents: vuln.solo_parents || 0,
          four_ps: vuln.four_ps || 0,
        },
        total_households: 0,
      },
      age_demographics: ageDemographics[0] || { minors: 0, adults: 0, seniors: 0 },
      verification_status: verificationStatus[0] || {
        verified_residents: 0,
        pending_verification: 0,
        unverified_residents: 0,
      },
      sitio_distribution: sitioDistribution,
      generated_at: new Date().toISOString(),
      report_type: 'residents',
    });
  } catch (error) {
    console.error('Error generating residents report:', error);
    res.status(500).json({ error: 'Failed to generate residents report' });
  }
};

exports.getSystemReport = async (req, res) => {
  try {
    let dbStatus = 'healthy',
      dbResponseTime = 0;
    const dbStartTime = Date.now();
    try {
      await knex.raw('SELECT 1');
      dbResponseTime = Date.now() - dbStartTime;
    } catch (dbError) {
      dbStatus = 'unhealthy';
    }

    let dbSize = 'Unknown';
    try {
      const [sizeResult] = await knex.raw(`
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
        FROM information_schema.tables WHERE table_schema = DATABASE()
      `);
      dbSize = `${sizeResult[0].size_mb || 0} MB`;
    } catch (sizeError) {}

    const tableCounts = {};
    const tables = ['users', 'residents', 'blotter', 'certificates_log', 'households', 'sitios'];
    for (const table of tables) {
      try {
        const [count] = await knex.raw(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = count[0].count || 0;
      } catch (countError) {
        tableCounts[table] = 'Error';
      }
    }

    const dbTables = tables.map(t => ({
      table_name: t,
      record_count: tableCounts[t],
      status: tableCounts[t] !== 'Error' ? 'accessible' : 'error',
    }));

    res.json({
      database_health: {
        status: dbStatus,
        response_time_ms: dbResponseTime,
        size: dbSize,
        tables: dbTables,
      },
      system_info: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        environment: process.env.NODE_ENV || 'development',
      },
      api_health: {
        '/api/users': 'operational',
        '/api/residents': 'operational',
        '/api/blotter': 'operational',
        '/api/certificates': 'operational',
        '/api/auth': 'operational',
      },
      generated_at: new Date().toISOString(),
      report_type: 'system_health',
    });
  } catch (error) {
    console.error('Error generating system health report:', error);
    res.status(500).json({ error: 'Failed to generate system health report' });
  }
};

exports.getSecurityReport = async (req, res) => {
  try {
    let loginStats = {
      total_attempts_30d: 0,
      successful_attempts_30d: 0,
      failed_attempts_30d: 0,
      unique_users_30d: 0,
      unique_ips_30d: 0,
    };
    let failedByIP = [];

    try {
      const [statsResult] = await knex.raw(`
        SELECT COUNT(*) as total_attempts_30d,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attempts_30d,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts_30d,
          COUNT(DISTINCT user_id) as unique_users_30d,
          COUNT(DISTINCT ip_address) as unique_ips_30d,
          COUNT(DISTINCT CASE WHEN user_id IS NOT NULL THEN user_id END) as unique_users_attempted
        FROM login_attempts WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);
      loginStats = statsResult[0] || loginStats;

      const [failedResult] = await knex.raw(`
        SELECT ip_address, COUNT(*) as failed_count FROM login_attempts
        WHERE success = 0 AND created_at >= DATE_SUB(CURDATE(), INTERVAL 24 HOUR)
        GROUP BY ip_address HAVING failed_count >= 3 ORDER BY failed_count DESC LIMIT 10
      `);
      failedByIP = failedResult || [];
    } catch (tableError) {}

    // ClearPass Security
    let clearpassStats = { total_blotter_cases: 0, cases_with_residents: 0, active_blocks: 0 };
    try {
      const [cpStats] = await knex.raw(`
            SELECT 
                (SELECT COUNT(*) FROM blotter) as total_blotter_cases,
                (SELECT COUNT(*) FROM blotter WHERE respondent_id IS NOT NULL) as cases_with_residents,
                (SELECT COUNT(*) FROM users WHERE is_active = 0) as active_blocks
        `);
      if (cpStats && cpStats[0]) clearpassStats = cpStats[0];
    } catch (e) {}

    // Failed Login Sources
    let failedSources = [];
    try {
      const [fs] = await knex.raw(`
            SELECT username, ip_address, COUNT(*) as attempts 
            FROM login_attempts 
            WHERE success = 0 
            GROUP BY username, ip_address 
            ORDER BY attempts DESC LIMIT 5
        `);
      failedSources = fs;
    } catch (e) {}

    // Security Events (Audit Logs)
    let securityEvents = [];
    try {
      const [se] = await knex.raw(`
            SELECT event_type as event, 'medium' as severity, created_at as timestamp 
            FROM audit_logs 
            ORDER BY created_at DESC LIMIT 5
        `);
      securityEvents = se;
    } catch (e) {}

    const stats = loginStats;
    res.json({
      security_overview: {
        total_attempts_30d: stats.total_attempts_30d || 0,
        successful_attempts_30d: stats.successful_attempts_30d || 0,
        failed_attempts_30d: stats.failed_attempts_30d || 0,
        success_rate_30d:
          stats.total_attempts_30d > 0
            ? Math.round((stats.successful_attempts_30d / stats.total_attempts_30d) * 100)
            : 100,
        unique_users_30d: stats.unique_users_30d || 0,
        unique_ips_30d: stats.unique_ips_30d || 0,
        unique_users_attempted: stats.unique_users_attempted || 0,
      },
      suspicious_activity: {
        high_failure_ips: failedByIP.map(ip => ({
          ip: ip.ip_address,
          failed_attempts: ip.failed_count,
        })),
      },
      clearpass_security: clearpassStats,
      failed_login_sources: failedSources,
      security_events: securityEvents,
      generated_at: new Date().toISOString(),
      report_type: 'security_audit',
    });
  } catch (error) {
    console.error('Error generating security audit report:', error);
    res.status(500).json({ error: 'Failed to generate security audit report' });
  }
};

exports.getDetailedUsersReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, role, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [],
      values = [];
    if (dateFrom) {
      whereConditions.push('u.created_at >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('u.created_at <= ?');
      values.push(dateTo + ' 23:59:59');
    }
    if (status === 'active') whereConditions.push('u.is_active = true');
    else if (status === 'inactive') whereConditions.push('u.is_active = false');
    if (role) {
      whereConditions.push('u.role = ?');
      values.push(parseInt(role));
    }
    if (search) {
      whereConditions.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [users] = await knex.raw(
      `
      SELECT u.id, u.username, u.full_name, u.email, u.contact_number, u.role, u.is_active, u.last_login, u.created_at,
             COALESCE(r.role_name, CONCAT('Role ', u.role)) as role_name
      FROM users u
      LEFT JOIN roles r ON u.role = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), offset]
    );

    const [totalResult] = await knex.raw(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      values
    );

    res.json({
      columns: [
        'ID',
        'Username',
        'Full Name',
        'Email',
        'Contact',
        'Role',
        'Status',
        'Created',
        'Last Login',
      ],
      data: users.map(u => [
        u.id,
        u.username,
        u.full_name || 'N/A',
        u.email || 'N/A',
        u.contact_number || 'N/A',
        u.role_name,
        u.is_active ? 'Active' : 'Inactive',
        new Date(u.created_at).toLocaleDateString(),
        u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never',
      ]),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit),
      },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_users',
    });
  } catch (error) {
    console.error('Error generating detailed users report:', error);
    res.status(500).json({ error: 'Failed to generate detailed users report' });
  }
};

exports.getDetailedBlotterReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [],
      values = [];
    if (dateFrom) {
      whereConditions.push('b.created_at >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('b.created_at <= ?');
      values.push(dateTo + ' 23:59:59');
    }
    if (status) {
      whereConditions.push('b.Status = ?');
      values.push(status);
    }
    if (search) {
      whereConditions.push(
        '(b.Case_Number LIKE ? OR b.Incident_Type LIKE ? OR b.Complainant_Details LIKE ?)'
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [blotters] = await knex.raw(
      `
      SELECT b.*, s.name as sitio_name, r.First_Name as respondent_first_name, r.Last_Name as respondent_last_name
      FROM blotter b LEFT JOIN sitios s ON b.Location_Sitio = s.name LEFT JOIN residents r ON b.respondent_id = r.Resident_ID
      ${whereClause} ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), offset]
    );

    const [totalResult] = await knex.raw(
      `SELECT COUNT(*) as total FROM blotter b ${whereClause}`,
      values
    );

    res.json({
      columns: [
        'Case Number',
        'Incident Type',
        'Status',
        'Location',
        'Date Reported',
        'Complainant',
        'Respondent',
      ],
      data: blotters.map(b => [
        b.Case_Number || 'N/A',
        b.Incident_Type || 'N/A',
        b.Status || 'N/A',
        b.Location_Sitio || 'N/A',
        b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A',
        b.Complainant_Details ? 'Details Available' : 'N/A',
        b.respondent_id
          ? `${b.respondent_first_name || ''} ${b.respondent_last_name || ''}`.trim() || 'N/A'
          : 'N/A',
      ]),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit),
      },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_blotter',
    });
  } catch (error) {
    console.error('Error generating detailed blotter report:', error);
    res.status(500).json({ error: 'Failed to generate detailed blotter report' });
  }
};

exports.getDetailedCertificatesReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [],
      values = [];
    if (dateFrom) {
      whereConditions.push('c.created_at >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('c.created_at <= ?');
      values.push(dateTo + ' 23:59:59');
    }
    if (status) {
      whereConditions.push('c.status = ?');
      values.push(status);
    }
    if (search) {
      whereConditions.push(
        '(c.control_no LIKE ? OR c.certificate_type LIKE ? OR r.First_Name LIKE ? OR r.Last_Name LIKE ?)'
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [certificates] = await knex.raw(
      `
      SELECT c.control_no, c.certificate_type, c.purpose, c.status, c.date_issued, c.created_at,
        CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c LEFT JOIN residents r ON c.resident_id = r.Resident_ID
      ${whereClause} ORDER BY c.created_at DESC LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), offset]
    );

    const [totalResult] = await knex.raw(
      `SELECT COUNT(*) as total FROM certificates_log c LEFT JOIN residents r ON c.resident_id = r.Resident_ID ${whereClause}`,
      values
    );

    res.json({
      columns: [
        'Control No',
        'Certificate Type',
        'Resident',
        'Purpose',
        'Status',
        'Date Issued',
        'Issued By',
      ],
      data: certificates.map(c => [
        c.control_no || 'N/A',
        c.certificate_type || 'N/A',
        c.resident_name || 'N/A',
        c.purpose || 'N/A',
        c.status || 'N/A',
        c.date_issued ? new Date(c.date_issued).toLocaleDateString() : 'N/A',
        c.issued_by || 'System',
      ]),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit),
      },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_certificates',
    });
  } catch (error) {
    console.error('Error generating detailed certificates report:', error);
    res.status(500).json({ error: 'Failed to generate detailed certificates report' });
  }
};

exports.getDetailedResidentsReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [],
      values = [];
    if (dateFrom) {
      whereConditions.push('r.Date_Arrival >= ?');
      values.push(dateFrom);
    }
    if (dateTo) {
      whereConditions.push('r.Date_Arrival <= ?');
      values.push(dateTo);
    }
    if (status) {
      whereConditions.push('r.Residency_Status = ?');
      values.push(status);
    }
    if (search) {
      whereConditions.push(
        '(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ? OR r.Email LIKE ?)'
      );
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [residents] = await knex.raw(
      `
      SELECT r.Resident_ID, r.First_Name, r.Last_Name, r.Gender, r.Birthdate, r.Civil_Status, r.Residency_Status,
        h.Household_Number, s.name as sitio_name
      FROM residents r LEFT JOIN households h ON r.Household_ID = h.Household_ID LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ${whereClause} ORDER BY r.Last_Name, r.First_Name LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), offset]
    );

    const [totalResult] = await knex.raw(
      `SELECT COUNT(*) as total FROM residents r LEFT JOIN households h ON r.Household_ID = h.Household_ID ${whereClause}`,
      values
    );

    res.json({
      columns: [
        'Resident ID',
        'Name',
        'Gender',
        'Birthdate',
        'Civil Status',
        'Status',
        'Household',
        'Sitio',
      ],
      data: residents.map(r => [
        r.Resident_ID,
        `${r.First_Name} ${r.Last_Name}`,
        r.Gender || 'N/A',
        r.Birthdate ? new Date(r.Birthdate).toLocaleDateString() : 'N/A',
        r.Civil_Status || 'N/A',
        r.Residency_Status || 'N/A',
        r.Household_Number || 'N/A',
        r.sitio_name || 'N/A',
      ]),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit),
      },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_residents',
    });
  } catch (error) {
    console.error('Error generating detailed residents report:', error);
    res.status(500).json({ error: 'Failed to generate detailed residents report' });
  }
};

exports.generatePDFReport = async (req, res) => {
  const { type } = req.params;
  const { dateFrom, dateTo, status, role, search } = req.query;

  try {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}_report_${new Date().toISOString().split('T')[0]}.pdf`
    );

    doc.pipe(res);

    // Helper to draw header
    const drawHeader = title => {
      doc.fontSize(20).text('THEMIS ClearPass', { align: 'center' });
      doc.fontSize(12).text('Barangay Management System', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(title, { align: 'center' });
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    };

    if (type === 'users') {
      drawHeader('User Management Report');
      const [userStats] = await knex.raw(`
            SELECT COUNT(*) as total_users, 
                   SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users,
                   SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as admins,
                   SUM(CASE WHEN role = 12 THEN 1 ELSE 0 END) as residents
            FROM users
        `);
      const stats = userStats[0];

      doc.fontSize(12).text('Summary Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Total Users: ${stats.total_users}`);
      doc.text(`Active Users: ${stats.active_users}`);
      doc.text(`IT Admins: ${stats.admins}`);
      doc.text(`Residents: ${stats.residents}`);
      doc.moveDown();

      let query = 'SELECT username, full_name, role, is_active, created_at FROM users';
      let conditions = [];
      let values = [];
      if (role) {
        conditions.push('role = ?');
        values.push(role);
      }
      if (status === 'active') conditions.push('is_active = true');
      if (status === 'inactive') conditions.push('is_active = false');
      if (search) {
        conditions.push('(username LIKE ? OR full_name LIKE ?)');
        values.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
      query += ' ORDER BY created_at DESC LIMIT 100';

      const [users] = await knex.raw(query, values);

      doc.text('Recent/Filtered Users (Top 100)', { underline: true });
      doc.moveDown();

      // Table Configuration
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 200;
      const col3X = 350;
      const col4X = 450;
      const rowHeight = 20;

      // Draw Table Header
      doc.font('Helvetica-Bold');
      doc.text('Username', col1X, tableTop);
      doc.text('Full Name', col2X, tableTop);
      doc.text('Status', col3X, tableTop);
      doc.text('Role', col4X, tableTop);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      let y = doc.y + 5;
      doc.font('Helvetica');

      users.forEach(u => {
        // Check for page break
        if (y > 700) {
          doc.addPage();
          y = 50; // Reset Y position for new page
        }

        doc.text(u.username, col1X, y);
        doc.text(u.full_name || 'N/A', col2X, y);
        doc.text(u.is_active ? 'Active' : 'Inactive', col3X, y);
        doc.text(u.role.toString(), col4X, y);

        y += rowHeight;
      });
    } else if (type === 'blotter') {
      drawHeader('Blotter Cases Report');
      const [blotterStats] = await knex.raw(`
             SELECT COUNT(*) as total, 
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
             FROM blotter
        `);
      const stats = blotterStats[0];
      doc.text(`Total Cases: ${stats.total}`);
      doc.text(`Pending: ${stats.pending}`);
      doc.text(`Resolved: ${stats.resolved}`);
      doc.moveDown();

      const [cases] = await knex.raw(
        'SELECT Case_Number, Incident_Type, Status, Location_Sitio, created_at FROM blotter ORDER BY created_at DESC LIMIT 100'
      );
      doc.text('Recent Cases:', { underline: true });
      doc.moveDown();
      cases.forEach(c => {
        doc.text(`${c.Case_Number} | ${c.Incident_Type} | ${c.Status} | ${c.Location_Sitio}`);
      });
    } else if (type === 'certificates') {
      drawHeader('Certificates Issuance Report');
      const [certStats] = await knex.raw(
        'SELECT COUNT(*) as total, SUM(CASE WHEN status="Released" THEN 1 ELSE 0 END) as released FROM certificates_log'
      );
      doc.text(`Total Certificates: ${certStats[0].total}`);
      doc.text(`Released: ${certStats[0].released}`);
      doc.moveDown();

      const [certs] = await knex.raw(
        'SELECT control_no, certificate_type, status, date_issued FROM certificates_log ORDER BY created_at DESC LIMIT 100'
      );
      doc.text('Recent Certificates:', { underline: true });
      doc.moveDown();
      certs.forEach(c => {
        doc.text(`${c.control_no} | ${c.certificate_type} | ${c.status}`);
      });
    } else if (type === 'residents') {
      drawHeader('Residents Report');
      const [resStats] = await knex.raw(
        'SELECT COUNT(*) as total, SUM(CASE WHEN Residency_Status="Active" THEN 1 ELSE 0 END) as active FROM residents'
      );
      doc.text(`Total Residents: ${resStats[0].total}`);
      doc.text(`Active Residents: ${resStats[0].active}`);
      doc.moveDown();

      const [residents] = await knex.raw(
        'SELECT First_Name, Last_Name, Residency_Status FROM residents ORDER BY created_at DESC LIMIT 100'
      );
      doc.text('Recent Residents:', { underline: true });
      doc.moveDown();
      residents.forEach(r => {
        doc.text(`${r.First_Name} ${r.Last_Name} - ${r.Residency_Status}`);
      });
    } else if (type === 'system') {
      drawHeader('System Health Report');
      doc.text(`Uptime: ${process.uptime().toFixed(2)} seconds`);
      doc.text(`Memory Usage (RSS): ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);
      doc.text(`Node Version: ${process.version}`);
      doc.text(`Platform: ${process.platform}`);
      doc.moveDown();

      try {
        const [size] = await knex.raw(
          `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb FROM information_schema.tables WHERE table_schema = DATABASE()`
        );
        doc.text(`Database Size: ${size[0].size_mb} MB`);
      } catch (e) {
        doc.text('Database Size: Unavailable');
      }
    } else if (type === 'security') {
      drawHeader('Security Audit Report');
      const [logStats] = await knex.raw(
        'SELECT COUNT(*) as total, SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) as failed FROM login_attempts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      doc.text(`Login Attempts (Last 30 Days): ${logStats[0].total}`);
      doc.text(`Failed Attempts: ${logStats[0].failed}`);
      doc.moveDown();

      const [logs] = await knex.raw(
        'SELECT event_type, user_role, ip_address, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 50'
      );
      doc.text('Recent Security Events:', { underline: true });
      doc.moveDown();
      logs.forEach(l => {
        doc.text(`[${new Date(l.created_at).toLocaleString()}] ${l.event_type} - ${l.ip_address}`);
      });
    } else if (type === 'ai') {
      const reportType = req.query.report_type || 'incident_analysis';
      drawHeader(`AI Analytics: ${reportType.replace(/_/g, ' ').toUpperCase()}`);

      // 1. Dashboard Summary Data
      const [activeCases] = await knex.raw(`
        SELECT COUNT(*) as count 
        FROM blotter 
        WHERE Status IN ('Pending', 'Active', 'Under Investigation', 'Hearing Scheduled')
      `);

      const [incidents30d] = await knex.raw(`
        SELECT COUNT(*) as count 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      const [highRiskAreas] = await knex.raw(`
        SELECT Location_Sitio, COUNT(*) as count 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY Location_Sitio 
        ORDER BY count DESC 
        LIMIT 5
      `);

      doc.fontSize(12).text('Dashboard Overview', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Active Cases: ${activeCases[0].count}`);
      doc.text(`Total Incidents (30d): ${incidents30d[0].count}`);
      doc.moveDown();

      // 2. High Risk Areas
      if (highRiskAreas.length > 0) {
        doc.text('High Risk Areas (Top 5):');
        highRiskAreas.forEach((area, i) => {
          doc.text(`${i + 1}. ${area.Location_Sitio} - ${area.count} incidents`);
        });
        doc.moveDown();
      }

      // 3. Report Specific Data
      if (reportType === 'incident_analysis' || reportType === 'trend_analysis') {
        doc.text('Incident Trends (Last 30 Days)', { underline: true });
        doc.moveDown();

        const [dailyTrends] = await knex.raw(`
          SELECT DATE(created_at) as date, COUNT(*) as count 
          FROM blotter 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at) 
          ORDER BY date DESC
        `);

        dailyTrends.forEach(d => {
          doc.text(`${new Date(d.date).toLocaleDateString()}: ${d.count} incidents`);
        });
      } else if (reportType === 'predictive_forecast') {
        doc.text('Predictive Forecast & Patterns', { underline: true });
        doc.moveDown();
        doc.text('Based on historical data analysis (Last 90 Days):');
        doc.moveDown();

        // Hourly Patterns
        const [peakHours] = await knex.raw(`
          SELECT HOUR(DateTime_Incident) as hour, COUNT(*) as count 
          FROM blotter 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          AND DateTime_Incident IS NOT NULL
          GROUP BY hour 
          ORDER BY count DESC 
          LIMIT 3
        `);

        if (peakHours.length > 0) {
          doc.text(
            `Peak Incident Hours: ${peakHours.map(h => `${h.hour}:00 (${h.count})`).join(', ')}`
          );
        } else {
          doc.text('Not enough data for peak hour analysis.');
        }
        doc.moveDown();

        doc.text(
          'Forecast: Expect continued activity in high-risk areas during peak hours. Recommended increased visibility.'
        );
      } else if (reportType === 'resource_allocation') {
        doc.text('Resource Allocation Recommendations', { underline: true });
        doc.moveDown();

        doc.text('Suggested Deployment:');
        highRiskAreas.forEach(area => {
          const count = area.count;
          let suggestion = 'Standard Patrol';
          if (count >= 5) suggestion = 'Permanent Outpost / High Frequency Patrol';
          else if (count >= 2) suggestion = 'Regular Roving Patrol';

          doc.text(`- ${area.Location_Sitio}: ${suggestion}`);
        });
      }
    } else {
      doc.text('Unknown Report Type');
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
