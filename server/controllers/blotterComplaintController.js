class BlotterComplaintController {
  constructor(db) {
    this.db = db;
  }

  async getIncidentTypes(req, res) {
    try {
      const incidentTypes = [
        { value: 'Physical Injury', category: 'Against Persons', priority: 'High' },
        { value: 'Unjust Vexation', category: 'Against Persons', priority: 'High' },
        { value: 'Grave Threats', category: 'Against Persons', priority: 'High' },
        { value: 'Alarming and Scandal', category: 'Against Persons', priority: 'High' },
        { value: 'Theft (Petty)', category: 'Against Property', priority: 'Medium' },
        { value: 'Malicious Mischief', category: 'Against Property', priority: 'Medium' },
        { value: 'Estafa (Swindling)', category: 'Against Property', priority: 'Medium' },
        { value: 'Trespassing', category: 'Against Property', priority: 'Medium' },
        { value: 'Collection of Sum of Money', category: 'Civil Disputes', priority: 'Low' },
        { value: 'Ejectment', category: 'Civil Disputes', priority: 'Low' },
        { value: 'Boundary Dispute', category: 'Civil Disputes', priority: 'Low' },
        { value: 'Family Dispute', category: 'Civil Disputes', priority: 'Low' },
        { value: 'Curfew Violation', category: 'Community Ordinance', priority: 'High' },
        { value: 'Noise Barrage', category: 'Community Ordinance', priority: 'High' },
        { value: 'Illegal Parking', category: 'Community Ordinance', priority: 'High' },
        { value: 'Waste Management', category: 'Community Ordinance', priority: 'High' },
        { value: 'Stray Animals', category: 'Community Ordinance', priority: 'High' }
      ];
      
      res.json({ success: true, data: incidentTypes });
    } catch (error) {
      console.error('Error fetching incident types:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch incident types' });
    }
  }

  async submitComplaint(req, res) {
    try {
      const { 
        incident_type, 
        narrative, 
        incident_date, 
        incident_time, 
        location_sitio,
        respondent_name,
        respondent_address,
        is_vulnerable,
        confidential_flag
      } = req.body;
      
      const resident_id = req.user.resident_id;

      // Get complainant details
      const [residents] = await this.db.execute(
        'SELECT * FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      const resident = residents[0];
      const case_number = `BLOT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      const complainant_details = {
        id: resident.Resident_ID,
        name: `${resident.First_Name} ${resident.Last_Name}`,
        address: `${resident.Household_ID}`,
        contact: resident.Mobile_Number,
        is_vulnerable: is_vulnerable || false,
        confidential: confidential_flag || false
      };

      const respondent_details = respondent_name ? {
        name: respondent_name,
        address: respondent_address || 'Not specified'
      } : null;

      await this.db.execute(`
        INSERT INTO blotter (
          Case_Number, Complainant_Details, Respondent_Details,
          Incident_Type, Narrative, DateTime_Incident, Location_Sitio, Status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      `, [
        case_number,
        JSON.stringify(complainant_details),
        JSON.stringify(respondent_details),
        incident_type,
        narrative,
        `${incident_date} ${incident_time}`,
        location_sitio
      ]);

      // Create notification for officers
      if (global.createBulkNotification) {
        const [officers] = await this.db.execute(
          'SELECT id FROM users WHERE role_id = 6 AND is_active = 1'
        );
        const officerIds = officers.map(o => o.id);
        
        const priority = this.getIncidentPriority(incident_type);
        
        await global.createBulkNotification(
          officerIds,
          `New ${priority} Priority Complaint`,
          `${resident.First_Name} ${resident.Last_Name} filed: ${incident_type}`,
          priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'info',
          priority === 'High' ? 'high' : 'normal',
          { case_number, incident_type, is_vulnerable }
        );
      }

      res.status(201).json({
        success: true,
        data: { case_number },
        message: 'Complaint filed successfully'
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      res.status(500).json({ success: false, message: 'Failed to submit complaint' });
    }
  }

  async getMyComplaints(req, res) {
    try {
      const resident_id = req.user.resident_id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const [complaints] = await this.db.execute(`
        SELECT Case_Number, Incident_Type, Status, DateTime_Incident, 
               Location_Sitio, created_at, Hearing_Schedule
        FROM blotter 
        WHERE JSON_EXTRACT(Complainant_Details, '$.id') = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [resident_id, parseInt(limit), offset]);

      const [countResult] = await this.db.execute(
        'SELECT COUNT(*) as total FROM blotter WHERE JSON_EXTRACT(Complainant_Details, \'$.id\') = ?',
        [resident_id]
      );

      res.json({
        success: true,
        data: complaints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
    }
  }

  getIncidentPriority(incident_type) {
    const highPriority = ['Physical Injury', 'Unjust Vexation', 'Grave Threats', 'Alarming and Scandal', 'Curfew Violation', 'Noise Barrage', 'Illegal Parking', 'Waste Management', 'Stray Animals'];
    const mediumPriority = ['Theft (Petty)', 'Malicious Mischief', 'Estafa (Swindling)', 'Trespassing'];
    
    if (highPriority.includes(incident_type)) return 'High';
    if (mediumPriority.includes(incident_type)) return 'Medium';
    return 'Low';
  }
}

module.exports = BlotterComplaintController;