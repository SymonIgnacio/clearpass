const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');
const { requireMfaForRoles } = require('../middleware/mfaMiddleware');
const { logAuditEvent, logAuditToDatabase, AUDIT_EVENTS } = require('../middleware/auditLogger');
const {
  resolveAndValidateUploadedDocumentPath,
  sendStoredDocument,
} = require('../utils/documentStorage');

module.exports = db => {
  const requireVerificationMfa = requireMfaForRoles([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]);

  const approveApplication = async (connection, applicationId, adminUserId, reqInfo) => {
    const [apps] = await connection.execute(
      'SELECT * FROM resident_applications WHERE application_id = ?',
      [applicationId]
    );
    if (apps.length === 0) {
      throw new Error('Application not found');
    }
    const app = apps[0];

    // Validation
    const requiredFields = [
      'first_name',
      'last_name',
      'birthdate',
      'gender',
      'civil_status',
      'sitio',
      'street_address',
    ];
    const missingFields = requiredFields.filter(field => !app[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // 1. Generate Resident ID
    const residentId = `RES-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const [existingUsers] = await connection.execute(
      'SELECT id, role, resident_id FROM users WHERE username = ? OR email = ?',
      [app.email, app.email]
    );

    let userIdToUpdate = null;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      // If user exists and is a Guest (Role 13) or has no resident_id, we can promote them
      if (existingUser.role === 13 || !existingUser.resident_id) {
        userIdToUpdate = existingUser.id;
      } else {
        if (existingUser.resident_id) {
          throw new Error('User already has a resident profile linked');
        }
        userIdToUpdate = existingUser.id;
      }
    }

    // Resolve Sitio ID
    const [sitioRows] = await connection.execute('SELECT id FROM sitios WHERE name = ?', [
      app.sitio,
    ]);
    if (sitioRows.length === 0) {
      throw new Error(`Invalid Sitio: ${app.sitio}`);
    }
    const sitioId = sitioRows[0].id;

    // Smart Household Allocation: Check for existing household first
    let householdId;
    const [existingHouseholds] = await connection.execute(
      'SELECT Household_ID, Total_Members FROM households WHERE Sitio_ID = ? AND Street_Address = ? LIMIT 1',
      [sitioId, app.street_address]
    );

    if (existingHouseholds.length > 0) {
      householdId = existingHouseholds[0].Household_ID;
      // Increment member count
      await connection.execute(
        'UPDATE households SET Total_Members = Total_Members + 1, updated_at = NOW() WHERE Household_ID = ?',
        [householdId]
      );
    } else {
      // Create New Household
      householdId = `HH-${Date.now()}`;
      await connection.execute(
        'INSERT INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address, Total_Members, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
        [householdId, householdId, sitioId, app.street_address]
      );
    }

    // 2. Insert into Residents
    await connection.execute(
      `
      INSERT INTO residents (
        Resident_ID, First_Name, Middle_Name, Last_Name, Suffix, Birthdate, Gender, Civil_Status,
        Occupation, Income_Estimate, Email, Mobile_Number, Voter_Status, Date_Arrival, Residency_Status,
        Household_ID, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Active', ?, NOW())
    `,
      [
        residentId,
        app.first_name,
        app.middle_name,
        app.last_name,
        app.suffix,
        app.birthdate,
        app.gender,
        app.civil_status,
        app.occupation,
        app.income_estimate,
        app.email,
        app.mobile_number,
        app.voter_status,
        householdId,
      ]
    );

    // 3. Insert Vulnerabilities
    const birthDate = new Date(app.birthdate);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    const isSenior = age >= 60;

    const vulnerabilityScore =
      (app.is_4ps ? 1 : 0) +
      (app.is_pwd ? 2 : 0) +
      (app.is_solo_parent ? 1 : 0) +
      (app.is_out_of_school_youth ? 1 : 0) +
      (isSenior ? 1 : 0);

    await connection.execute(
      `
      INSERT INTO vulnerabilities (
        Resident_ID, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type, Vulnerability_Score,
        validation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `,
      [
        residentId,
        app.is_4ps,
        app.is_pwd,
        isSenior,
        app.is_solo_parent,
        app.is_out_of_school_youth,
        app.disability_type,
        vulnerabilityScore,
      ]
    );

    // 4. Create User Account or Update Existing
    if (userIdToUpdate) {
      await connection.execute(
        `UPDATE users 
             SET role = ?, resident_id = ?, is_active = true, updated_at = NOW() 
             WHERE id = ?`,
        [ROLES.RESIDENT, residentId, userIdToUpdate]
      );
    } else {
      await connection.execute(
        `
          INSERT INTO users (username, password_hash, email, full_name, role, resident_id, is_active, created_at)
          VALUES (?, ?, ?, ?, ?, ?, true, NOW())
        `,
        [
          app.email,
          hashedPassword,
          app.email,
          `${app.first_name} ${app.last_name}`,
          ROLES.RESIDENT,
          residentId,
        ]
      );
    }

    // 5. Update Application Status
    await connection.execute(
      `
        UPDATE resident_applications
        SET status = "approved",
            reviewed_by = ?,
            reviewed_at = NOW()
        WHERE application_id = ?
      `,
      [adminUserId, applicationId]
    );

    const auditDetails = {
      user_id: reqInfo.userId,
      user_role: reqInfo.userRole,
      ip_address: reqInfo.ip,
      user_agent: reqInfo.userAgent,
      resource: reqInfo.originalUrl,
      action: 'APPROVE',
      result: 'SUCCESS',
      additional_details: {
        application_id: applicationId,
        resident_id: residentId,
      },
      session_id: reqInfo.sessionId,
    };

    logAuditEvent(AUDIT_EVENTS.APPLICATION_APPROVED || 'APPLICATION_APPROVED', auditDetails);
    if (db && typeof db.execute === 'function') {
      logAuditToDatabase(
        db,
        AUDIT_EVENTS.APPLICATION_APPROVED || 'APPLICATION_APPROVED',
        auditDetails
      );
    }

    return { app, tempPassword, residentId };
  };

  // Secretary dashboard
  router.get(
    '/dashboard',
    verifyToken,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const [residents] = await db.execute(
        'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
      );
      const [beneficiaries] = await db.execute(
        'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_4Ps = true OR Is_PWD = true OR Is_Senior = true'
      );
      const [blotter] = await db.execute(
        'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
      );
      const [clearances] = await db.execute(
        'SELECT COUNT(*) as total FROM certificates_log WHERE DATE(created_at) = CURDATE()'
      );

      res.json({
        residents: residents[0].total,
        beneficiaries: beneficiaries[0].total,
        active_blotter: blotter[0].total,
        today_clearances: clearances[0].total,
      });
    })
  );

  // Resident oversight
  router.get(
    '/residents',
    verifyToken,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const [residents] = await db.execute(`
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Vulnerability_Score
      FROM residents r
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      ORDER BY r.Last_Name
    `);
      res.json(residents);
    })
  );

  // Beneficiary validation
  router.get(
    '/beneficiaries',
    verifyToken,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { status } = req.query;
      const validStatuses = ['pending', 'approved', 'rejected'];
      const queryStatus = validStatuses.includes(status) ? status : 'pending';

      const [beneficiaries] = await db.execute(
        `
      SELECT r.*, h.Household_Number, s.name as sitio_name,
             v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, 
             v.Disability_Type, v.Vulnerability_Score,
             v.validation_status, v.validated_at, v.validated_by
      FROM residents r
      JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
      LEFT JOIN households h ON r.Household_ID = h.Household_ID
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE (v.validation_status = ? OR (v.validation_status IS NULL AND ? = 'pending'))
        AND (
          v.Is_4Ps = true OR v.Is_PWD = true OR v.Is_Senior = true 
          OR v.Is_Solo_Parent = true OR v.Is_Out_of_School_Youth = true
          OR v.validation_status = 'pending'
        )
      ORDER BY v.Vulnerability_Score DESC, r.Last_Name
    `,
        [queryStatus, queryStatus]
      );
      res.json(beneficiaries);
    })
  );

  router.post(
    '/beneficiaries/:id/validate',
    verifyToken,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { status, notes, action, reason } = req.body || {};

      // Handle both parameter sets for compatibility
      const finalStatus =
        status || (action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action);
      const finalNotes = notes || reason;

      if (!['approved', 'rejected'].includes(finalStatus)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Fetch user ID for notification
      let userIdToNotify = null;
      try {
        const [users] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [id]);
        if (users.length > 0) {
          userIdToNotify = users[0].id;
        }
      } catch (err) {
        console.error('Error fetching user for notification:', err);
      }

      if (finalStatus === 'rejected') {
        await db.execute(
          `
        UPDATE vulnerabilities
        SET Is_4Ps = 0,
            Is_PWD = 0,
            Is_Senior = 0,
            Is_Solo_Parent = 0,
            Is_Out_of_School_Youth = 0,
            Disability_Type = NULL,
            Vulnerability_Score = 0,
            validation_status = 'rejected',
            validation_notes = ?,
            validated_by = ?,
            validated_at = NOW(),
            updated_at = NOW()
        WHERE Resident_ID = ?
      `,
          [finalNotes || null, req.user.id, id]
        );

        // Sync resident_documents status
        await db.execute(
          `UPDATE resident_documents 
           SET verification_status = 'rejected', verification_notes = ?, verified_by = ?, verified_at = NOW() 
           WHERE resident_id = ? AND document_type IN ('4Ps Proof', 'PWD ID', 'Senior ID', 'Solo Parent ID', 'OSY Certification') AND verification_status = 'pending'`,
          [finalNotes || null, req.user.id, id]
        );

        // Notify user of rejection
        if (userIdToNotify && global.createNotification) {
          await global.createNotification(
            userIdToNotify,
            'Beneficiary Status Rejected',
            `Your beneficiary status claim has been rejected.${finalNotes ? ` Reason: ${finalNotes}` : ''}`,
            'rejected',
            'high',
            { source: 'vulnerabilities', resident_id: id }
          );
        }
      } else {
        // Check documents to determine which flags to enable
        const [docs] = await db.execute(
          'SELECT document_type FROM resident_documents WHERE resident_id = ?',
          [id]
        );
        const docTypes = docs.map(d => d.document_type);

        const updates = [];
        if (docTypes.includes('4Ps Proof')) updates.push('Is_4Ps = 1');
        if (docTypes.includes('PWD ID')) updates.push('Is_PWD = 1');
        if (docTypes.includes('Solo Parent ID')) updates.push('Is_Solo_Parent = 1');
        if (docTypes.includes('OSY Certification')) updates.push('Is_Out_of_School_Youth = 1');
        if (docTypes.includes('Senior ID')) updates.push('Is_Senior = 1');

        updates.push("validation_status = 'approved'");
        updates.push('validation_notes = ?');
        updates.push('validated_by = ?');
        updates.push('validated_at = NOW()');
        updates.push('updated_at = NOW()');

        const query = `UPDATE vulnerabilities SET ${updates.join(', ')} WHERE Resident_ID = ?`;
        await db.execute(query, [finalNotes || null, req.user.id, id]);

        // Sync resident_documents status
        await db.execute(
          `UPDATE resident_documents 
           SET verification_status = 'verified', verification_notes = ?, verified_by = ?, verified_at = NOW() 
           WHERE resident_id = ? AND document_type IN ('4Ps Proof', 'PWD ID', 'Senior ID', 'Solo Parent ID', 'OSY Certification') AND verification_status = 'pending'`,
          [finalNotes || null, req.user.id, id]
        );

        // Notify user of approval
        if (userIdToNotify && global.createNotification) {
          await global.createNotification(
            userIdToNotify,
            'Beneficiary Status Approved',
            'Your beneficiary status claim has been approved. You are now eligible for priority assistance.',
            'approved',
            'high',
            { source: 'vulnerabilities', resident_id: id }
          );
        }
      }

      res.json({ success: true, message: `Beneficiary status ${finalStatus}` });
    })
  );

  // Blotter oversight
  router.get(
    '/blotters',
    verifyToken,
    checkRole(['secretary']),
    asyncHandler(async (req, res) => {
      const [blotterCases] = await db.execute(`
      SELECT b.*, 
             JSON_UNQUOTE(JSON_EXTRACT(b.Complainant_Details, '$.name')) as complainant_name,
             JSON_UNQUOTE(JSON_EXTRACT(b.Respondent_Details, '$.name')) as respondent_name
      FROM blotter b
      ORDER BY b.DateTime_Incident DESC
    `);
      res.json(blotterCases);
    })
  );

  // Clearance oversight
  router.get(
    '/clearances',
    verifyToken,
    checkRole(['secretary']),
    asyncHandler(async (req, res) => {
      const [certs] = await db.execute(`
      SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
      FROM certificates_log c
      JOIN residents r ON c.resident_id = r.Resident_ID
      ORDER BY c.created_at DESC LIMIT 100
    `);
      res.json(certs);
    })
  );

  // Approve clearances (override capability)
  router.put(
    '/clearances/:id/approve',
    verifyToken,
    checkRole(['secretary']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { approval_notes } = req.body;

      await db.execute(
        `
      UPDATE certificates_log 
      SET status = 'Approved', approval_notes = ?, approved_by = ?, approved_at = NOW()
      WHERE id = ?
    `,
        [approval_notes || 'Approved by Secretary', req.user.id, id]
      );

      res.json({ message: 'Certificate approved successfully' });
    })
  );

  // =========================================================================
  // DOCUMENT VERIFICATION ROUTES
  // =========================================================================

  // Get registration applications with status filter
  router.get(
    '/applications',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { status } = req.query;
      const validStatuses = ['pending', 'approved', 'rejected'];
      const queryStatus = validStatuses.includes(status) ? status : 'pending';

      const [applications] = await db.execute(
        `
      SELECT * FROM resident_applications 
      WHERE status = ? 
      ORDER BY created_at ASC
    `,
        [queryStatus]
      );
      res.json(applications);
    })
  );

  router.get(
    '/applications/:id/documents',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const applicationId = String(req.params.id || '');
      const [documents] = await db.execute(
        `
      SELECT id, application_id, document_type, file_name, verification_status, created_at, updated_at
      FROM application_documents
      WHERE application_id = ?
      ORDER BY created_at ASC
      `,
        [applicationId]
      );
      res.json(documents);
    })
  );

  router.get(
    '/applications/:id/documents/:docId/download',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const applicationId = String(req.params.id || '');
      const docId = Number.parseInt(req.params.docId, 10);
      if (!Number.isFinite(docId)) {
        return res.status(400).json({ error: 'Invalid document id' });
      }

      const [rows] = await db.execute(
        `SELECT file_path, file_name, encryption_alg, encryption_iv, encryption_tag FROM application_documents WHERE id = ? AND application_id = ? LIMIT 1`,
        [docId, applicationId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const absolute = resolveAndValidateUploadedDocumentPath(rows[0].file_path);
      if (!absolute) {
        return res.status(400).json({ error: 'Invalid document path' });
      }

      const auditDetails = {
        user_id: req.user?.id || null,
        user_role: req.user?.role || null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        resource: req.originalUrl,
        action: req.method,
        result: 'SUCCESS',
        additional_details: {
          application_id: applicationId,
          document_id: docId,
        },
        session_id: req.sessionID,
      };

      res.once('finish', () => {
        if (res.statusCode >= 400) return;
        const eventType = AUDIT_EVENTS.APPLICATION_DOCUMENT_DOWNLOADED;
        logAuditEvent(eventType, auditDetails);
        if (db && typeof db.execute === 'function') {
          logAuditToDatabase(db, eventType, auditDetails);
        }
      });

      return sendStoredDocument(res, absolute, {
        file_name: rows[0].file_name,
        encryption_alg: rows[0].encryption_alg,
        encryption_iv: rows[0].encryption_iv,
        encryption_tag: rows[0].encryption_tag,
      });
    })
  );

  // Get resident documents with status filter
  router.get(
    '/resident-documents',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { status } = req.query;
      const validStatuses = ['pending', 'verified', 'rejected'];
      const queryStatus = validStatuses.includes(status) ? status : 'pending';

      const [documents] = await db.execute(
        `
      SELECT d.id, d.document_type, d.file_name, d.verification_status, d.created_at,
             CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name,
             'resident' as source_type
      FROM resident_documents d
      JOIN residents r ON d.resident_id = r.Resident_ID
      WHERE d.verification_status = ?
      AND d.document_type NOT IN ('4Ps Proof', 'PWD ID', 'Senior ID', 'Solo Parent ID', 'OSY Certification')
      
      UNION ALL
      
      SELECT d.id, d.document_type, d.file_name, d.verification_status, d.created_at,
             CONCAT(a.first_name, ' ', a.last_name) as resident_name,
             'application' as source_type
      FROM application_documents d
      JOIN resident_applications a ON d.application_id = a.application_id
      WHERE d.verification_status = ?
      
      ORDER BY created_at ASC
    `,
        [queryStatus, queryStatus]
      );
      res.json(documents);
    })
  );

  // Approve/Reject Application
  router.post(
    '/applications/:id/:action',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { action } = req.params;
      const { reason } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        const [apps] = await connection.execute(
          'SELECT * FROM resident_applications WHERE application_id = ?',
          [id]
        );
        if (apps.length === 0) {
          connection.release();
          return res.status(404).json({ error: 'Application not found' });
        }
        const app = apps[0];

        if (action === 'reject') {
          await connection.execute(
            `
            UPDATE resident_applications
            SET status = "rejected",
                rejection_reason = ?,
                reviewed_by = ?,
                reviewed_at = NOW()
            WHERE application_id = ?
          `,
            [reason?.trim() || null, req.user.id, id]
          );
          await connection.commit();
          return res.json({ message: 'Application rejected' });
        }

        // APPROVE: Migrate to main tables
        const reqInfo = {
          userId: req.user?.id || null,
          userRole: req.user?.role || null,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          originalUrl: req.originalUrl,
          sessionId: req.sessionID,
        };

        const {
          app: approvedApp,
          tempPassword,
          residentId,
        } = await approveApplication(connection, id, req.user.id, reqInfo);

        await connection.commit();

        res.json({
          message: 'Application approved and resident account created',
          credentials: { email: approvedApp.email, temp_password: tempPassword },
          resident_id: residentId,
        });
      } catch (error) {
        await connection.rollback();
        console.error('Error processing application:', error);
        res.status(500).json({ error: 'Failed to process application' });
      } finally {
        connection.release();
      }
    })
  );

  // Verify Document
  router.post(
    '/documents/:id/verify',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { status, notes, source_type } = req.body;

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Determine target table based on source_type
      // Default to resident_documents for backward compatibility if not provided
      const targetTable =
        source_type === 'application' ? 'application_documents' : 'resident_documents';

      const [result] = await db.execute(
        `
      UPDATE ${targetTable} 
      SET verification_status = ?, verification_notes = ?, verified_by = ?, verified_at = NOW()
      WHERE id = ?
    `,
        [status, notes, req.user.id, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Document not found or already processed' });
      }

      // CLEARPASS: If verified, automatically promote Guest to Resident
      let usersToNotify = [];
      let notificationTitle = `Residency Application ${status === 'verified' ? 'Approved' : 'Rejected'}`;
      let notificationMessage = `Your document has been ${status}. ${notes ? `Reason: ${notes}` : ''}`;

      try {
        if (status === 'verified') {
          if (targetTable === 'resident_documents') {
            const [docs] = await db.execute(
              'SELECT resident_id, document_type FROM resident_documents WHERE id = ?',
              [id]
            );
            if (docs.length > 0) {
              const residentId = docs[0].resident_id;
              const docType = docs[0].document_type;

              const [users] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [
                residentId,
              ]);
              usersToNotify = users.map(u => u.id);

              await db.execute(
                `UPDATE residents SET Residency_Status = 'Active', updated_at = NOW() WHERE Resident_ID = ?`,
                [residentId]
              );
              await db.execute(
                `UPDATE users SET role = ?, is_active = 1, updated_at = NOW() WHERE resident_id = ?`,
                [ROLES.RESIDENT, residentId]
              );

              // CLEARPASS: If this is a beneficiary proof, approve the vulnerability status
              const beneficiaryTypes = [
                '4Ps Proof',
                'PWD ID',
                'Senior ID',
                'Solo Parent ID',
                'OSY Certification',
              ];
              if (beneficiaryTypes.includes(docType)) {
                await db.execute(
                  `UPDATE vulnerabilities SET validation_status = 'approved', validated_by = ?, validated_at = NOW(), updated_at = NOW() WHERE Resident_ID = ?`,
                  [req.user.id, residentId]
                );
              }
            }
          } else {
            // Application Document Verified
            const [docs] = await db.execute(
              'SELECT application_id FROM application_documents WHERE id = ?',
              [id]
            );
            if (docs.length > 0) {
              const appId = docs[0].application_id;
              const [apps] = await db.execute(
                'SELECT * FROM resident_applications WHERE application_id = ?',
                [appId]
              );

              if (apps.length > 0) {
                const app = apps[0];

                // Trigger Application Approval if not already approved
                if (app.status !== 'approved') {
                  const connection = await db.getConnection();
                  try {
                    await connection.beginTransaction();
                    const reqInfo = {
                      userId: req.user?.id || null,
                      userRole: req.user?.role || null,
                      ip: req.ip || req.connection.remoteAddress,
                      userAgent: req.get('User-Agent'),
                      originalUrl: req.originalUrl,
                      sessionId: req.sessionID,
                    };
                    await approveApplication(connection, appId, req.user.id, reqInfo);
                    await connection.commit();
                    console.log(`Auto-approved application ${appId} after document verification.`);
                  } catch (approvalErr) {
                    await connection.rollback();
                    console.error(`Failed to auto-approve application ${appId}:`, approvalErr);
                    // Don't fail the verification request, just log error?
                    // Or should we warn?
                  } finally {
                    connection.release();
                  }
                }

                const email = app.email;
                const fullName = `${app.first_name} ${app.last_name}`.trim();

                // Notify users by Email OR Full Name
                const [users] = await db.execute(
                  'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(full_name) = LOWER(?)',
                  [email, fullName]
                );

                // Deduplicate user IDs
                const uniqueIds = new Set(users.map(u => u.id));
                usersToNotify = Array.from(uniqueIds);

                if (usersToNotify.length === 0)
                  console.warn(
                    `Notification failed: No user found for email ${email} or name ${fullName}`
                  );
              }
            }
          }
        } else {
          // REJECTED
          if (targetTable === 'resident_documents') {
            const [docs] = await db.execute(
              'SELECT resident_id FROM resident_documents WHERE id = ?',
              [id]
            );
            if (docs.length > 0) {
              const [users] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [
                docs[0].resident_id,
              ]);
              usersToNotify = users.map(u => u.id);
            }
          } else {
            const [docs] = await db.execute(
              'SELECT application_id FROM application_documents WHERE id = ?',
              [id]
            );
            if (docs.length > 0) {
              const [apps] = await db.execute(
                'SELECT email, first_name, last_name FROM resident_applications WHERE application_id = ?',
                [docs[0].application_id]
              );
              if (apps.length > 0) {
                const email = apps[0].email;
                const fullName = `${apps[0].first_name} ${apps[0].last_name}`.trim();

                // Notify users by Email OR Full Name
                const [users] = await db.execute(
                  'SELECT id FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(full_name) = LOWER(?)',
                  [email, fullName]
                );

                // Deduplicate user IDs
                const uniqueIds = new Set(users.map(u => u.id));
                usersToNotify = Array.from(uniqueIds);

                if (usersToNotify.length === 0)
                  console.warn(
                    `Notification failed: No user found for email ${email} or name ${fullName}`
                  );
              }
            }
          }
        }

        // Send In-App Notification to ALL matching users
        if (usersToNotify.length > 0 && global.createNotification) {
          console.log(
            `Sending notification to users [${usersToNotify.join(', ')}]: ${notificationTitle}`
          );
          for (const uid of usersToNotify) {
            await global.createNotification(
              uid,
              notificationTitle,
              notificationMessage,
              status === 'verified' ? 'success' : 'error',
              'high',
              { document_id: id, source: targetTable }
            );
          }
        } else {
          console.warn(`Skipping notification: No users found to notify.`);
        }
      } catch (err) {
        console.error('Error sending notification:', err);
      }

      res.json({ message: 'Document verification updated' });
    })
  );

  router.get(
    '/documents/:id/download',
    verifyToken,
    requireVerificationMfa,
    checkRole(['secretary', 'admin']),
    asyncHandler(async (req, res) => {
      const docId = req.params.id;
      const { source_type } = req.query;

      const targetTable =
        source_type === 'application' ? 'application_documents' : 'resident_documents';

      const [rows] = await db.execute(
        `SELECT file_path, file_name, file_data, encryption_alg, encryption_iv, encryption_tag FROM ${targetTable} WHERE id = ? LIMIT 1`,
        [docId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      if (rows[0].file_data) {
        const fileBuffer = rows[0].file_data;
        const fileName = rows[0].file_name;

        const ext = fileName.split('.').pop().toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === 'pdf') mimeType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
        else if (ext === 'png') mimeType = 'image/png';

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

        const auditDetails = {
          user_id: req.user?.id || null,
          user_role: req.user?.role || null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent'),
          resource: req.originalUrl,
          action: req.method,
          result: 'SUCCESS',
          additional_details: {
            document_id: docId,
            source_table: targetTable,
          },
          session_id: req.sessionID,
        };
        const eventType =
          targetTable === 'application_documents'
            ? AUDIT_EVENTS.APPLICATION_DOCUMENT_DOWNLOADED
            : AUDIT_EVENTS.RESIDENT_DOCUMENT_DOWNLOADED;

        logAuditEvent(eventType, auditDetails);
        if (db && typeof db.execute === 'function') {
          logAuditToDatabase(db, eventType, auditDetails);
        }

        return res.send(fileBuffer);
      }

      const absolute = resolveAndValidateUploadedDocumentPath(rows[0].file_path);
      if (!absolute) {
        return res.status(400).json({ error: 'Invalid document path' });
      }

      const auditDetails = {
        user_id: req.user?.id || null,
        user_role: req.user?.role || null,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('User-Agent'),
        resource: req.originalUrl,
        action: req.method,
        result: 'SUCCESS',
        additional_details: {
          document_id: docId,
        },
        session_id: req.sessionID,
      };

      res.once('finish', () => {
        if (res.statusCode >= 400) return;
        const eventType =
          targetTable === 'application_documents'
            ? AUDIT_EVENTS.APPLICATION_DOCUMENT_DOWNLOADED
            : AUDIT_EVENTS.RESIDENT_DOCUMENT_DOWNLOADED;
        logAuditEvent(eventType, auditDetails);
        if (db && typeof db.execute === 'function') {
          logAuditToDatabase(db, eventType, auditDetails);
        }
      });

      return sendStoredDocument(res, absolute, {
        file_name: rows[0].file_name,
        encryption_alg: rows[0].encryption_alg,
        encryption_iv: rows[0].encryption_iv,
        encryption_tag: rows[0].encryption_tag,
      });
    })
  );

  return router;
};
