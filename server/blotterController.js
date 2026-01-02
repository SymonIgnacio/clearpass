const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const { sendIncidentReportNotification } = require('./notificationService');

/**
 * THEMIS CLEARPASS BLOTTER OFFICER CONTROLLER
 * Handles blotter case encoding with resident linking for ClearPass validation
 */

// Create new blotter case - THEMIS Critical Function
async function createCase(req, res) {
  const trx = await knex.transaction();

  try {
    const officerId = req.user.id;
    const {
      case_number,
      complainant_details,
      respondent_details,
      resident_id, // THEMIS REQUIREMENT: Must include resident_id for ClearPass
      incident_type,
      narrative,
      date_time_incident,
      location_sitio,
      status
    } = req.body;

    console.log(`🔒 BLOTTER OFFICER: Creating case for resident ${resident_id} by officer ${officerId}`);

    // THEMIS VALIDATION: resident_id is REQUIRED for ClearPass functionality
    if (!resident_id) {
      return res.status(400).json({
        error: 'THEMIS REQUIREMENT: resident_id is mandatory for case encoding',
        message: 'Blotter cases must link to registered residents to enable ClearPass validation'
      });
    }

    // Validate resident exists in database
    const resident = await trx('residents')
      .where('Resident_ID', resident_id)
      .first();

    if (!resident) {
      await trx.rollback();
      return res.status(400).json({
        error: 'Invalid resident_id - resident not found in registry',
        message: 'Cannot create blotter case for unregistered resident'
      });
    }

    console.log(`✅ Resident validated: ${resident.First_Name} ${resident.Last_Name}`);

    // Generate case number if not provided
    let finalCaseNumber = case_number;
    if (!finalCaseNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(4, '0');
      finalCaseNumber = `BLOT-${year}-${month}-${sequence}`;
    }

    // Insert blotter case with respondent_id - THIS ENABLES CLEARPASS LOCK
    // Note: Frontend already stringifies, so we store as-is
    const [result] = await trx('blotter').insert({
      Case_Number: finalCaseNumber,
      Complainant_Details: complainant_details, // Already stringified by frontend
      Respondent_Details: respondent_details, // Already stringified by frontend
      respondent_id: resident_id, // THEMIS CRITICAL: This links to resident for ClearPass validation
      Incident_Type: incident_type,
      Narrative: narrative,
      DateTime_Incident: date_time_incident,
      Location_Sitio: location_sitio,
      Status: status || 'Active', // Default to Active to trigger ClearPass block
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    console.log(`🔒 BLOTTER CASE CREATED: ${finalCaseNumber} - Respondent: ${resident_id}`);
    console.log(`🚫 CLEARPASS BLOCK ACTIVATED: Resident ${resident_id} now blocked from clearances`);

    await trx.commit();

    res.status(201).json({
      success: true,
      case_id: result,
      case_number: finalCaseNumber,
      resident_id: resident_id,
      resident_name: `${resident.First_Name} ${resident.Last_Name}`,
      status: status || 'Active',
      message: 'Blotter case created successfully. Resident is now blocked from clearance issuance.',
      clearpass_impact: 'Resident cannot obtain barangay clearances until case is resolved'
    });

    // Send incident report notification asynchronously
    const incidentData = {
      Case_Number: finalCaseNumber,
      Incident_Type: incident_type,
      Narrative: narrative,
      DateTime_Incident: date_time_incident,
      Location_Sitio: location_sitio,
      Status: status || 'Active'
    };
    sendIncidentReportNotification(incidentData, resident).catch(err => {
      console.error('Failed to send incident report notification:', err);
    });

  } catch (error) {
    await trx.rollback();
    console.error('Blotter case creation error:', error);
    res.status(500).json({
      error: 'Failed to create blotter case',
      details: error.message
    });
  }
}

// Update case status - Handle Active -> Resolved transitions (Unblocks resident)
async function updateCaseStatus(req, res) {
  const trx = await knex.transaction();

  try {
    const officerId = req.user.id;
    const { caseNumber } = req.params;
    const { status, resolution_notes, hearing_count, missed_hearings } = req.body;

    console.log(`🔄 BLOTTER OFFICER: Updating case ${caseNumber} status to ${status}`);

    // Get current case
    const currentCase = await trx('blotter')
      .where('Case_Number', caseNumber)
      .first();

    if (!currentCase) {
      return res.status(404).json({ error: 'Blotter case not found' });
    }

    // Track ClearPass impact
    const wasActive = currentCase.Status === 'Active';
    const willResolve = status === 'Resolved';

    // Update case
    await trx('blotter')
      .where('Case_Number', caseNumber)
      .update({
        Status: status,
        hearing_count: hearing_count !== undefined ? hearing_count : currentCase.hearing_count,
        missed_hearings: missed_hearings !== undefined ? missed_hearings : currentCase.missed_hearings,
        updated_at: trx.fn.now()
      });

    // Log resolution if case is being resolved
    if (willResolve && wasActive) {
      console.log(`✅ CASE RESOLVED: ${caseNumber} - Respondent ${currentCase.respondent_id} unblocked for clearances`);
    }

    await trx.commit();

    res.json({
      success: true,
      case_number: caseNumber,
      old_status: currentCase.Status,
      new_status: status,
      clearpass_impact: willResolve && wasActive ?
        `Resident ${currentCase.respondent_id} is now eligible for clearance issuance` :
        'No ClearPass impact'
    });

  } catch (error) {
    await trx.rollback();
    console.error('Case status update error:', error);
    res.status(500).json({
      error: 'Failed to update case status',
      details: error.message
    });
  }
}

// Get blotter cases for officer dashboard
async function getOfficerCases(req, res) {
  try {
    const officerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = knex('blotter')
      .select(
        'blotter.*',
        'residents.First_Name',
        'residents.Last_Name',
        'residents.Mobile_Number',
        'sitios.name as sitio_name'
      )
      .leftJoin('residents', 'blotter.respondent_id', 'residents.Resident_ID')
      .leftJoin('sitios', 'blotter.Location_Sitio', 'sitios.name')
      .orderBy('blotter.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query.where('blotter.Status', status);
    }

    const cases = await query;

    // Get total count
    let countQuery = knex('blotter').count('* as total');
    if (status) {
      countQuery.where('Status', status);
    }
    const [{ total }] = await countQuery;

    res.json({
      success: true,
      cases: cases,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get officer cases error:', error);
    res.status(500).json({
      error: 'Failed to fetch blotter cases',
      details: error.message
    });
  }
}

// Generate Monthly Blotter Report PDF
async function generateMonthlyReport(req, res) {
  try {
    const { year, month } = req.params;

    // Get cases for the specified month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 1);
    endDate.setMonth(endDate.getMonth() + 1);
    const endDateStr = endDate.toISOString().split('T')[0];

    const cases = await knex('blotter')
      .select(
        'blotter.*',
        'residents.First_Name',
        'residents.Last_Name'
      )
      .leftJoin('residents', 'blotter.respondent_id', 'residents.Resident_ID')
      .whereBetween('blotter.created_at', [startDate, endDateStr])
      .orderBy('blotter.created_at', 'asc');

    // Calculate statistics
    const stats = {
      total_cases: cases.length,
      active_cases: cases.filter(c => c.Status === 'Active').length,
      resolved_cases: cases.filter(c => c.Status === 'Resolved').length,
      by_incident_type: {},
      by_sitio: {}
    };

    cases.forEach(caseItem => {
      // Count by incident type
      stats.by_incident_type[caseItem.Incident_Type] = (stats.by_incident_type[caseItem.Incident_Type] || 0) + 1;

      // Count by sitio
      stats.by_sitio[caseItem.Location_Sitio] = (stats.by_sitio[caseItem.Location_Sitio] || 0) + 1;
    });

    // Generate PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Blotter_Report_${year}_${month}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold');
    doc.text('BARANGAY BLOTTER MONTHLY REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14);
    doc.text(`Period: ${new Date(year, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`, { align: 'center' });
    doc.moveDown(2);

    // Statistics
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('SUMMARY STATISTICS:');
    doc.moveDown();
    doc.font('Helvetica');
    doc.text(`Total Cases: ${stats.total_cases}`);
    doc.text(`Active Cases: ${stats.active_cases}`);
    doc.text(`Resolved Cases: ${stats.resolved_cases}`);
    doc.moveDown();

    // Cases by incident type
    doc.font('Helvetica-Bold');
    doc.text('Cases by Incident Type:');
    doc.moveDown();
    doc.font('Helvetica');
    Object.entries(stats.by_incident_type).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`);
    });
    doc.moveDown();

    // Cases by sitio
    doc.font('Helvetica-Bold');
    doc.text('Cases by Location:');
    doc.moveDown();
    doc.font('Helvetica');
    Object.entries(stats.by_sitio).forEach(([sitio, count]) => {
      doc.text(`${sitio}: ${count}`);
    });

    doc.end();

  } catch (error) {
    console.error('Monthly report generation error:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
}

// Delete blotter case - SECURE: Only authorized blotter officers can delete
async function deleteCase(req, res) {
  try {
    const officerId = req.user.id;
    const { id } = req.params; // This should be caseNumber based on route

    console.log(`🗑️ BLOTTER OFFICER: Deleting case ${id} by officer ${officerId}`);

    // Find the case by Case_Number (since id param is caseNumber)
    const caseToDelete = await knex('blotter')
      .where('Case_Number', id)
      .first();

    if (!caseToDelete) {
      return res.status(404).json({ error: 'Blotter case not found' });
    }

    // Log the deletion for audit trail
    console.log(`⚠️ CASE DELETION: ${caseToDelete.Case_Number} - Respondent: ${caseToDelete.respondent_id}`);

    // Delete the case
    await knex('blotter')
      .where('Case_Number', id)
      .del();

    console.log(`✅ CASE DELETED: ${id} - Respondent ${caseToDelete.respondent_id} unblocked for clearances`);

    res.json({
      success: true,
      case_number: id,
      respondent_id: caseToDelete.respondent_id,
      message: 'Blotter case deleted successfully',
      clearpass_impact: 'Resident is now eligible for clearance issuance'
    });

  } catch (error) {
    console.error('Case deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete blotter case',
      details: error.message
    });
  }
}

// Get incident hotspot analytics for AI forecasting
async function getHotspotAnalytics(req, res) {
  try {
    // Get recent cases for analysis (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentCases = await knex('blotter')
      .select('Location_Sitio', 'Incident_Type', 'created_at')
      .where('created_at', '>=', ninetyDaysAgo)
      .orderBy('created_at', 'desc');

    // Analyze hotspots
    const hotspots = {};
    const incidentTrends = {};

    recentCases.forEach(caseItem => {
      const sitio = caseItem.Location_Sitio;
      const incident = caseItem.Incident_Type;

      // Count by sitio
      if (!hotspots[sitio]) {
        hotspots[sitio] = { total: 0, incidents: {} };
      }
      hotspots[sitio].total += 1;
      hotspots[sitio].incidents[incident] = (hotspots[sitio].incidents[incident] || 0) + 1;

      // Count by incident type
      incidentTrends[incident] = (incidentTrends[incident] || 0) + 1;
    });

    // Calculate risk levels
    const riskLevels = {};
    Object.keys(hotspots).forEach(sitio => {
      const caseCount = hotspots[sitio].total;
      if (caseCount >= 10) riskLevels[sitio] = 'CRITICAL';
      else if (caseCount >= 7) riskLevels[sitio] = 'HIGH';
      else if (caseCount >= 4) riskLevels[sitio] = 'MEDIUM';
      else riskLevels[sitio] = 'LOW';
    });

    res.json({
      success: true,
      analytics_period: '90 days',
      hotspots: hotspots,
      incident_trends: incidentTrends,
      risk_levels: riskLevels,
      total_cases_analyzed: recentCases.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Hotspot analytics error:', error);
    res.status(500).json({ error: 'Failed to generate hotspot analytics' });
  }
}

// THEMIS CLEARPASS: Get resident blotter history for ClearPass validation
async function getResidentBlotterHistory(req, res) {
  try {
    const { residentId } = req.params;

    if (!residentId) {
      return res.status(400).json({
        error: 'Resident ID is required',
        message: 'Please provide a resident ID to fetch blotter history'
      });
    }

    console.log(`🔍 THEMIS CLEARPASS: Fetching blotter history for resident ${residentId}`);

    // Get blotter cases where resident is the respondent
    const respondentCases = await knex('blotter')
      .select(
        'blotter.*',
        'residents.First_Name as respondent_first_name',
        'residents.Last_Name as respondent_last_name'
      )
      .leftJoin('residents', 'blotter.respondent_id', 'residents.Resident_ID')
      .where('blotter.respondent_id', residentId)
      .orderBy('blotter.created_at', 'desc');

    // Get blotter cases where resident is a complainant
    const complainantCases = await knex('blotter')
      .select(
        'blotter.*',
        'residents.First_Name as respondent_first_name',
        'residents.Last_Name as respondent_last_name'
      )
      .leftJoin('residents', 'blotter.respondent_id', 'residents.Resident_ID')
      .whereRaw('JSON_CONTAINS(Complainant_Details, ?, "$.resident_id")', [JSON.stringify(residentId)])
      .orderBy('blotter.created_at', 'desc');

    // Combine and deduplicate cases
    const allCases = [...respondentCases, ...complainantCases];
    const uniqueCases = allCases.filter((caseItem, index, self) =>
      index === self.findIndex(c => c.Case_Number === caseItem.Case_Number)
    );

    // Format for response
    const formattedCases = uniqueCases.map(caseItem => ({
      case_number: caseItem.Case_Number,
      incident_type: caseItem.Incident_Type,
      status: caseItem.Status,
      date_incident: caseItem.DateTime_Incident,
      location: caseItem.Location_Sitio,
      narrative: caseItem.Narrative,
      respondent_id: caseItem.respondent_id,
      respondent_name: caseItem.respondent_first_name && caseItem.respondent_last_name ?
        `${caseItem.respondent_first_name} ${caseItem.respondent_last_name}` : 'Unknown',
      role_in_case: caseItem.respondent_id === residentId ? 'Respondent' : 'Complainant',
      created_at: caseItem.created_at,
      updated_at: caseItem.updated_at
    }));

    // Calculate ClearPass status
    const activeCases = formattedCases.filter(c => ['Active', 'Pending'].includes(c.status));
    const clearpass_status = activeCases.length > 0 ? 'BLOCKED' : 'CLEAR';

    console.log(`✅ THEMIS CLEARPASS: Found ${formattedCases.length} cases for resident ${residentId}, Status: ${clearpass_status}`);

    res.json({
      success: true,
      resident_id: residentId,
      clearpass_status: clearpass_status,
      active_cases_count: activeCases.length,
      total_cases_count: formattedCases.length,
      cases: formattedCases,
      summary: {
        active: activeCases.length,
        resolved: formattedCases.filter(c => c.status === 'Resolved').length,
        dismissed: formattedCases.filter(c => c.status === 'Dismissed').length,
        pending: formattedCases.filter(c => c.status === 'Pending').length
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching resident blotter history:', error);
    res.status(500).json({
      error: 'Failed to fetch resident blotter history',
      details: error.message
    });
  }
}

module.exports = {
  createCase,
  updateCaseStatus,
  getOfficerCases,
  generateMonthlyReport,
  deleteCase,
  getHotspotAnalytics,
  getResidentBlotterHistory
};
