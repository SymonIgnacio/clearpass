exports.getUsersReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [userStats] = await db.execute(`
      SELECT COUNT(*) as total_users, SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN role = 1 THEN 1 ELSE 0 END) as it_admins,
        SUM(CASE WHEN role = 2 THEN 1 ELSE 0 END) as clerks,
        SUM(CASE WHEN role = 3 THEN 1 ELSE 0 END) as blotter_officers,
        SUM(CASE WHEN role = 4 THEN 1 ELSE 0 END) as residents,
        SUM(CASE WHEN role = 5 THEN 1 ELSE 0 END) as captains,
        SUM(CASE WHEN role = 6 THEN 1 ELSE 0 END) as secretaries,
        SUM(CASE WHEN firebase_uid IS NOT NULL THEN 1 ELSE 0 END) as firebase_users,
        AVG(DATEDIFF(CURDATE(), DATE(created_at))) as avg_account_age_days
      FROM users
    `);

    const [recentRegs] = await db.execute(`
      SELECT COUNT(*) as recent_registrations FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
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
          secretaries: stats.secretaries || 0
        },
        firebase_users: stats.firebase_users || 0,
        avg_account_age_days: Math.round(stats.avg_account_age_days || 0)
      },
      generated_at: new Date().toISOString(),
      report_type: 'user_management'
    });
  } catch (error) {
    console.error('Error generating users report:', error);
    res.status(500).json({ error: 'Failed to generate users report' });
  }
};

exports.getBlotterReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [blotterStats] = await db.execute(`
      SELECT COUNT(*) as total_cases,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_cases,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_cases,
        SUM(CASE WHEN status = 'Dismissed' THEN 1 ELSE 0 END) as dismissed_cases,
        AVG(DATEDIFF(CURDATE(), DATE(created_at))) as avg_case_age_days,
        SUM(CASE WHEN respondent_id IS NOT NULL THEN 1 ELSE 0 END) as cases_with_respondents
      FROM blotter
    `);

    const [caseTypes] = await db.execute(`
      SELECT Incident_Type, COUNT(*) as count FROM blotter GROUP BY Incident_Type ORDER BY count DESC
    `);

    const [recentCases] = await db.execute(`
      SELECT COUNT(*) as recent_cases FROM blotter WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
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
        resolution_rate: stats.total_cases > 0 ? Math.round(((stats.resolved_cases + stats.dismissed_cases) / stats.total_cases) * 100) : 0
      },
      incident_types: caseTypes.map(ct => ({ type: ct.Incident_Type, count: ct.count })),
      generated_at: new Date().toISOString(),
      report_type: 'blotter_cases'
    });
  } catch (error) {
    console.error('Error generating blotter report:', error);
    res.status(500).json({ error: 'Failed to generate blotter report' });
  }
};

exports.getCertificatesReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [certStats] = await db.execute(`
      SELECT COUNT(*) as total_certificates, COUNT(DISTINCT certificate_type) as unique_types,
        SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released_certificates,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_certificates,
        AVG(DATEDIFF(CURDATE(), DATE(date_issued))) as avg_certificate_age_days
      FROM certificates_log WHERE date_issued IS NOT NULL
    `);

    const [certTypes] = await db.execute(`
      SELECT certificate_type, COUNT(*) as count FROM certificates_log GROUP BY certificate_type ORDER BY count DESC
    `);

    const [recentCerts] = await db.execute(`
      SELECT COUNT(*) as recent_certificates FROM certificates_log WHERE date_issued >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const stats = certStats[0];
    res.json({
      certificate_statistics: {
        total_certificates: stats.total_certificates || 0,
        unique_types: stats.unique_types || 0,
        released_certificates: stats.released_certificates || 0,
        pending_certificates: stats.pending_certificates || 0,
        recent_certificates: recentCerts[0].recent_certificates || 0,
        avg_certificate_age_days: Math.round(stats.avg_certificate_age_days || 0)
      },
      certificate_types: certTypes.map(ct => ({ type: ct.certificate_type, count: ct.count })),
      generated_at: new Date().toISOString(),
      report_type: 'certificates'
    });
  } catch (error) {
    console.error('Error generating certificates report:', error);
    res.status(500).json({ error: 'Failed to generate certificates report' });
  }
};

exports.getResidentsReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [residentStats] = await db.execute(`
      SELECT COUNT(*) as total_residents,
        SUM(CASE WHEN Residency_Status = 'Active' THEN 1 ELSE 0 END) as active_residents,
        SUM(CASE WHEN Residency_Status = 'Pending' THEN 1 ELSE 0 END) as pending_residents,
        SUM(CASE WHEN Residency_Status = 'Transferred Out' THEN 1 ELSE 0 END) as transferred_residents,
        AVG(DATEDIFF(CURDATE(), DATE(Date_Arrival))) as avg_residency_days,
        SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as male_residents,
        SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as female_residents
      FROM residents
    `);

    const [vulnerableStats] = await db.execute(`
      SELECT SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors,
        SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwds,
        SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as solo_parents,
        SUM(CASE WHEN v.Is_4Ps = 1 THEN 1 ELSE 0 END) as four_ps
      FROM residents r LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
    `);

    const [recentResidents] = await db.execute(`
      SELECT COUNT(*) as recent_residents FROM residents WHERE Date_Arrival >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
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
        gender_distribution: { male: stats.male_residents || 0, female: stats.female_residents || 0 },
        vulnerable_groups: { seniors: vuln.seniors || 0, pwds: vuln.pwds || 0, solo_parents: vuln.solo_parents || 0, four_ps: vuln.four_ps || 0 }
      },
      generated_at: new Date().toISOString(),
      report_type: 'residents'
    });
  } catch (error) {
    console.error('Error generating residents report:', error);
    res.status(500).json({ error: 'Failed to generate residents report' });
  }
};

exports.getSystemReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    let dbStatus = 'healthy', dbResponseTime = 0;
    const dbStartTime = Date.now();
    try {
      await db.execute('SELECT 1');
      dbResponseTime = Date.now() - dbStartTime;
    } catch (dbError) {
      dbStatus = 'unhealthy';
    }

    let dbSize = 'Unknown';
    try {
      const [sizeResult] = await db.execute(`
        SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
        FROM information_schema.tables WHERE table_schema = DATABASE()
      `);
      dbSize = `${sizeResult[0].size_mb || 0} MB`;
    } catch (sizeError) {}

    const tableCounts = {};
    const tables = ['users', 'residents', 'blotter', 'certificates_log', 'households', 'sitios'];
    for (const table of tables) {
      try {
        const [count] = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        tableCounts[table] = count[0].count || 0;
      } catch (countError) {
        tableCounts[table] = 'Error';
      }
    }

    res.json({
      database_health: { status: dbStatus, response_time_ms: dbResponseTime, size: dbSize },
      table_counts: tableCounts,
      server_info: { uptime: process.uptime(), memory_usage: process.memoryUsage(), node_version: process.version, platform: process.platform },
      generated_at: new Date().toISOString(),
      report_type: 'system_health'
    });
  } catch (error) {
    console.error('Error generating system health report:', error);
    res.status(500).json({ error: 'Failed to generate system health report' });
  }
};

exports.getSecurityReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    let loginStats = { total_attempts_30d: 0, successful_attempts_30d: 0, failed_attempts_30d: 0, unique_users_30d: 0, unique_ips_30d: 0 };
    let failedByIP = [];

    try {
      const [statsResult] = await db.execute(`
        SELECT COUNT(*) as total_attempts_30d,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attempts_30d,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_attempts_30d,
          COUNT(DISTINCT user_id) as unique_users_30d,
          COUNT(DISTINCT ip_address) as unique_ips_30d
        FROM login_attempts WHERE attempted_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `);
      loginStats = statsResult[0] || loginStats;

      const [failedResult] = await db.execute(`
        SELECT ip_address, COUNT(*) as failed_count FROM login_attempts
        WHERE success = 0 AND attempted_at >= DATE_SUB(CURDATE(), INTERVAL 24 HOUR)
        GROUP BY ip_address HAVING failed_count >= 3 ORDER BY failed_count DESC LIMIT 10
      `);
      failedByIP = failedResult || [];
    } catch (tableError) {}

    const stats = loginStats;
    res.json({
      security_overview: {
        total_attempts_30d: stats.total_attempts_30d || 0,
        successful_attempts_30d: stats.successful_attempts_30d || 0,
        failed_attempts_30d: stats.failed_attempts_30d || 0,
        success_rate_30d: stats.total_attempts_30d > 0 ? Math.round((stats.successful_attempts_30d / stats.total_attempts_30d) * 100) : 100,
        unique_users_30d: stats.unique_users_30d || 0,
        unique_ips_30d: stats.unique_ips_30d || 0
      },
      suspicious_activity: { high_failure_ips: failedByIP.map(ip => ({ ip: ip.ip_address, failed_attempts: ip.failed_count })) },
      generated_at: new Date().toISOString(),
      report_type: 'security_audit'
    });
  } catch (error) {
    console.error('Error generating security audit report:', error);
    res.status(500).json({ error: 'Failed to generate security audit report' });
  }
};

exports.getDetailedUsersReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { dateFrom, dateTo, status, role, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [], values = [];
    if (dateFrom) { whereConditions.push('u.created_at >= ?'); values.push(dateFrom); }
    if (dateTo) { whereConditions.push('u.created_at <= ?'); values.push(dateTo + ' 23:59:59'); }
    if (status === 'active') whereConditions.push('u.is_active = true');
    else if (status === 'inactive') whereConditions.push('u.is_active = false');
    if (role) { whereConditions.push('u.role = ?'); values.push(parseInt(role)); }
    if (search) { whereConditions.push('(u.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [users] = await db.execute(`
      SELECT u.id, u.username, u.full_name, u.email, u.contact_number, u.role, u.is_active, u.last_login, u.created_at
      FROM users u ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalResult] = await db.execute(`SELECT COUNT(*) as total FROM users u ${whereClause}`, values);

    res.json({
      columns: ['ID', 'Username', 'Full Name', 'Email', 'Contact', 'Role', 'Status', 'Created', 'Last Login'],
      data: users.map(u => [u.id, u.username, u.full_name || 'N/A', u.email || 'N/A', u.contact_number || 'N/A',
        u.role === 1 ? 'IT Admin' : u.role === 2 ? 'Clerk' : u.role === 3 ? 'Blotter Officer' : u.role === 4 ? 'Resident' : u.role === 5 ? 'Captain' : u.role === 6 ? 'Secretary' : `Role ${u.role}`,
        u.is_active ? 'Active' : 'Inactive', new Date(u.created_at).toLocaleDateString(), u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never']),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: totalResult[0].total, pages: Math.ceil(totalResult[0].total / limit) },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_users'
    });
  } catch (error) {
    console.error('Error generating detailed users report:', error);
    res.status(500).json({ error: 'Failed to generate detailed users report' });
  }
};

exports.getDetailedBlotterReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [], values = [];
    if (dateFrom) { whereConditions.push('b.created_at >= ?'); values.push(dateFrom); }
    if (dateTo) { whereConditions.push('b.created_at <= ?'); values.push(dateTo + ' 23:59:59'); }
    if (status) { whereConditions.push('b.Status = ?'); values.push(status); }
    if (search) { whereConditions.push('(b.Case_Number LIKE ? OR b.Incident_Type LIKE ? OR b.Complainant_Details LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [blotters] = await db.execute(`
      SELECT b.*, s.name as sitio_name, r.First_Name as respondent_first_name, r.Last_Name as respondent_last_name
      FROM blotter b LEFT JOIN sitios s ON b.Location_Sitio = s.name LEFT JOIN residents r ON b.respondent_id = r.Resident_ID
      ${whereClause} ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalResult] = await db.execute(`SELECT COUNT(*) as total FROM blotter b ${whereClause}`, values);

    res.json({
      columns: ['Case Number', 'Incident Type', 'Status', 'Location', 'Date Reported', 'Complainant', 'Respondent'],
      data: blotters.map(b => [b.Case_Number || 'N/A', b.Incident_Type || 'N/A', b.Status || 'N/A', b.Location_Sitio || 'N/A',
        b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A', b.Complainant_Details ? 'Details Available' : 'N/A',
        b.respondent_id ? `${b.respondent_first_name || ''} ${b.respondent_last_name || ''}`.trim() || 'N/A' : 'N/A']),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: totalResult[0].total, pages: Math.ceil(totalResult[0].total / limit) },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_blotter'
    });
  } catch (error) {
    console.error('Error generating detailed blotter report:', error);
    res.status(500).json({ error: 'Failed to generate detailed blotter report' });
  }
};

exports.getDetailedCertificatesReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [], values = [];
    if (dateFrom) { whereConditions.push('c.created_at >= ?'); values.push(dateFrom); }
    if (dateTo) { whereConditions.push('c.created_at <= ?'); values.push(dateTo + ' 23:59:59'); }
    if (status) { whereConditions.push('c.status = ?'); values.push(status); }
    if (search) { whereConditions.push('(c.control_no LIKE ? OR c.certificate_type LIKE ? OR r.First_Name LIKE ? OR r.Last_Name LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [certificates] = await db.execute(`
      SELECT c.control_no, c.certificate_type, c.purpose, c.status, c.date_issued, c.issued_by, c.created_at,
        CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c LEFT JOIN residents r ON c.resident_id = r.Resident_ID
      ${whereClause} ORDER BY c.created_at DESC LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalResult] = await db.execute(`SELECT COUNT(*) as total FROM certificates_log c LEFT JOIN residents r ON c.resident_id = r.Resident_ID ${whereClause}`, values);

    res.json({
      columns: ['Control No', 'Certificate Type', 'Resident', 'Purpose', 'Status', 'Date Issued', 'Issued By'],
      data: certificates.map(c => [c.control_no || 'N/A', c.certificate_type || 'N/A', c.resident_name || 'N/A', c.purpose || 'N/A', c.status || 'N/A',
        c.date_issued ? new Date(c.date_issued).toLocaleDateString() : 'N/A', c.issued_by || 'System']),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: totalResult[0].total, pages: Math.ceil(totalResult[0].total / limit) },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_certificates'
    });
  } catch (error) {
    console.error('Error generating detailed certificates report:', error);
    res.status(500).json({ error: 'Failed to generate detailed certificates report' });
  }
};

exports.getDetailedResidentsReport = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { dateFrom, dateTo, status, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [], values = [];
    if (dateFrom) { whereConditions.push('r.Date_Arrival >= ?'); values.push(dateFrom); }
    if (dateTo) { whereConditions.push('r.Date_Arrival <= ?'); values.push(dateTo); }
    if (status) { whereConditions.push('r.Residency_Status = ?'); values.push(status); }
    if (search) { whereConditions.push('(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Mobile_Number LIKE ? OR r.Email LIKE ?)'); values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`); }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [residents] = await db.execute(`
      SELECT r.Resident_ID, r.First_Name, r.Last_Name, r.Gender, r.Birthdate, r.Civil_Status, r.Residency_Status,
        h.Household_Number, s.name as sitio_name
      FROM residents r LEFT JOIN households h ON r.Household_ID = h.Household_ID LEFT JOIN sitios s ON h.Sitio_ID = s.id
      ${whereClause} ORDER BY r.Last_Name, r.First_Name LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), offset]);

    const [totalResult] = await db.execute(`SELECT COUNT(*) as total FROM residents r LEFT JOIN households h ON r.Household_ID = h.Household_ID ${whereClause}`, values);

    res.json({
      columns: ['Resident ID', 'Name', 'Gender', 'Birthdate', 'Civil Status', 'Status', 'Household', 'Sitio'],
      data: residents.map(r => [r.Resident_ID, `${r.First_Name} ${r.Last_Name}`, r.Gender || 'N/A',
        r.Birthdate ? new Date(r.Birthdate).toLocaleDateString() : 'N/A', r.Civil_Status || 'N/A', r.Residency_Status || 'N/A',
        r.Household_Number || 'N/A', r.sitio_name || 'N/A']),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: totalResult[0].total, pages: Math.ceil(totalResult[0].total / limit) },
      generated_at: new Date().toISOString(),
      report_type: 'detailed_residents'
    });
  } catch (error) {
    console.error('Error generating detailed residents report:', error);
    res.status(500).json({ error: 'Failed to generate detailed residents report' });
  }
};
