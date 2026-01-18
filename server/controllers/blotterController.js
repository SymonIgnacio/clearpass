// const db = require('../database');
const { ROLES } = require('../config/roles');
const { allocateBlotterCaseNumber } = require('../utils/blotterCaseNumber');
const notificationController = require('./notificationController');

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let values = [];

    if (search) {
      whereConditions.push(
        '(Case_Number LIKE ? OR Incident_Type LIKE ? OR Complainant_Details LIKE ? OR Narrative LIKE ?)'
      );
      const searchTerm = `%${search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('status = ?');
      values.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM blotter b ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    const [rows] = await db.execute(
      `
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ${whereClause}
      ORDER BY b.DateTime_Incident DESC
      LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), offset]
    );

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
};

exports.create = async (req, res) => {
  const db = req.app.locals.db;
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res
      .status(403)
      .json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    const {
      Complainant_Details,
      complainant_resident_id,
      Respondent_Details,
      respondent_resident_id,
      respondent_id, // Keep for backward compatibility
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status,
      status,
    } = req.body;

    if (!Complainant_Details || !Incident_Type || !Narrative || !Location_Sitio) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate complainant resident ID if provided
    if (complainant_resident_id) {
      const [complainantCheck] = await db.execute(
        'SELECT Resident_ID FROM residents WHERE Resident_ID = ?',
        [complainant_resident_id]
      );
      if (complainantCheck.length === 0) {
        return res
          .status(400)
          .json({ error: 'Invalid complainant_resident_id - resident not found' });
      }
    }

    // Validate respondent resident ID if provided (use new field or fallback to old)
    const finalRespondentId = respondent_resident_id || respondent_id;
    if (finalRespondentId) {
      const [residentCheck] = await db.execute(
        'SELECT Resident_ID FROM residents WHERE Resident_ID = ?',
        [finalRespondentId]
      );
      if (residentCheck.length === 0) {
        return res
          .status(400)
          .json({ error: 'Invalid respondent_resident_id - resident not found' });
      }
    }

    const caseNumber = await allocateBlotterCaseNumber(db, { incidentDate: DateTime_Incident });
    const finalStatus = status ?? Status ?? 'Pending';

    const [result] = await db.execute(
      `
      INSERT INTO blotter (
        Case_Number, 
        Complainant_Details, 
        complainant_resident_id,
        Respondent_Details, 
        respondent_resident_id,
        respondent_id, 
        Incident_Type, 
        Narrative, 
        DateTime_Incident, 
        Location_Sitio, 
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        caseNumber,
        JSON.stringify(Complainant_Details),
        complainant_resident_id || null,
        Respondent_Details ? JSON.stringify(Respondent_Details) : null,
        finalRespondentId || null,
        finalRespondentId || null, // Keep for backward compatibility
        Incident_Type,
        Narrative,
        DateTime_Incident,
        Location_Sitio,
        finalStatus,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      Case_Number: caseNumber,
      message: 'Blotter record created successfully',
    });
  } catch (error) {
    console.error('Error creating blotter record:', error);
    res.status(500).json({ error: 'Failed to create blotter record' });
  }
};

exports.update = async (req, res) => {
  const db = req.app.locals.db;
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res
      .status(403)
      .json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    const {
      Complainant_Details,
      Respondent_Details,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
      Status,
      Hearing_Schedule,
    } = req.body;

    const updateFields = [];
    const values = [];

    if (Complainant_Details !== undefined) {
      updateFields.push('Complainant_Details = ?');
      values.push(JSON.stringify(Complainant_Details));
    }
    if (Respondent_Details !== undefined) {
      updateFields.push('Respondent_Details = ?');
      values.push(Respondent_Details ? JSON.stringify(Respondent_Details) : null);
    }
    if (Incident_Type !== undefined) {
      updateFields.push('Incident_Type = ?');
      values.push(Incident_Type);
    }
    if (Narrative !== undefined) {
      updateFields.push('Narrative = ?');
      values.push(Narrative);
    }
    if (DateTime_Incident !== undefined) {
      updateFields.push('DateTime_Incident = ?');
      values.push(DateTime_Incident);
    }
    if (Location_Sitio !== undefined) {
      updateFields.push('Location_Sitio = ?');
      values.push(Location_Sitio);
    }
    if (Status !== undefined) {
      updateFields.push('status = ?');
      values.push(Status);
    }
    if (Hearing_Schedule !== undefined) {
      updateFields.push('Hearing_Schedule = ?');
      values.push(Hearing_Schedule);
    }
    if (req.body.resolution_notes !== undefined) {
      updateFields.push('resolution_notes = ?');
      values.push(req.body.resolution_notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE blotter SET ${updateFields.join(', ')} WHERE Case_Number = ?`;
    values.push(req.params.caseNumber);

    await db.execute(sql, values);

    // CLEARPASS: Summon Notification Logic
    // If Hearing_Schedule is updated or status is 'Scheduled for Mediation', notify residents
    if (Hearing_Schedule || Status === 'Scheduled for Mediation') {
      const [caseDetails] = await db.execute(
        'SELECT * FROM blotter WHERE Case_Number = ?',
        [req.params.caseNumber]
      );

      if (caseDetails.length > 0) {
        const c = caseDetails[0];
        const schedule = c.Hearing_Schedule 
          ? new Date(c.Hearing_Schedule).toLocaleString() 
          : 'a later date';
        
        const message = `You have been summoned for a hearing regarding Case #${c.Case_Number} on ${schedule}. Please attend.`;

        // Notify Complainant
        if (c.complainant_resident_id) {
           // Find user_id linked to resident_id
           const [u] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [c.complainant_resident_id]);
           if (u.length > 0) {
             await notificationController.createNotification({
                user_id: u[0].id,
                title: 'Blotter Hearing Summon',
                message: message,
                type: 'warning',
                priority: 'high',
                link: `/resident/blotter-report` // Or a detail view if available
             }, db); // Pass db instance if needed by implementation
           }
        }

        // Notify Respondent
        if (c.respondent_resident_id) {
           const [u] = await db.execute('SELECT id FROM users WHERE resident_id = ?', [c.respondent_resident_id]);
           if (u.length > 0) {
             await notificationController.createNotification({
                user_id: u[0].id,
                title: 'Blotter Hearing Summon',
                message: message,
                type: 'warning',
                priority: 'high',
                link: `/resident/blotter-report`
             }, db);
           }
        }
      }
    }

    res.json({ message: 'Blotter record updated successfully' });
  } catch (error) {
    console.error('Error updating blotter record:', error);
    res.status(500).json({ error: 'Failed to update blotter record' });
  }
};

exports.delete = async (req, res) => {
  const db = req.app.locals.db;
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res
      .status(403)
      .json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    await db.execute('DELETE FROM blotter WHERE Case_Number = ?', [req.params.caseNumber]);
    res.json({ message: 'Blotter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting blotter record:', error);
    res.status(500).json({ error: 'Failed to delete blotter record' });
  }
};
