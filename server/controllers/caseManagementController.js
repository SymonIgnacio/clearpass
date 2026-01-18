const { allocateBlotterCaseNumber } = require('../utils/blotterCaseNumber');

class CaseManagementController {
  constructor(db) {
    this.db = db;
  }

  async getCaseDetails(req, res) {
    try {
      const { case_id } = req.params;

      const [cases] = await this.db.execute(
        `
        SELECT b.*, s.name as sitio_name
        FROM blotter b
        LEFT JOIN sitios s ON b.Location_Sitio = s.name
        WHERE b.Case_Number = ?
      `,
        [case_id]
      );

      if (cases.length === 0) {
        return res.status(404).json({ success: false, message: 'Case not found' });
      }

      const caseData = cases[0];

      // Parse JSON fields
      if (caseData.Complainant_Details) {
        caseData.Complainant_Details = JSON.parse(caseData.Complainant_Details);
      }
      if (caseData.Respondent_Details) {
        caseData.Respondent_Details = JSON.parse(caseData.Respondent_Details);
      }

      // Get participants
      const [participants] = await this.db.execute(
        `
        SELECT bp.*, r.First_Name, r.Last_Name, r.Mobile_Number
        FROM blotter_participants bp
        LEFT JOIN residents r ON bp.resident_id = r.Resident_ID
        WHERE bp.blotter_id = ?
      `,
        [case_id]
      );

      caseData.participants = participants;

      res.json({ success: true, data: caseData });
    } catch (error) {
      console.error('Error fetching case details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch case details' });
    }
  }

  async updateCaseStatus(req, res) {
    try {
      const { case_id } = req.params;
      const { status, hearing_schedule, notes } = req.body;

      await this.db.execute(
        `
        UPDATE blotter SET 
          Status = ?, 
          Hearing_Schedule = ?, 
          updated_at = NOW()
        WHERE Case_Number = ?
      `,
        [status, hearing_schedule, case_id]
      );

      // Create notification for complainant and respondent if case is updated
      if (global.createNotification) {
        const [caseData] = await this.db.execute(
          'SELECT Complainant_Details, Respondent_Details FROM blotter WHERE Case_Number = ?',
          [case_id]
        );

        if (caseData.length > 0) {
          const complainant = JSON.parse(caseData[0].Complainant_Details);
          const respondent = caseData[0].Respondent_Details
            ? JSON.parse(caseData[0].Respondent_Details)
            : null;

          let title = 'Case Status Updated';
          let message = `Your case ${case_id} status has been updated to: ${status}`;

          if (hearing_schedule) {
            const date = new Date(hearing_schedule).toLocaleString();
            title = 'Hearing Scheduled';
            message = `A hearing for case ${case_id} has been scheduled on ${date}. Please attend.`;
          }

          // Notify Complainant
          if (complainant && complainant.id) {
            // Find user by resident_id
            const [users] = await this.db.execute('SELECT id FROM users WHERE resident_id = ?', [
              complainant.id,
            ]);

            if (users.length > 0) {
              await global.createNotification(users[0].id, title, message, 'info', 'normal', {
                case_id,
                status,
                hearing_schedule,
              });
            }
          }

          // Notify Respondent
          if (respondent && respondent.id) {
            // Find user by resident_id
            const [users] = await this.db.execute('SELECT id FROM users WHERE resident_id = ?', [
              respondent.id,
            ]);

            if (users.length > 0) {
              await global.createNotification(
                users[0].id,
                title,
                message,
                'warning', // Warning for respondent
                'normal',
                { case_id, status, hearing_schedule }
              );
            }
          }
        }
      }

      res.json({ success: true, message: 'Case status updated successfully' });
    } catch (error) {
      console.error('Error updating case status:', error);
      res.status(500).json({ success: false, message: 'Failed to update case status' });
    }
  }

  async addCaseNote(req, res) {
    try {
      const { case_id } = req.params;
      const { note } = req.body;
      const officer_id = req.user.id;

      // For now, we'll store notes in a simple format
      // In a full implementation, you'd have a separate case_notes table
      const timestamp = new Date().toISOString();
      const noteEntry = {
        officer_id,
        note,
        timestamp,
      };

      res.json({
        success: true,
        message: 'Note added successfully',
        data: noteEntry,
      });
    } catch (error) {
      console.error('Error adding case note:', error);
      res.status(500).json({ success: false, message: 'Failed to add case note' });
    }
  }

  async generateQRCode(req, res) {
    try {
      const { case_id } = req.params;
      const { hearing_date } = req.body;

      // Generate unique QR code for hearing attendance
      const qr_code = `HEARING-${case_id}-${Date.now()}`;

      // Update case with QR code (stored in a metadata field or separate table)
      await this.db.execute(
        `
        UPDATE blotter SET 
          Hearing_Schedule = ?,
          updated_at = NOW()
        WHERE Case_Number = ?
      `,
        [hearing_date, case_id]
      );

      res.json({
        success: true,
        data: { qr_code, hearing_date },
        message: 'QR code generated for hearing attendance',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ success: false, message: 'Failed to generate QR code' });
    }
  }

  async createCase(req, res) {
    try {
      const {
        incident_type,
        description,
        location,
        incident_date,
        complainant,
        respondent,
        witnesses,
      } = req.body;

      const caseId = await allocateBlotterCaseNumber(this.db, { incidentDate: incident_date });

      await this.db.execute(
        `
        INSERT INTO blotter (
          Case_Number, Incident_Type, Description, Location_Sitio,
          DateTime_Incident, status, Complainant_Details, Respondent_Details,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, NOW(), NOW())
      `,
        [
          caseId,
          incident_type,
          description,
          location,
          incident_date,
          JSON.stringify(complainant),
          JSON.stringify(respondent),
        ]
      );

      // Add witnesses as participants
      if (witnesses && witnesses.length > 0) {
        for (const witness of witnesses) {
          await this.db.execute(
            `
            INSERT INTO blotter_participants (blotter_id, participant_name, role, contact_info)
            VALUES (?, ?, 'witness', ?)
          `,
            [caseId, witness.name, witness.contact]
          );
        }
      }

      res
        .status(201)
        .json({ success: true, case_id: caseId, message: 'Case created successfully' });
    } catch (error) {}
  }

  async getHearings(req, res) {
    try {
      const [hearings] = await this.db.execute(`
        SELECT Case_Number as case_number, Incident_Type, Hearing_Schedule as hearing_date,
               Status as status, created_at
        FROM blotter 
        WHERE Hearing_Schedule IS NOT NULL
        ORDER BY Hearing_Schedule ASC
      `);

      const formattedHearings = hearings.map(hearing => ({
        id: hearing.case_number,
        case_number: hearing.case_number,
        hearing_date: hearing.hearing_date,
        hearing_time: hearing.hearing_date
          ? new Date(hearing.hearing_date).toLocaleTimeString()
          : null,
        status: 'scheduled',
      }));

      res.json({ success: true, data: formattedHearings });
    } catch (error) {
      console.error('Error fetching hearings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hearings' });
    }
  }

  async getCases(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT Case_Number, Incident_Type, Status, DateTime_Incident, 
               Location_Sitio, created_at, Hearing_Schedule
        FROM blotter 
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND Status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [cases] = await this.db.execute(query, params);

      const [countResult] = await this.db.execute(
        `SELECT COUNT(*) as total FROM blotter WHERE 1=1${status ? ' AND Status = ?' : ''}`,
        status ? [status] : []
      );

      res.json({
        success: true,
        data: cases,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
        },
      });
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch cases' });
    }
  }

  async getCasesByOfficer(req, res) {
    return this.getCases(req, res);
  }
}

module.exports = CaseManagementController;
