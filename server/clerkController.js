const crypto = require('crypto');

function getKnex() {
  return require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
}

/**
 * THEMIS CLEARPASS CLERK CONTROLLER
 * Handles certificate issuance with ClearPass validation
 */

// ClearPass Logic Gate - CRITICAL SECURITY FUNCTION
async function checkClearPassEligibility(residentId) {
  console.log(`🔒 CLEARPASS GATE: Checking eligibility for Resident ID: ${residentId}`);

  try {
    const knex = getKnex();
    // Step A: Query Blotter table for ResidentID
    const blotterRecords = await knex('blotter')
      .where('respondent_id', residentId)
      .select('id', 'case_number', 'status', 'incident_type', 'hearing_count', 'missed_hearings')
      .orderBy('created_at', 'desc');

    console.log(`🔍 CLEARPASS: Found ${blotterRecords.length} blotter records for resident ${residentId}`);

    // Step B: Check for "Active" cases or "3+ Missed Hearings"
    const activeCases = blotterRecords.filter(record =>
      record.status === 'Active' ||
      record.status === 'Pending' ||
      (record.missed_hearings && record.missed_hearings >= 3)
    );

    if (activeCases.length > 0) {
      console.log(`🚫 CLEARPASS DENIED: ${activeCases.length} active cases found`);
      console.log(`🚫 Case details:`, activeCases.map(c => ({
        case_number: c.case_number,
        status: c.status,
        missed_hearings: c.missed_hearings,
        incident_type: c.incident_type
      })));

      // Step C: HARD BLOCK - Throw error
      throw new Error('CLEARPASS DENIED: Resident has active accountabilities.');
    }

    // Step D: Only if Clean -> Allow clearance generation
    console.log(`✅ CLEARPASS APPROVED: No active cases found. Resident eligible for clearance.`);
    return {
      eligible: true,
      blotter_records_checked: blotterRecords.length,
      active_cases: 0,
      message: 'Resident passed ClearPass validation'
    };

  } catch (error) {
    if (error.message.includes('CLEARPASS DENIED')) {
      throw error; // Re-throw ClearPass denial
    }

    console.error('❌ CLEARPASS GATE ERROR:', error);
    throw new Error('ClearPass validation failed due to system error');
  }
}

// Generate Barangay Clearance Certificate
async function generateClearanceCertificate(residentId, purpose, issuedBy) {
  try {
    const knex = getKnex();
    console.log(`📄 Generating clearance certificate for resident: ${residentId}`);

    // Get resident details
    const [residents] = await knex('residents')
      .select(
        'r.*',
        'h.Household_Number',
        'h.Street_Address',
        's.name as sitio_name'
      )
      .from('residents as r')
      .leftJoin('households as h', 'r.Household_ID', 'h.Household_ID')
      .leftJoin('sitios as s', 'h.Sitio_ID', 's.id')
      .where('r.Resident_ID', residentId);

    if (residents.length === 0) {
      throw new Error('Resident not found');
    }

    const resident = residents[0];
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate control number
    const controlNo = `CLR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Generate QR validation hash
    const qrHash = crypto.createHash('sha256')
      .update(`${controlNo}-${residentId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Create certificate record
    const [certResult] = await knex('certificates_log').insert({
      control_no: controlNo,
      resident_id: residentId,
      certificate_type: 'Barangay Clearance',
      purpose: purpose || 'General Clearance',
      date_issued: new Date().toISOString().split('T')[0],
      valid_until: null, // Clearances typically don't expire
      status: 'Released',
      fee_paid: 0, // To be updated by Clerk
      issued_by: issuedBy,
      signatory_captain: 'Captain Juan Dela Cruz',
      signatory_secretary: 'Secretary Maria Santos',
      qr_validation_string: qrHash,
      location: 'Barangay Batia, Bocaue, Bulacan',
      is_manual: false
    });

    console.log(`✅ Clearance certificate generated: ${controlNo}`);

    return {
      certificate_id: certResult,
      control_no: controlNo,
      qr_hash: qrHash,
      resident: {
        id: resident.Resident_ID,
        name: `${resident.First_Name} ${resident.Last_Name}`,
        address: `${resident.Street_Address}, ${resident.sitio_name}`,
        sitio: resident.sitio_name
      },
      issued_date: currentDate,
      purpose: purpose || 'General Clearance',
      verification_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-qr/${qrHash}`
    };

  } catch (error) {
    console.error('❌ Certificate generation error:', error);
    throw new Error('Failed to generate clearance certificate');
  }
}

// Clerk Dashboard - Get clearance requests and statistics
async function getClerkDashboard(req, res) {
  try {
    const knex = getKnex();
    const clerkId = req.user.id;

    // Get recent clearances issued by this clerk
    const recentClearances = await knex('certificates_log')
      .select(
        'certificates_log.*',
        'residents.First_Name',
        'residents.Last_Name',
        'residents.Mobile_Number'
      )
      .join('residents', 'certificates_log.resident_id', 'residents.Resident_ID')
      .where('certificates_log.issued_by', clerkId)
      .where('certificates_log.certificate_type', 'Barangay Clearance')
      .orderBy('certificates_log.created_at', 'desc')
      .limit(10);

    // Get clearance statistics for today
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await knex('certificates_log')
      .where('issued_by', clerkId)
      .where('certificate_type', 'Barangay Clearance')
      .whereRaw('DATE(created_at) = ?', [today])
      .select(knex.raw('COUNT(*) as today_clearances'));

    // Get pending clearance requests (if there's a request system)
    const pendingRequests = await knex('clearance_requests')
      .select(
        'clearance_requests.*',
        'residents.First_Name',
        'residents.Last_Name'
      )
      .join('residents', 'clearance_requests.resident_id', 'residents.Resident_ID')
      .where('clearance_requests.status', 'pending')
      .orderBy('clearance_requests.created_at', 'asc')
      .limit(5);

    res.json({
      success: true,
      dashboard: {
        recent_clearances: recentClearances,
        today_stats: {
          clearances_issued: todayStats[0]?.today_clearances || 0
        },
        pending_requests: pendingRequests
      }
    });

  } catch (error) {
    console.error('Clerk dashboard error:', error);
    res.status(500).json({ error: 'Failed to load clerk dashboard' });
  }
}

// Issue Clearance - Main ClearPass Function
async function issueClearance(req, res) {
  const knex = getKnex();
  const connection = await knex.transaction();

  try {
    const { resident_id, purpose } = req.body;
    const clerkId = req.user.id;

    console.log(`🎫 CLERK ACTION: Issuing clearance for resident ${resident_id} by clerk ${clerkId}`);

    // Validate input
    if (!resident_id) {
      return res.status(400).json({
        error: 'Resident ID is required'
      });
    }

    // CRITICAL: Execute ClearPass Logic Gate
    console.log(`🔒 Executing ClearPass validation...`);
    const clearPassResult = await checkClearPassEligibility(resident_id);

    if (!clearPassResult.eligible) {
      await connection.rollback();
      return res.status(403).json({
        error: 'CLEARPASS DENIED: Resident has active accountabilities.',
        clearpass_result: clearPassResult
      });
    }

    // ClearPass passed - Generate certificate
    console.log(`✅ ClearPass approved - Generating certificate...`);
    const certificate = await generateClearanceCertificate(resident_id, purpose, clerkId);

    await connection.commit();

    res.json({
      success: true,
      message: 'Clearance certificate issued successfully',
      certificate: certificate,
      clearpass_validation: clearPassResult
    });

  } catch (error) {
    await connection.rollback();

    if (error.message.includes('CLEARPASS DENIED')) {
      return res.status(403).json({
        error: error.message,
        clearpass_denied: true
      });
    }

    console.error('Clearance issuance error:', error);
    res.status(500).json({
      error: 'Failed to issue clearance certificate',
      details: error.message
    });
  }
}

// Get clearance history for a resident
async function getClearanceHistory(req, res) {
  try {
    const knex = getKnex();
    const { residentId } = req.params;

    const clearances = await knex('certificates_log')
      .select(
        'certificates_log.*',
        'residents.First_Name',
        'residents.Last_Name'
      )
      .join('residents', 'certificates_log.resident_id', 'residents.Resident_ID')
      .where('certificates_log.resident_id', residentId)
      .where('certificates_log.certificate_type', 'Barangay Clearance')
      .orderBy('certificates_log.created_at', 'desc');

    res.json({
      success: true,
      clearances: clearances
    });

  } catch (error) {
    console.error('Clearance history error:', error);
    res.status(500).json({ error: 'Failed to fetch clearance history' });
  }
}

// Validate resident for clearance (pre-check ClearPass)
async function validateForClearance(req, res) {
  try {
    const knex = getKnex();
    const { resident_id } = req.body;

    if (!resident_id) {
      return res.status(400).json({
        error: 'Resident ID is required'
      });
    }

    console.log(`🔍 CLERK VALIDATION: Pre-checking ClearPass for resident ${resident_id}`);

    const clearPassResult = await checkClearPassEligibility(resident_id);

    // Get resident details
    const [residents] = await knex('residents')
      .select('Resident_ID', 'First_Name', 'Last_Name', 'Mobile_Number')
      .where('Resident_ID', resident_id);

    res.json({
      success: true,
      resident: residents[0] || null,
      clearpass_eligible: clearPassResult.eligible,
      validation_result: clearPassResult
    });

  } catch (error) {
    if (error.message.includes('CLEARPASS DENIED')) {
      return res.json({
        success: true,
        resident: null,
        clearpass_eligible: false,
        validation_result: {
          eligible: false,
          error: error.message
        }
      });
    }

    console.error('Clearance validation error:', error);
    res.status(500).json({
      error: 'Failed to validate resident for clearance'
    });
  }
}

// Get all clearances for clerk overview
async function getAllClearances(req, res) {
  try {
    const knex = getKnex();
    const clearances = await knex('certificates_log')
      .select(
        'certificates_log.*',
        'residents.First_Name',
        'residents.Last_Name',
        'residents.Mobile_Number'
      )
      .join('residents', 'certificates_log.resident_id', 'residents.Resident_ID')
      .where('certificates_log.certificate_type', 'Barangay Clearance')
      .orderBy('certificates_log.created_at', 'desc')
      .limit(50);

    res.json({
      success: true,
      clearances: clearances
    });

  } catch (error) {
    console.error('Get all clearances error:', error);
    res.status(500).json({ error: 'Failed to fetch clearances' });
  }
}

// Register new resident (basic implementation)
async function registerResident(req, res) {
  try {
    const knex = getKnex();
    const { firstName, lastName, mobileNumber, address } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({
        error: 'First name and last name are required'
      });
    }

    // Generate resident ID
    const residentId = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const [result] = await knex('residents').insert({
      Resident_ID: residentId,
      First_Name: firstName,
      Last_Name: lastName,
      Mobile_Number: mobileNumber,
      Date_Arrival: new Date().toISOString().split('T')[0],
      Residency_Status: 'Active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    res.status(201).json({
      success: true,
      resident_id: residentId,
      message: 'Resident registered successfully'
    });

  } catch (error) {
    console.error('Resident registration error:', error);
    res.status(500).json({ error: 'Failed to register resident' });
  }
}

// Get document issuance overview
async function getDocumentIssuance(req, res) {
  try {
    const knex = getKnex();
    // Get recent clearances and their statistics
    const recentDocuments = await knex('certificates_log')
      .select(
        'certificate_type',
        knex.raw('COUNT(*) as count'),
        knex.raw('DATE(created_at) as date')
      )
      .whereRaw('created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)')
      .groupBy('certificate_type', knex.raw('DATE(created_at)'))
      .orderBy('date', 'desc');

    res.json({
      success: true,
      document_issuance: recentDocuments
    });

  } catch (error) {
    console.error('Document issuance error:', error);
    res.status(500).json({ error: 'Failed to fetch document issuance data' });
  }
}

// Approve clearance request (Secretary override)
async function approveClearance(req, res) {
  try {
    const knex = getKnex();
    const { id } = req.params;
    const { approval_notes } = req.body;
    const secretaryId = req.user.id;

    console.log(`✅ SECRETARY APPROVAL: Approving clearance request ${id} by secretary ${secretaryId}`);

    // Check if clearance exists and is pending
    const clearance = await knex('certificates_log')
      .where('id', id)
      .first();

    if (!clearance) {
      return res.status(404).json({
        error: 'Clearance request not found'
      });
    }

    if (clearance.status !== 'Pending') {
      return res.status(400).json({
        error: 'Clearance is not in pending status'
      });
    }

    // Update clearance status to approved
    await knex('certificates_log')
      .where('id', id)
      .update({
        status: 'Approved',
        approved_by: secretaryId,
        approval_notes: approval_notes,
        updated_at: knex.fn.now()
      });

    // Get updated clearance with resident info
    const approvedClearance = await knex('certificates_log')
      .select(
        'certificates_log.*',
        'residents.First_Name',
        'residents.Last_Name'
      )
      .join('residents', 'certificates_log.resident_id', 'residents.Resident_ID')
      .where('certificates_log.id', id)
      .first();

    res.json({
      success: true,
      message: 'Clearance request approved successfully',
      clearance: approvedClearance
    });

  } catch (error) {
    console.error('Clearance approval error:', error);
    res.status(500).json({
      error: 'Failed to approve clearance request'
    });
  }
}

module.exports = {
  getClerkDashboard,
  getAllClearances,
  registerResident,
  issueClearance,
  approveClearance,
  getClearanceHistory,
  validateForClearance,
  getDocumentIssuance,
  checkClearPassEligibility // Export for testing
};
