const { allocateBlotterCaseNumber } = require('../utils/blotterCaseNumber');

async function fetchResident(db, residentId) {
  const [rows] = await db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [residentId]);
  return rows[0] || null;
}

function buildComplainantDetails(resident, flags = {}) {
  if (!resident) return null;
  return {
    id: resident.Resident_ID,
    name: `${resident.First_Name} ${resident.Last_Name}`,
    address: `${resident.Household_ID}`,
    contact: resident.Mobile_Number,
    is_vulnerable: !!flags.is_vulnerable,
    confidential: !!flags.confidential_flag,
  };
}

function buildRespondentDetails(respondent) {
  if (!respondent) return null;
  if (respondent.id) {
    return {
      id: respondent.id,
      name: respondent.name || respondent.full_name || '',
      address: respondent.address || '',
      alias: respondent.alias || '',
      contact: respondent.contact || '',
    };
  }
  if (respondent.name) {
    return {
      name: respondent.name,
      address: respondent.address || 'Not specified',
      alias: respondent.alias || '',
      contact: respondent.contact || '',
    };
  }
  return null;
}

async function approveRequest(db, requestId, actorUserId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reqRows] = await connection.execute(
      'SELECT * FROM blotter_requests WHERE id = ? FOR UPDATE',
      [requestId]
    );
    if (!reqRows.length) {
      throw new Error('Request not found');
    }
    const req = reqRows[0];

    const complainant = await fetchResident(connection, req.complainant_resident_id);
    const complainantDetails = buildComplainantDetails(complainant);

    let respondentDetails = null;
    if (req.respondent_resident_id) {
      const respondent = await fetchResident(connection, req.respondent_resident_id);
      respondentDetails = buildRespondentDetails({
        id: respondent?.Resident_ID,
        name: respondent
          ? `${respondent.First_Name} ${respondent.Last_Name}`
          : req.respondent_name || '',
        address: respondent?.Household_ID || '',
        contact: respondent?.Mobile_Number || '',
      });
    } else if (req.respondent_name) {
      respondentDetails = buildRespondentDetails({ name: req.respondent_name });
    }

    const caseNumber = await allocateBlotterCaseNumber(db, {
      incidentDate: req.incident_datetime,
    });

    const safeIncidentType =
      req.incident_type && req.incident_type.trim() ? req.incident_type : 'Unjust Vexation';
    await connection.execute(
      `
        INSERT INTO blotter (
          Case_Number, Complainant_Details, complainant_resident_id, Respondent_Details,
          Incident_Type, Narrative, DateTime_Incident, Location_Sitio, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `,
      [
        caseNumber,
        JSON.stringify(complainantDetails),
        req.complainant_resident_id,
        JSON.stringify(respondentDetails),
        safeIncidentType,
        req.description_text,
        req.incident_datetime,
        req.location_sitio,
      ]
    );

    await connection.execute(
      `
        UPDATE blotter_requests 
        SET approved_blotter_case_number = ?, status = 'approved', updated_at = NOW()
        WHERE id = ?
      `,
      [caseNumber, requestId]
    );

    await connection.execute(
      `
        INSERT INTO blotter_request_audits 
          (request_id, actor_user_id, actor_role, action, message_text, created_at)
        VALUES (?, ?, (SELECT role FROM users WHERE id = ?), 'approved', ?, NOW())
      `,
      [requestId, actorUserId, actorUserId, `Approved and created case ${caseNumber}`]
    );

    await connection.commit();
    return { caseNumber };
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  approveRequest,
};
