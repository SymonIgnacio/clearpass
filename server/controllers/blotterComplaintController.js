const { allocateBlotterCaseNumber } = require('../utils/blotterCaseNumber');

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
        { value: 'Stray Animals', category: 'Community Ordinance', priority: 'High' },
      ];

      res.json({ success: true, data: incidentTypes });
    } catch (error) {
      console.error('Error fetching incident types:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch incident types' });
    }
  }

  async submitComplaint(req, res) {
    try {
      let {
        incident_type,
        narrative,
        incident_date,
        incident_time,
        location_sitio,
        respondent_name,
        respondent_address,
        is_vulnerable,
        confidential_flag,
      } = req.body;

      // Ensure no undefined values are passed to SQL
      incident_type = incident_type || null;
      narrative = narrative || null;
      incident_date = incident_date || null;
      incident_time = incident_time || null;
      location_sitio = location_sitio || null;
      respondent_name = respondent_name || null;
      respondent_address = respondent_address || null;
      is_vulnerable = is_vulnerable || false;
      confidential_flag = confidential_flag || false;

      const resident_id = req.user.resident_id;

      // Get complainant details
      const [residents] = await this.db.execute('SELECT * FROM residents WHERE Resident_ID = ?', [
        resident_id,
      ]);

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      const resident = residents[0];
      const case_number = await allocateBlotterCaseNumber(this.db, {
        incidentDate: `${incident_date} ${incident_time}`,
      });

      const complainant_details = {
        id: resident.Resident_ID,
        name: `${resident.First_Name} ${resident.Last_Name}`,
        address: `${resident.Household_ID}`,
        contact: resident.Mobile_Number,
        is_vulnerable: is_vulnerable || false,
        confidential: confidential_flag || false,
      };

      const respondent_details = respondent_name
        ? {
            name: respondent_name,
            address: respondent_address || 'Not specified',
            alias: respondent_alias || '',
            contact: respondent_contact || '',
          }
        : null;

      await this.db.execute(
        `
        INSERT INTO blotter (
          Case_Number, Complainant_Details, complainant_resident_id, Respondent_Details,
          Incident_Type, Narrative, DateTime_Incident, Location_Sitio, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `,
        [
          case_number,
          JSON.stringify(complainant_details),
          resident_id,
          JSON.stringify(respondent_details),
          incident_type,
          narrative,
          `${incident_date} ${incident_time}`,
          location_sitio,
        ]
      );

      // Create notification for officers
      if (global.createBulkNotification) {
        const [officers] = await this.db.execute(
          'SELECT id FROM users WHERE role = 6 AND is_active = 1'
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
        message: 'Complaint filed successfully',
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

      const [complaints] = await this.db.execute(
        `
        SELECT Case_Number, Incident_Type, Status, DateTime_Incident, 
               Location_Sitio, created_at, Hearing_Schedule
        FROM blotter 
        WHERE JSON_EXTRACT(Complainant_Details, '$.id') = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
        [resident_id, parseInt(limit), offset]
      );

      const [countResult] = await this.db.execute(
        "SELECT COUNT(*) as total FROM blotter WHERE JSON_EXTRACT(Complainant_Details, '$.id') = ?",
        [resident_id]
      );

      res.json({
        success: true,
        data: complaints,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
        },
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
    }
  }

  getIncidentPriority(incident_type) {
    if (!incident_type) return 'Low';

    const normalizedType = incident_type.toLowerCase();

    // High Priority Keywords (Crimes against Persons, Drugs, Community safety)
    const highKeywords = [
      'physical',
      'injury',
      'hurt',
      'punch',
      'stab',
      'maul',
      'bugbog',
      'suntok',
      'binugbog',
      'sinuntok',
      'tinaga',
      'sinaksak',
      'threat',
      'kill',
      'banta',
      'grave',
      'tinakot',
      'papatayin',
      'vexation',
      'scandal',
      'harass',
      'rape',
      'sexual',
      'lewd',
      'bastos',
      'nambastos',
      'hinipo',
      'manyak',
      'drug',
      'shabu',
      'marijuana',
      'weed',
      'adik',
      'droga',
      'bato',
      'curfew',
      'noise',
      'loud',
      'videoke',
      'karaoke',
      'ingay',
      'maingay',
      'nagkakantahan',
      'parking',
      'waste',
      'stray',
      'animal',
      'homicide',
      'patay',
      'pinatay',
      'bangkay',
    ];

    // Medium Priority Keywords (Crimes against Property)
    const mediumKeywords = [
      'theft',
      'steal',
      'stolen',
      'rob',
      'snatch',
      'nawala',
      'ninakaw',
      'kinuha',
      'snatcher',
      'pinitik',
      'mischief',
      'damage',
      'break',
      'sira',
      'destroy',
      'vandal',
      'sinira',
      'binasag',
      'ginuhitan',
      'estafa',
      'swindl',
      'scam',
      'trespass',
      'robbery',
      'hold up',
      'holdup',
      'holdap',
      'hinoldap',
    ];

    if (highKeywords.some(keyword => normalizedType.includes(keyword))) return 'High';
    if (mediumKeywords.some(keyword => normalizedType.includes(keyword))) return 'Medium';

    return 'Low';
  }
}

module.exports = BlotterComplaintController;
