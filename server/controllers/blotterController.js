const crypto = require('crypto');
const db = require('../database');
const { ROLES } = require('../config/roles');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, s.name as sitio_name
      FROM blotter b
      LEFT JOIN sitios s ON b.Location_Sitio = s.name
      ORDER BY b.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching blotter:', error);
    res.status(500).json({ error: 'Failed to fetch blotter records' });
  }
};

exports.create = async (req, res) => {
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res.status(403).json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    const { 
      Case_Number, 
      Complainant_Details, 
      complainant_resident_id,
      Respondent_Details, 
      respondent_resident_id,
      respondent_id, // Keep for backward compatibility
      Incident_Type, 
      Narrative, 
      DateTime_Incident, 
      Location_Sitio, 
      Status 
    } = req.body;

    if (!Complainant_Details || !Incident_Type || !Narrative || !Location_Sitio) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Validate complainant resident ID if provided
    if (complainant_resident_id) {
      const [complainantCheck] = await db.execute('SELECT Resident_ID FROM residents WHERE Resident_ID = ?', [complainant_resident_id]);
      if (complainantCheck.length === 0) {
        return res.status(400).json({ error: 'Invalid complainant_resident_id - resident not found' });
      }
    }

    // Validate respondent resident ID if provided (use new field or fallback to old)
    const finalRespondentId = respondent_resident_id || respondent_id;
    if (finalRespondentId) {
      const [residentCheck] = await db.execute('SELECT Resident_ID FROM residents WHERE Resident_ID = ?', [finalRespondentId]);
      if (residentCheck.length === 0) {
        return res.status(400).json({ error: 'Invalid respondent_resident_id - resident not found' });
      }
    }

    let caseNumber = Case_Number;
    if (!caseNumber) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      // Use cryptographically secure random number
      const randomBytes = crypto.randomBytes(2);
      const sequence = String(randomBytes.readUInt16BE(0) % 9999 + 1).padStart(4, '0');
      caseNumber = `BLOT-${year}-${month}-${sequence}`;
    }

    const [result] = await db.execute(`
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
        Status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
      Status || 'Pending'
    ]);

    res.status(201).json({ id: result.insertId, Case_Number: caseNumber, message: 'Blotter record created successfully' });
  } catch (error) {
    console.error('Error creating blotter record:', error);
    res.status(500).json({ error: 'Failed to create blotter record' });
  }
};

exports.update = async (req, res) => {
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res.status(403).json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    const { Complainant_Details, Respondent_Details, Incident_Type, Narrative, DateTime_Incident, Location_Sitio, Status, Hearing_Schedule } = req.body;

    const updateFields = [];
    const values = [];

    if (Complainant_Details !== undefined) { updateFields.push('Complainant_Details = ?'); values.push(JSON.stringify(Complainant_Details)); }
    if (Respondent_Details !== undefined) { updateFields.push('Respondent_Details = ?'); values.push(Respondent_Details ? JSON.stringify(Respondent_Details) : null); }
    if (Incident_Type !== undefined) { updateFields.push('Incident_Type = ?'); values.push(Incident_Type); }
    if (Narrative !== undefined) { updateFields.push('Narrative = ?'); values.push(Narrative); }
    if (DateTime_Incident !== undefined) { updateFields.push('DateTime_Incident = ?'); values.push(DateTime_Incident); }
    if (Location_Sitio !== undefined) { updateFields.push('Location_Sitio = ?'); values.push(Location_Sitio); }
    if (Status !== undefined) { updateFields.push('Status = ?'); values.push(Status); }
    if (Hearing_Schedule !== undefined) { updateFields.push('Hearing_Schedule = ?'); values.push(Hearing_Schedule); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const sql = `UPDATE blotter SET ${updateFields.join(', ')} WHERE Case_Number = ?`;
    values.push(req.params.caseNumber);

    await db.execute(sql, values);
    res.json({ message: 'Blotter record updated successfully' });
  } catch (error) {
    console.error('Error updating blotter record:', error);
    res.status(500).json({ error: 'Failed to update blotter record' });
  }
};

exports.delete = async (req, res) => {
  if (req.user && req.user.role === ROLES.CAPTAIN) {
    return res.status(403).json({ success: false, message: 'Security Alert: Captains are Read-Only.' });
  }

  try {
    await db.execute('DELETE FROM blotter WHERE Case_Number = ?', [req.params.caseNumber]);
    res.json({ message: 'Blotter record deleted successfully' });
  } catch (error) {
    console.error('Error deleting blotter record:', error);
    res.status(500).json({ error: 'Failed to delete blotter record' });
  }
};
