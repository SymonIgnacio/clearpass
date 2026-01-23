const { approveRequest } = require('../services/blotterRequestService');
const fs = require('fs');
const path = require('path');

class BlotterRequestController {
  constructor(db) {
    this.db = db;
  }

  async submitRequest(req, res) {
    try {
      const {
        incident_type,
        description_text,
        incident_date,
        incident_time,
        location_sitio,
        location_details,
        respondent_resident_id,
        respondent_name,
        respondent_alias,
        respondent_address,
        respondent_contact,
        complainant_contact_method,
        complainant_address,
        complainant_id_type,
        complainant_id_number,
      } = req.body;

      const complainant_resident_id = req.user.resident_id;
      if (!complainant_resident_id) {
        return res
          .status(400)
          .json({ success: false, message: 'Resident authentication required' });
      }

      // Validate that the resident exists in the database
      const [residentExists] = await this.db.execute(
        'SELECT Resident_ID FROM residents WHERE Resident_ID = ?',
        [complainant_resident_id]
      );

      if (residentExists.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            'Your user account is not linked to a valid resident profile. Please contact the administrator.',
        });
      }

      const incident_datetime =
        incident_date && incident_time ? `${incident_date} ${incident_time}` : incident_date;

      const attachments = req.files?.length
        ? req.files.map(f => ({ filename: f.originalname, mimetype: f.mimetype, size: f.size }))
        : [];

      const [result] = await this.db.execute(
        `
          INSERT INTO blotter_requests
            (complainant_resident_id, respondent_resident_id, respondent_name, respondent_alias, respondent_address, respondent_contact,
             incident_type, incident_datetime, location_sitio, location_details,
             description_text, attachments_json, status,
             complainant_contact_method, complainant_address, complainant_id_type, complainant_id_number,
             created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          complainant_resident_id,
          respondent_resident_id || null,
          respondent_name || null,
          respondent_alias || null,
          respondent_address || null,
          respondent_contact || null,
          incident_type,
          incident_datetime,
          location_sitio,
          location_details || null,
          description_text,
          JSON.stringify(attachments),
          complainant_contact_method || null,
          complainant_address || null,
          complainant_id_type || null,
          complainant_id_number || null,
        ]
      );

      const requestId = result.insertId;

      if (global.createBulkNotification) {
        const [officers] = await this.db.execute(
          'SELECT id FROM users WHERE role IN (1, 6) AND is_active = 1'
        );
        const officerIds = officers.map(o => o.id);
        await global.createBulkNotification(
          officerIds,
          'New Blotter Request',
          `Resident filed ${incident_type} request`,
          'info',
          'normal',
          { request_id: requestId, incident_type, location_sitio }
        );
      }

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, created_at)
          VALUES (?, ?, 'resident', 'submitted', ?, NOW())
        `,
        [requestId, req.user.id, 'Submitted request']
      );

      res.status(201).json({ success: true, data: { request_id: requestId } });
    } catch (error) {
      console.error('Error submitting blotter request:', error);
      res.status(500).json({ success: false, message: 'Failed to submit request' });
    }
  }

  async getMyRequests(req, res) {
    try {
      const residentId = req.user.resident_id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const [rows] = await this.db.execute(
        `
          SELECT id, incident_type, status, incident_datetime, location_sitio,
                 description_text, created_at, approved_blotter_case_number
          FROM blotter_requests
          WHERE complainant_resident_id = ?
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `,
        [residentId, parseInt(limit), offset]
      );
      const [countRows] = await this.db.execute(
        'SELECT COUNT(*) as total FROM blotter_requests WHERE complainant_resident_id = ?',
        [residentId]
      );
      res.json({
        success: true,
        data: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: countRows[0].total },
      });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to fetch requests' });
    }
  }

  async listRequests(req, res) {
    try {
      const { status, assigned_officer_id, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;
      const filters = [];
      const params = [];
      if (status) {
        filters.push('status = ?');
        params.push(status);
      }
      if (assigned_officer_id) {
        filters.push('validation_assigned_officer_id = ?');
        params.push(parseInt(assigned_officer_id));
      }
      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const [rows] = await this.db.execute(
        `
          SELECT br.id, br.incident_type, br.status, br.incident_datetime, br.location_sitio,
                 br.description_text, br.created_at, br.validation_assigned_officer_id,
                 CONCAT(r.First_Name, ' ', r.Last_Name) AS complainant_name
          FROM blotter_requests br
          LEFT JOIN residents r ON r.Resident_ID = br.complainant_resident_id
          ${where}
          ORDER BY br.created_at DESC
          LIMIT ? OFFSET ?
        `,
        [...params, parseInt(limit), offset]
      );
      res.json({ success: true, data: rows });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to list requests' });
    }
  }

  async getRequestById(req, res) {
    try {
      const { id } = req.params;
      const [rows] = await this.db.execute(
        `
          SELECT br.*, CONCAT(r.First_Name, ' ', r.Last_Name) AS complainant_name 
          FROM blotter_requests br
          LEFT JOIN residents r ON r.Resident_ID = br.complainant_resident_id
          WHERE br.id = ?
        `,
        [id]
      );
      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }
      const [audits] = await this.db.execute(
        'SELECT * FROM blotter_request_audits WHERE request_id = ? ORDER BY created_at ASC',
        [id]
      );
      res.json({ success: true, data: { request: rows[0], audits } });
    } catch (error) {
      console.error('Error in getRequestById:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch request' });
    }
  }

  async validateRequest(req, res) {
    try {
      const { id } = req.params;
      const { assign_officer_id, due_at, note } = req.body;
      const officerId = assign_officer_id || req.user.id;

      // Map numeric role to ENUM string
      const roleMap = {
        1: 'admin',
        2: 'captain',
        3: 'secretary',
        4: 'clerk',
        5: 'captain', // Legacy
        6: 'secretary', // Blotter Officer mapped to secretary (closest fit for ENUM)
        12: 'resident',
        13: 'resident',
      };

      const actorRole = roleMap[req.user.role] || 'resident';

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET status = 'for_validation',
              validation_assigned_officer_id = ?,
              validation_started_at = NOW(),
              validation_due_at = ?,
              updated_at = NOW()
          WHERE id = ?
        `,
        [officerId, due_at || null, id]
      );

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, created_at)
          VALUES (?, ?, ?, 'assigned_validation', ?, NOW())
        `,
        [id, req.user.id, actorRole, note || 'Validation started']
      );

      if (global.createNotification) {
        await global.createNotification(
          officerId,
          'Request Assigned for Validation',
          `You are assigned to validate request #${id}`,
          'warning',
          'normal',
          { request_id: id }
        );
        const [rows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = rows[0]?.complainant_resident_id;
        if (residentId) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Request Under Validation',
              'Validating the request and under investigation',
              'info',
              'normal',
              { request_id: id }
            );
          }
        }
      }

      res.json({ success: true, message: 'Validation started' });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to start validation' });
    }
  }

  async updateInvestigation(req, res) {
    try {
      const { id } = req.params;
      const { investigation_checklist, investigation_findings } = req.body;

      const updateFields = ['updated_at = NOW()'];
      const params = [];

      if (investigation_checklist) {
        updateFields.push('investigation_checklist = ?');
        params.push(investigation_checklist);
      }

      if (investigation_findings !== undefined) {
        updateFields.push('investigation_findings = ?');
        params.push(investigation_findings);
      }

      params.push(id);

      const sql = `UPDATE blotter_requests SET ${updateFields.join(', ')} WHERE id = ?`;

      await this.db.execute(sql, params);

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, created_at)
          VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'added_note', ?, NOW())
        `,
        [id, req.user.id, req.user.id, 'Investigation progress updated']
      );

      res.json({ success: true, message: 'Investigation updated' });
    } catch (error) {
      console.error('Error updating investigation:', error);
      res.status(500).json({ success: false, message: 'Failed to update investigation' });
    }
  }

  async logContactComplainant(req, res) {
    try {
      const { id } = req.params;
      const { method, notes, outcome } = req.body;

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET investigation_checklist = JSON_SET(COALESCE(investigation_checklist, '{}'), '$.contacted_complainant', true),
              updated_at = NOW()
          WHERE id = ?
        `,
        [id]
      );

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, contact_method, contact_notes, created_at)
          VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'contacted_complainant', ?, ?, ?, NOW())
        `,
        [id, req.user.id, req.user.id, outcome || '', method, notes]
      );

      if (global.createNotification) {
        const [rows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = rows[0]?.complainant_resident_id;
        if (residentId) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Officer Contacted You',
              `Officer contacted you regarding request #${id}`,
              'info',
              'normal',
              { request_id: id, contact_method: method }
            );
          }
        }
      }

      res.json({ success: true, message: 'Contact logged' });
    } catch (error) {
      console.error('Error logging contact:', error);
      res.status(500).json({ success: false, message: 'Failed to log contact' });
    }
  }

  async addValidationNote(req, res) {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const files = req.files || [];
      const images = files.map(f => ({
        filename: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      }));

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET validation_notes_json = JSON_ARRAY_APPEND(COALESCE(validation_notes_json, JSON_ARRAY()), '$', CAST(? AS JSON)),
              validation_evidence_json = JSON_ARRAY_APPEND(COALESCE(validation_evidence_json, JSON_ARRAY()), '$', CAST(? AS JSON)),
              updated_at = NOW()
          WHERE id = ?
        `,
        [
          JSON.stringify({ note, by: req.user.id, at: new Date().toISOString() }),
          JSON.stringify(images),
          id,
        ]
      );

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, attachments_json, created_at)
          VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'added_note', ?, ?, NOW())
        `,
        [id, req.user.id, req.user.id, note || '', JSON.stringify(images)]
      );

      res.json({ success: true, message: 'Note added' });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to add note' });
    }
  }

  async requestInfo(req, res) {
    try {
      const { id } = req.params;
      const { message, required_fields } = req.body;

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, created_at)
          VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'requested_info', ?, NOW())
        `,
        [id, req.user.id, req.user.id, message || 'Additional information requested']
      );

      const [rows] = await this.db.execute(
        'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
        [id]
      );
      const residentId = rows[0]?.complainant_resident_id;
      if (residentId && global.createNotification) {
        const [residentUsers] = await this.db.execute(
          'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
          [residentId]
        );
        const residentUserId = residentUsers?.[0]?.id;
        if (residentUserId) {
          await global.createNotification(
            residentUserId,
            'Additional Information Requested',
            message || 'Please provide additional information for your request',
            'info',
            'normal',
            { request_id: id, required_fields: required_fields || [] }
          );
        }
      }
      res.json({ success: true, message: 'Info requested' });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to request info' });
    }
  }

  async respondInfo(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const files = req.files || [];
      const images = [];

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      for (const f of files) {
        const filePath = path.join(uploadsDir, f.originalname);
        fs.writeFileSync(filePath, f.buffer);
        images.push({
          filename: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        });
      }

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET status = 'for_validation', updated_at = NOW()
          WHERE id = ?
        `,
        [id]
      );

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, attachments_json, created_at)
          VALUES (?, ?, 'resident', 'resident_response', ?, ?, NOW())
        `,
        [id, req.user.id, message || '', JSON.stringify(images)]
      );

      res.json({ success: true, message: 'Response submitted' });
    } catch (error) {
      console.error('Error responding to info request:', error);
      res.status(500).json({ success: false, message: 'Failed to submit response' });
    }
  }

  async submitAppeal(req, res) {
    try {
      const { id } = req.params;
      const { message, files } = req.body;
      const userId = req.user.id;

      const [requestRow] = await this.db.execute('SELECT * FROM blotter_requests WHERE id = ?', [
        id,
      ]);

      if (!requestRow.length) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      const request = requestRow[0];

      if (request.status !== 'rejected') {
        return res
          .status(400)
          .json({ success: false, message: 'Only rejected requests can be appealed' });
      }

      const fileData =
        files && files.length > 0
          ? JSON.stringify(
              files.map(f => ({
                filename: f.name || 'unknown',
                size: f.size || 0,
                mimetype: f.type || 'application/octet-stream',
              }))
            )
          : null;

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET status = 'under_appeal',
              appeal_requested_at = NOW(),
              appeal_response = NULL,
              updated_at = NOW()
          WHERE id = ?
        `,
        [id]
      );

      await this.db.execute(
        `
          INSERT INTO blotter_request_audits
            (request_id, actor_user_id, actor_role, action, message_text, attachments_json, created_at)
          VALUES (?, ?, 'resident', 'appealed', ?, ?, NOW())
        `,
        [id, userId, message || '', fileData]
      );

      if (global.createNotification) {
        const [officers] = await this.db.execute(
          'SELECT id FROM users WHERE role IN (1, 6) AND is_active = 1'
        );
        const officerIds = officers.map(o => o.id);
        if (officerIds.length) {
          await global.createBulkNotification(
            officerIds,
            'Appeal Submitted',
            `Resident appealed rejected request #${id}`,
            'warning',
            'high',
            { request_id: id, appeal_message: message }
          );
        }
      }

      res.json({ success: true, message: 'Appeal submitted successfully' });
    } catch (error) {
      console.error('Error submitting appeal:', error);
      res.status(500).json({ success: false, message: 'Failed to submit appeal' });
    }
  }

  async bulkAssign(req, res) {
    try {
      const { request_ids, officer_id } = req.body;

      if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No request IDs provided' });
      }

      if (!officer_id) {
        return res.status(400).json({ success: false, message: 'Officer ID required' });
      }

      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

      await this.db.execute(
        `
          UPDATE blotter_requests
          SET status = 'for_validation',
              validation_assigned_officer_id = ?,
              validation_started_at = NOW(),
              validation_due_at = ?,
              updated_at = NOW()
          WHERE id IN (${request_ids.map(() => '?').join(',')})
        `,
        [officer_id, dueDate, ...request_ids]
      );

      for (const requestId of request_ids) {
        await this.db.execute(
          `
            INSERT INTO blotter_request_audits
              (request_id, actor_user_id, actor_role, action, message_text, created_at)
            VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'assigned_validation', ?, NOW())
          `,
          [requestId, req.user.id, req.user.id, `Bulk assigned to officer ${officer_id}`]
        );
      }

      if (global.createNotification) {
        await global.createNotification(
          officer_id,
          'Multiple Requests Assigned',
          `You have been assigned ${request_ids.length} blotter request(s) for validation`,
          'warning',
          'high',
          { request_ids }
        );
      }

      res.json({ success: true, message: `${request_ids.length} request(s) assigned to officer` });
    } catch (error) {
      console.error('Error bulk assigning:', error);
      res.status(500).json({ success: false, message: 'Failed to assign requests' });
    }
  }

  async bulkRequestInfo(req, res) {
    try {
      const { request_ids, message, required_fields } = req.body;

      if (!request_ids || !Array.isArray(request_ids) || request_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'No request IDs provided' });
      }

      const [residentUsers] = await this.db.execute(
        `
          SELECT DISTINCT u.id, br.complainant_resident_id
          FROM blotter_requests br
          JOIN users u ON u.resident_id = br.complainant_resident_id
          WHERE br.id IN (${request_ids.map(() => '?').join(',')}) AND u.is_active = 1
        `,
        [...request_ids]
      );

      if (global.createBulkNotification) {
        const userIds = residentUsers.map(u => u.id);
        if (userIds.length > 0) {
          await global.createBulkNotification(
            userIds,
            'Additional Information Requested',
            message || 'Please provide additional information for your blotter request(s)',
            'info',
            'normal',
            { request_ids, required_fields: required_fields || [] }
          );
        }
      }

      for (const requestId of request_ids) {
        await this.db.execute(
          `
            INSERT INTO blotter_request_audits
              (request_id, actor_user_id, actor_role, action, message_text, created_at)
            VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'requested_info', ?, NOW())
          `,
          [requestId, req.user.id, req.user.id, message || 'Bulk info request']
        );
      }

      res.json({
        success: true,
        message: `Information requested from ${residentUsers.length} resident(s)`,
      });
    } catch (error) {
      console.error('Error bulk requesting info:', error);
      res.status(500).json({ success: false, message: 'Failed to request information' });
    }
  }

  async handleAppeal(req, res) {
    try {
      const { id } = req.params;
      const { action, message } = req.body;

      if (action === 'approve_appeal') {
        await this.db.execute(
          `
            UPDATE blotter_requests
            SET status = 'for_validation',
                validation_assigned_officer_id = ?,
                validation_started_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
          `,
          [req.user.id, id]
        );

        await this.db.execute(
          `
            INSERT INTO blotter_request_audits
              (request_id, actor_user_id, actor_role, action, message_text, created_at)
            VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'appeal_approved', ?, NOW())
          `,
          [
            id,
            req.user.id,
            req.user.id,
            message || 'Appeal approved, request reopened for validation',
          ]
        );

        const [residentRows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = residentRows[0]?.complainant_resident_id;

        if (residentId && global.createNotification) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Appeal Approved',
              `Your appeal for request #${id} was approved. The request is now under validation.`,
              'success',
              'normal',
              { request_id: id }
            );
          }
        }
      } else if (action === 'deny_appeal') {
        await this.db.execute(
          `
            UPDATE blotter_requests
            SET status = 'rejected',
                appeal_response = ?,
                updated_at = NOW()
            WHERE id = ?
          `,
          [message || null, id]
        );

        await this.db.execute(
          `
            INSERT INTO blotter_request_audits
              (request_id, actor_user_id, actor_role, action, message_text, created_at)
            VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'appeal_denied', ?, NOW())
          `,
          [id, req.user.id, req.user.id, message || 'Appeal denied']
        );

        const [residentRows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = residentRows[0]?.complainant_resident_id;

        if (residentId && global.createNotification) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Appeal Denied',
              `Your appeal for request #${id} was denied. ${message}`,
              'error',
              'normal',
              { request_id: id, denial_reason: message }
            );
          }
        }
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action' });
      }

      res.json({ success: true, message: 'Appeal processed successfully' });
    } catch (error) {
      console.error('Error handling appeal:', error);
      res.status(500).json({ success: false, message: 'Failed to process appeal' });
    }
  }

  async setStatus(req, res) {
    try {
      const { id } = req.params;
      const { action, reason, notes } = req.body;
      if (action === 'approve') {
        const { caseNumber } = await approveRequest(this.db, id, req.user.id);
        const [rows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = rows[0]?.complainant_resident_id;
        if (residentId && global.createNotification) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Request Approved',
              `Your blotter request was approved. Case Number: ${caseNumber}`,
              'success',
              'normal',
              { request_id: id, case_number: caseNumber }
            );
          }
        }
        res.json({ success: true, data: { case_number: caseNumber } });
      } else if (action === 'reject') {
        await this.db.execute(
          `
            UPDATE blotter_requests
            SET status = 'rejected',
                rejection_reason_category = ?,
                officer_notes = ?,
                updated_at = NOW()
            WHERE id = ?
          `,
          [reason || null, notes || null, id]
        );
        await this.db.execute(
          `
            INSERT INTO blotter_request_audits
              (request_id, actor_user_id, actor_role, action, message_text, created_at)
            VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'rejected', ?, NOW())
          `,
          [id, req.user.id, req.user.id, notes || reason || 'Rejected']
        );
        const [rows] = await this.db.execute(
          'SELECT complainant_resident_id FROM blotter_requests WHERE id = ?',
          [id]
        );
        const residentId = rows[0]?.complainant_resident_id;
        if (residentId && global.createNotification) {
          const [residentUsers] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ? AND is_active = 1 ORDER BY id ASC LIMIT 1',
            [residentId]
          );
          const residentUserId = residentUsers?.[0]?.id;
          if (residentUserId) {
            await global.createNotification(
              residentUserId,
              'Request Rejected',
              `Your blotter request was rejected. Reason: ${reason}. You may add context or appeal.`,
              'error',
              'normal',
              { request_id: id, reason, allow_appeal: true }
            );
          }
        }
        res.json({ success: true, message: 'Request rejected' });
      } else {
        res.status(400).json({ success: false, message: 'Invalid action' });
      }
    } catch (error) {
      console.error('Error setting status:', error);
      const message = error.message || 'Failed to set status';
      res.status(500).json({ success: false, message });
    }
  }
}

module.exports = BlotterRequestController;
