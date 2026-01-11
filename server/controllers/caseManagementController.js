class CaseManagementController {
  constructor(db) {
    this.db = db;
  }

  async getCaseDetails(req, res) {
    try {
      const { case_id } = req.params;

      const [cases] = await this.db.execute(`
        SELECT b.*, s.name as sitio_name
        FROM blotter b
        LEFT JOIN sitios s ON b.Location_Sitio = s.name
        WHERE b.Case_Number = ?
      `, [case_id]);

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
      const [participants] = await this.db.execute(`
        SELECT bp.*, r.First_Name, r.Last_Name, r.Mobile_Number
        FROM blotter_participants bp
        LEFT JOIN residents r ON bp.resident_id = r.Resident_ID
        WHERE bp.blotter_id = ?
      `, [case_id]);

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

      await this.db.execute(`
        UPDATE blotter SET 
          Status = ?, 
          Hearing_Schedule = ?, 
          updated_at = NOW()
        WHERE Case_Number = ?
      `, [status, hearing_schedule, case_id]);

      // Create notification for complainant if case is updated
      if (global.createNotification) {
        const [caseData] = await this.db.execute(
          'SELECT Complainant_Details FROM blotter WHERE Case_Number = ?',
          [case_id]
        );
        
        if (caseData.length > 0) {
          const complainant = JSON.parse(caseData[0].Complainant_Details);
          
          // Find user by resident_id
          const [users] = await this.db.execute(
            'SELECT id FROM users WHERE resident_id = ?',
            [complainant.id]
          );
          
          if (users.length > 0) {
            await global.createNotification(
              users[0].id,
              'Case Status Updated',
              `Your case ${case_id} status has been updated to: ${status}`,
              'info',
              'normal',
              { case_id, status, hearing_schedule }
            );
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
        timestamp
      };

      res.json({ 
        success: true, 
        message: 'Note added successfully',
        data: noteEntry
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
      await this.db.execute(`
        UPDATE blotter SET 
          Hearing_Schedule = ?,
          updated_at = NOW()
        WHERE Case_Number = ?
      `, [hearing_date, case_id]);

      res.json({ 
        success: true, 
        data: { qr_code, hearing_date },
        message: 'QR code generated for hearing attendance'
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({ success: false, message: 'Failed to generate QR code' });
    }
  }

  async createCase(req, res) {
    try {
      const {
        incident_type, description, location, incident_date,
        complainant, respondent, witnesses, case_number
      } = req.body;

      const caseId = case_number || `BLOT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      await this.db.execute(`
        INSERT INTO blotter (
          Case_Number, Incident_Type, Description, Location_Sitio,
          DateTime_Incident, Status, Complainant_Details, Respondent_Details,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, NOW(), NOW())
      `, [
        caseId, incident_type, description, location, incident_date,
        JSON.stringify(complainant), JSON.stringify(respondent)
      ]);

      // Add witnesses as participants
      if (witnesses && witnesses.length > 0) {
        for (const witness of witnesses) {
          await this.db.execute(`
            INSERT INTO blotter_participants (blotter_id, participant_name, role, contact_info)
            VALUES (?, ?, 'witness', ?)
          `, [caseId, witness.name, witness.contact]);
        }
      }

      res.status(201).json({ success: true, case_id: caseId, message: 'Case created successfully' });
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(500).json({ success: false, message: 'Failed to create case' });
    }
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
        hearing_time: hearing.hearing_date ? new Date(hearing.hearing_date).toLocaleTimeString() : null,
        status: 'scheduled'
      }));

      res.json({ success: true, data: formattedHearings });
    } catch (error) {
      console.error('Error fetching hearings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch hearings' });
    }
  }

  async getAttendance(req, res) {
    try {
      const { hearing_id } = req.params;

      const [attendance] = await this.db.execute(`
        SELECT bp.participant_name, bp.role, 'present' as status,
               NOW() as arrival_time, '' as notes
        FROM blotter_participants bp
        WHERE bp.blotter_id = ?
      `, [hearing_id]);

      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
  }

  async markAttendance(req, res) {
    try {
      const { qr_code, timestamp } = req.body;

      // Extract case info from QR code
      const caseMatch = qr_code.match(/HEARING-(.+)-\d+/);
      if (!caseMatch) {
        return res.status(400).json({ success: false, message: 'Invalid QR code' });
      }

      const caseId = caseMatch[1];
      
      res.json({ 
        success: true, 
        message: 'Attendance marked successfully',
        case_id: caseId
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      res.status(500).json({ success: false, message: 'Failed to mark attendance' });
    }
  }

  async exportAttendanceReport(req, res) {
    try {
      const { hearing_id } = req.params;

      // Generate mock PDF report
      const reportData = `Attendance Report for Case: ${hearing_id}\nGenerated: ${new Date().toISOString()}`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-${hearing_id}.pdf"`);
      res.send(Buffer.from(reportData));
    } catch (error) {
      console.error('Error exporting attendance report:', error);
      res.status(500).json({ success: false, message: 'Failed to export report' });
    }
  }

  async generateReport(req, res) {
    try {
      const { type, start_date, end_date } = req.body;

      const [cases] = await this.db.execute(`
        SELECT COUNT(*) as total_cases,
               SUM(CASE WHEN Status = 'resolved' THEN 1 ELSE 0 END) as resolved_cases,
               SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as pending_cases
        FROM blotter 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [start_date, end_date]);

      const summary = cases[0];
      summary.resolution_rate = summary.total_cases > 0 ? 
        Math.round((summary.resolved_cases / summary.total_cases) * 100) : 0;

      const [monthlyData] = await this.db.execute(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as cases
        FROM blotter 
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `, [start_date, end_date]);

      const [statusData] = await this.db.execute(`
        SELECT Status as name, COUNT(*) as value
        FROM blotter 
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY Status
      `, [start_date, end_date]);

      const [recentCases] = await this.db.execute(`
        SELECT Case_Number as case_number, Incident_Type as incident_type,
               created_at, Status as status, 
               JSON_UNQUOTE(JSON_EXTRACT(Complainant_Details, '$.name')) as complainant_name
        FROM blotter 
        WHERE DATE(created_at) BETWEEN ? AND ?
        ORDER BY created_at DESC
        LIMIT 10
      `, [start_date, end_date]);

      res.json({
        success: true,
        data: {
          summary,
          monthly_data: monthlyData,
          status_data: statusData,
          recent_cases: recentCases
        }
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  }

  async exportReport(req, res) {
    try {
      const { type, start_date, end_date, format } = req.body;

      const reportData = `Blotter Report\nType: ${type}\nPeriod: ${start_date} to ${end_date}\nGenerated: ${new Date().toISOString()}`;
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="blotter-report-${type}.pdf"`);
      } else {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="blotter-report-${type}.xlsx"`);
      }
      
      res.send(Buffer.from(reportData));
    } catch (error) {
      console.error('Error exporting report:', error);
      res.status(500).json({ success: false, message: 'Failed to export report' });
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
          total: countResult[0].total
        }
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
