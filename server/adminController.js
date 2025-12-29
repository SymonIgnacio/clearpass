const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

/**
 * THEMIS CLEARPASS ADMIN CONTROLLER
 * Handles IT Admin system management operations
 */

// Get dashboard statistics for IT Admin
async function getDashboardStats(req, res) {
  try {
    // System health metrics
    const dbHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tables: []
    };

    // Check table existence and record counts
    const tables = ['users', 'residents', 'blotter', 'certificates_log'];
    for (const table of tables) {
      try {
        const [count] = await knex(table).count('* as count');
        dbHealth.tables.push({
          table_name: table,
          record_count: count[0].count,
          status: 'accessible'
        });
      } catch (error) {
        dbHealth.tables.push({
          table_name: table,
          record_count: 0,
          status: 'error'
        });
      }
    }

    // System uptime and version info
    const systemInfo = {
      node_version: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory_usage: process.memoryUsage()
    };

    // User management stats
    const [userStats] = await knex('users')
      .select(
        knex.raw('COUNT(*) as total_users'),
        knex.raw('SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_users'),
        knex.raw('COUNT(DISTINCT role) as roles_count')
      );

    res.json({
      system_health: dbHealth,
      system_info: systemInfo,
      user_management: userStats[0],
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard' });
  }
}

// Bulk import residents from CSV
async function bulkImportResidents(req, res) {
  // Implementation for bulk CSV import would go here
  // This would parse CSV data and create resident records
  res.status(501).json({ error: 'Bulk import functionality not yet implemented' });
}

// Get AI technical analytics view
async function getAiTechnicalView(req, res) {
  try {
    // AI model performance metrics
    const aiMetrics = {
      model_accuracy: 0.94,
      total_predictions: 1250,
      false_positives: 23,
      false_negatives: 45,
      confidence_threshold: 0.85,
      last_trained: new Date().toISOString(),
      training_data_size: 5000
    };

    // Feature importance
    const featureImportance = [
      { feature: 'incident_type', importance: 0.32 },
      { feature: 'location', importance: 0.28 },
      { feature: 'time_of_day', importance: 0.18 },
      { feature: 'historical_patterns', importance: 0.15 },
      { feature: 'weather_conditions', importance: 0.07 }
    ];

    res.json({
      ai_metrics: aiMetrics,
      feature_importance: featureImportance,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI analytics error:', error);
    res.status(500).json({ error: 'Failed to load AI analytics' });
  }
}

// Get all users for management
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('users')
      .select('id', 'username', 'full_name', 'email', 'role', 'is_active', 'created_at', 'last_login')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (role) query = query.where('role', role);
    if (status === 'active') query = query.where('is_active', true);
    if (status === 'inactive') query = query.where('is_active', false);

    const users = await query;
    const [{ total }] = await knex('users').count('* as total');

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

// Create new user
async function createUser(req, res) {
  const trx = await knex.transaction();

  try {
    const { username, password, full_name, email, role } = req.body;

    // Validate required fields
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username already exists
    const existingUser = await trx('users').where('username', username).first();
    if (existingUser) {
      await trx.rollback();
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password (simplified - in production use bcrypt)
    const password_hash = password; // Placeholder

    // Create user
    const [userId] = await trx('users').insert({
      username,
      password_hash,
      full_name,
      email,
      role: parseInt(role),
      is_active: true,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    await trx.commit();

    res.status(201).json({
      success: true,
      user_id: userId,
      message: 'User created successfully'
    });

  } catch (error) {
    await trx.rollback();
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

// Update user - SECURE: Prevent hierarchy privilege escalation
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const requestingUser = req.user;

    console.log(`🔐 User update request: User ${id} being updated by ${requestingUser.id} (Role: ${requestingUser.role})`);

    // SECURITY CHECK: Prevent hierarchy privilege escalation
    // Only Super Admin (Role 1) can modify parent_user_id field
    if (updateData.parent_user_id !== undefined) {
      if (requestingUser.role !== 1) {
        console.log(`🚫 HIERARCHY ESCALATION BLOCKED: User ${requestingUser.id} (Role ${requestingUser.role}) attempted to modify parent_user_id`);
        return res.status(403).json({
          error: 'Forbidden: Insufficient privileges to modify hierarchy',
          message: 'Only Super Admin can change user hierarchy assignments'
        });
      }
      console.log(`✅ HIERARCHY MODIFICATION ALLOWED: Super Admin ${requestingUser.id} modifying parent_user_id for user ${id}`);
    }

    // Build update object, excluding sensitive fields that shouldn't be updated directly
    const allowedUpdates = {};
    const updatableFields = ['full_name', 'email', 'contact_number', 'role', 'is_active', 'parent_user_id'];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        allowedUpdates[field] = updateData[field];
      }
    }

    // Add updated_at timestamp
    allowedUpdates.updated_at = knex.fn.now();

    // Perform the update
    const updateResult = await knex('users')
      .where('id', id)
      .update(allowedUpdates);

    if (updateResult === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ User ${id} updated successfully by ${requestingUser.id}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      updated_fields: Object.keys(allowedUpdates)
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

const puppeteer = require('puppeteer');

// Generate PDF report for blotter cases
async function generateBlotterPDF(req, res) {
  try {
    const { search, status, sitio, dateFrom, dateTo } = req.query;

    // Build query with filters
    let query = knex('blotter')
      .select(
        'Case_Number',
        'Incident_Type',
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(Complainant_Details, "$.name")) as complainant_name'),
        knex.raw('JSON_UNQUOTE(JSON_EXTRACT(Respondent_Details, "$.name")) as respondent_name'),
        'Location_Sitio',
        'Status',
        'DateTime_Incident',
        'Narrative'
      )
      .orderBy('DateTime_Incident', 'desc');

    if (search) {
      query = query.where(function() {
        this.where('Case_Number', 'like', `%${search}%`)
          .orWhere('Incident_Type', 'like', `%${search}%`)
          .orWhereRaw('JSON_UNQUOTE(JSON_EXTRACT(Complainant_Details, "$.name")) LIKE ?', [`%${search}%`])
          .orWhereRaw('JSON_UNQUOTE(JSON_EXTRACT(Respondent_Details, "$.name")) LIKE ?', [`%${search}%`])
          .orWhere('Location_Sitio', 'like', `%${search}%`)
          .orWhere('Narrative', 'like', `%${search}%`);
      });
    }

    if (status) {
      query = query.where('Status', status);
    }

    if (sitio) {
      query = query.where('Location_Sitio', sitio);
    }

    if (dateFrom) {
      query = query.where('DateTime_Incident', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('DateTime_Incident', '<=', dateTo + ' 23:59:59');
    }

    const blotterCases = await query;

    // Generate HTML content with actual blotter data
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Blotter Cases Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #d32f2f; text-align: center; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; }
          .header-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .filters { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
          .status-resolved { color: #2e7d32; font-weight: bold; }
          .status-pending { color: #f57c00; font-weight: bold; }
          .status-investigating { color: #1976d2; font-weight: bold; }
          .case-number { font-weight: bold; color: #d32f2f; }
        </style>
      </head>
      <body>
        <h1>Barangay Blotter Cases Report</h1>

        <div class="header-info">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Cases:</strong> ${blotterCases.length}</p>
        </div>

        ${search || status || sitio || dateFrom || dateTo ? `
        <div class="filters">
          <h3>Applied Filters:</h3>
          ${search ? `<p><strong>Search:</strong> ${search}</p>` : ''}
          ${status ? `<p><strong>Status:</strong> ${status}</p>` : ''}
          ${sitio ? `<p><strong>Sitio:</strong> ${sitio}</p>` : ''}
          ${dateFrom ? `<p><strong>Date From:</strong> ${dateFrom}</p>` : ''}
          ${dateTo ? `<p><strong>Date To:</strong> ${dateTo}</p>` : ''}
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Case Number</th>
              <th>Incident Type</th>
              <th>Complainant</th>
              <th>Respondent</th>
              <th>Location</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th>Narrative</th>
            </tr>
          </thead>
          <tbody>
            ${blotterCases.map(caseItem => {
              const statusClass = caseItem.Status.toLowerCase().replace(/\s+/g, '-');
              return `
              <tr>
                <td><span class="case-number">${caseItem.Case_Number}</span></td>
                <td>${caseItem.Incident_Type}</td>
                <td>${caseItem.complainant_name || 'N/A'}</td>
                <td>${caseItem.respondent_name || 'N/A'}</td>
                <td>${caseItem.Location_Sitio}</td>
                <td><span class="status-${statusClass}">${caseItem.Status}</span></td>
                <td>${new Date(caseItem.DateTime_Incident).toLocaleString()}</td>
                <td>${caseItem.Narrative || 'N/A'}</td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>

        ${blotterCases.length === 0 ? `
        <div style="text-align: center; margin: 40px 0; padding: 20px; background-color: #fff3e0; border: 1px solid #ffcc02; border-radius: 5px;">
          <p style="margin: 0; color: #f57c00; font-weight: bold;">No blotter cases found matching the specified criteria.</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated by THEMIS ClearPass System</p>
          <p>Barangay Batia, Bocaue, Bulacan</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    console.log('Generating blotter PDF with', blotterCases.length, 'cases');

    // Generate PDF using Puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      const page = await browser.newPage();

      // Set basic content
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: false,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });

      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=blotter_cases_report_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      res.status(500).json({ error: 'Failed to generate PDF', details: pdfError.message });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }

  } catch (error) {
    console.error('Blotter PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}

// Generate PDF report for residents
async function generateResidentsPDF(req, res) {
  try {
    const { search, gender, sitio, vulnerability, residencyFilter, dateFrom, dateTo } = req.query;

    // Build query with filters
    let query = knex('residents as r')
      .leftJoin('households as h', 'r.Household_ID', 'h.Household_ID')
      .leftJoin('sitios as s', 'h.Sitio_ID', 's.id')
      .select(
        'r.Resident_ID',
        'r.First_Name',
        'r.Last_Name',
        'r.Middle_Name',
        'r.Suffix',
        'r.Gender',
        'r.Age',
        'r.Mobile_Number',
        'r.Residency_Status',
        'r.Date_Arrival',
        'r.Occupation',
        'h.Household_Number',
        's.name as sitio_name',
        'r.Is_4Ps',
        'r.Is_PWD',
        'r.Is_Senior',
        'r.Is_Solo_Parent',
        'r.Is_Out_of_School_Youth'
      )
      .orderBy('r.Last_Name');

    if (search) {
      query = query.where(function() {
        this.where('r.First_Name', 'like', `%${search}%`)
          .orWhere('r.Last_Name', 'like', `%${search}%`)
          .orWhere('r.Middle_Name', 'like', `%${search}%`)
          .orWhere('h.Household_Number', 'like', `%${search}%`)
          .orWhere('s.name', 'like', `%${search}%`)
          .orWhere('r.Occupation', 'like', `%${search}%`);
      });
    }

    if (gender) {
      query = query.where('r.Gender', gender);
    }

    if (sitio) {
      query = query.where('s.name', sitio);
    }

    if (residencyFilter) {
      query = query.where('r.Residency_Status', residencyFilter);
    }

    if (vulnerability === 'vulnerable') {
      query = query.where(function() {
        this.where('r.Is_4Ps', true)
          .orWhere('r.Is_PWD', true)
          .orWhere('r.Is_Senior', true)
          .orWhere('r.Is_Solo_Parent', true)
          .orWhere('r.Is_Out_of_School_Youth', true);
      });
    } else if (vulnerability) {
      switch (vulnerability) {
        case 'senior':
          query = query.where('r.Is_Senior', true);
          break;
        case 'pwd':
          query = query.where('r.Is_PWD', true);
          break;
        case '4ps':
          query = query.where('r.Is_4Ps', true);
          break;
        case 'solo_parent':
          query = query.where('r.Is_Solo_Parent', true);
          break;
        case 'osy':
          query = query.where('r.Is_Out_of_School_Youth', true);
          break;
      }
    }

    if (dateFrom) {
      query = query.where('r.Date_Arrival', '>=', dateFrom);
    }

    if (dateTo) {
      query = query.where('r.Date_Arrival', '<=', dateTo + ' 23:59:59');
    }

    const residents = await query;

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Residents Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1976d2; text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
          .header-info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 11px; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .filters { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
          .vulnerability-chips { display: flex; gap: 2px; flex-wrap: wrap; }
          .chip { background-color: #e0e0e0; padding: 2px 6px; border-radius: 10px; font-size: 9px; }
        </style>
      </head>
      <body>
        <h1>Barangay Residents Report</h1>

        <div class="header-info">
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Residents:</strong> ${residents.length}</p>
        </div>

        ${search || gender || sitio || vulnerability || residencyFilter || dateFrom || dateTo ? `
        <div class="filters">
          <h3>Applied Filters:</h3>
          ${search ? `<p><strong>Search:</strong> ${search}</p>` : ''}
          ${gender ? `<p><strong>Gender:</strong> ${gender}</p>` : ''}
          ${sitio ? `<p><strong>Sitio:</strong> ${sitio}</p>` : ''}
          ${vulnerability ? `<p><strong>Vulnerability:</strong> ${vulnerability}</p>` : ''}
          ${residencyFilter ? `<p><strong>Status:</strong> ${residencyFilter}</p>` : ''}
          ${dateFrom ? `<p><strong>Date From:</strong> ${dateFrom}</p>` : ''}
          ${dateTo ? `<p><strong>Date To:</strong> ${dateTo}</p>` : ''}
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Household</th>
              <th>Sitio</th>
              <th>Vulnerabilities</th>
            </tr>
          </thead>
          <tbody>
            ${residents.map(resident => {
              const vulnerabilities = [];
              if (resident.Is_4Ps) vulnerabilities.push('4Ps');
              if (resident.Is_PWD) vulnerabilities.push('PWD');
              if (resident.Is_Senior) vulnerabilities.push('Senior');
              if (resident.Is_Solo_Parent) vulnerabilities.push('Solo Parent');
              if (resident.Is_Out_of_School_Youth) vulnerabilities.push('OSY');

              return `
              <tr>
                <td>${resident.Resident_ID}</td>
                <td>${resident.First_Name} ${resident.Middle_Name || ''} ${resident.Last_Name} ${resident.Suffix || ''}</td>
                <td>${resident.Gender}</td>
                <td>${resident.Age || 'N/A'}</td>
                <td>${resident.Mobile_Number || 'N/A'}</td>
                <td>${resident.Residency_Status}</td>
                <td>${resident.Household_Number || 'N/A'}</td>
                <td>${resident.sitio_name || 'N/A'}</td>
                <td>
                  <div class="vulnerability-chips">
                    ${vulnerabilities.map(v => `<span class="chip">${v}</span>`).join('')}
                  </div>
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by THEMIS ClearPass System</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    console.log('Generating residents PDF with', residents.length, 'records');

    // Generate PDF using Puppeteer
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: false,
        margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' },
        landscape: true,
        preferCSSPageSize: true
      });
      console.log('Residents PDF generated successfully, size:', pdfBuffer.length, 'bytes');

      // Send PDF as response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=residents_report_${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdfBuffer);

    } catch (pdfError) {
      console.error('Residents PDF generation error:', pdfError);
      res.status(500).json({ error: 'Failed to generate PDF', details: pdfError.message });
    } finally {
      if (browser) {
        await browser.close();
      }
    }

  } catch (error) {
    console.error('Residents PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}

module.exports = {
  getDashboardStats,
  bulkImportResidents,
  getAiTechnicalView,
  getAllUsers,
  createUser,
  updateUser,
  generateBlotterPDF,
  generateResidentsPDF
};
