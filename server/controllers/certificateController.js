const { ROLES } = require('../config/roles');

exports.create = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const {
      resident_id,
      certificate_type,
      purpose,
      quantity,
      // Manual fields
      resident_name,
      address,
      manual_certificate,
      signatory_captain,
      signatory_secretary,
      issued_date,
      control_number,
      dynamic_data, // Add this to destructuring
    } = req.body;

    // Generate control number if not provided
    const controlNo = control_number || `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrString = `QR-${controlNo}`;

    // Insert into certificates_log
    await db.execute(
      `INSERT INTO certificates_log (
        control_no, resident_id, certificate_type, purpose, 
        date_issued, qr_validation_string, status, created_at,
        resident_name, address, is_manual, signatory_captain, signatory_secretary
      ) VALUES (?, ?, ?, ?, ?, ?, 'Paid', NOW(), ?, ?, ?, ?, ?)`,
      [
        controlNo,
        resident_id || null,
        certificate_type || 'Barangay Clearance',
        purpose || 'N/A',
        issued_date || new Date(),
        qrString,
        // New manual fields
        resident_name || null,
        address || null,
        manual_certificate ? 1 : 0,
        signatory_captain || null,
        signatory_secretary || null,
      ]
    );

    let generatedRequestId = null;

    // Sync manual issuance to document_requests for tracking
    if (manual_certificate) {
      generatedRequestId = `REQ-MANUAL-${Date.now()}`;
      await db.execute(
        `
        INSERT INTO document_requests (
          request_id, resident_id, document_type, status, 
          request_data, resident_data, created_at, updated_at
        ) VALUES (?, ?, ?, 'approved', ?, ?, NOW(), NOW())
      `,
        [
          generatedRequestId,
          resident_id || null,
          certificate_type || 'Barangay Clearance',
          JSON.stringify({
            purpose: purpose || 'Manual Issuance',
            is_manual: true,
            control_no: controlNo,
            ...(dynamic_data || {}),
          }),
          JSON.stringify({
            First_Name: resident_name || 'Manual',
            Last_Name: '',
            address: address || '',
          }),
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Certificate issued successfully',
      certificate_id: controlNo,
      control_no: controlNo,
      request_id: generatedRequestId,
    });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ error: 'Failed to issue certificate' });
  }
};

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const isResident = req.user.role === ROLES.RESIDENT;

    let query, values;

    if (isResident) {
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE r.Resident_ID = ?
        ORDER BY c.created_at DESC
      `;
      values = [req.user.resident_id || req.user.id];
    } else {
      query = `
        SELECT c.*, 
          COALESCE(c.resident_name, CONCAT(r.First_Name, ' ', r.Last_Name)) as resident_name,
          COALESCE(c.address, CONCAT(h.Household_Number, ' ', h.Street_Address, ', ', s.name)) as address
        FROM certificates_log c
        LEFT JOIN residents r ON c.resident_id = r.Resident_ID
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        ORDER BY c.created_at DESC
      `;
      values = [];
    }

    const [rows] = await db.execute(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};
