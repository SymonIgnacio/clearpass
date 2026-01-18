class ResidentProfileController {
  constructor(db) {
    this.db = db;
  }

  async getProfile(req, res) {
    try {
      const resident_id = req.user.resident_id;

      // Handle Guest/Applicant scenario
      if (!resident_id) {
        const [applications] = await this.db.execute(`
          SELECT 
            application_id as Resident_ID,
            first_name as First_Name,
            middle_name as Middle_Name,
            last_name as Last_Name,
            suffix as Suffix,
            birthdate as Birthdate,
            birth_place as Birth_Place,
            gender as Gender,
            civil_status as Civil_Status,
            occupation as Occupation,
            income_estimate as Income_Estimate,
            email as Email,
            mobile_number as Mobile_Number,
            street_address as Street_Address,
            sitio as sitio_name,
            is_4ps as Is_4Ps,
            is_pwd as Is_PWD,
            is_solo_parent as Is_Solo_Parent,
            is_out_of_school_youth as Is_Out_of_School_Youth,
            disability_type as Disability_Type,
            status as Residency_Status
          FROM resident_applications 
          WHERE email = ? 
          ORDER BY created_at DESC LIMIT 1
        `, [req.user.email]);

        if (applications.length === 0) {
           // Fallback if no application found but user exists (should rarely happen for guests)
           return res.json({ 
             success: true, 
             data: { 
               First_Name: req.user.username, 
               Last_Name: '', 
               Residency_Status: 'Guest' 
             } 
           });
        }
        
        // Add calculated fields for consistency
        const app = applications[0];
        app.Vulnerability_Score = this.calculateVulnerabilityScore({
          Is_4Ps: app.Is_4Ps,
          Is_PWD: app.Is_PWD,
          Is_Senior: false, // Not tracked in applications explicitly usually
          Is_Solo_Parent: app.Is_Solo_Parent,
          Is_Out_of_School_Youth: app.Is_Out_of_School_Youth
        });

        return res.json({ success: true, data: app });
      }

      const [residents] = await this.db.execute(`
        SELECT r.*, h.Street_Address, h.Household_Number, s.name as sitio_name,
               v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
               v.Disability_Type, v.Vulnerability_Score
        FROM residents r
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
        WHERE r.Resident_ID = ?
      `, [resident_id]);

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      res.json({ success: true, data: residents[0] });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const resident_id = req.user.resident_id;
      const { 
        First_Name, Last_Name, Middle_Name, Suffix,
        Mobile_Number, Occupation, Income_Estimate,
        Civil_Status, email
      } = req.body;

      await this.db.execute(`
        UPDATE residents SET 
          First_Name = ?, Last_Name = ?, Middle_Name = ?, Suffix = ?,
          Mobile_Number = ?, Occupation = ?, Income_Estimate = ?,
          Civil_Status = ?, updated_at = NOW()
        WHERE Resident_ID = ?
      `, [
        First_Name, Last_Name, Middle_Name, Suffix,
        Mobile_Number, Occupation, Income_Estimate,
        Civil_Status, resident_id
      ]);

      // Update user email if provided
      if (email) {
        await this.db.execute(
          'UPDATE users SET email = ? WHERE resident_id = ?',
          [email, resident_id]
        );
      }

      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  async updateBeneficiaryStatus(req, res) {
    try {
      const resident_id = req.user.resident_id;
      const {
        Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth,
        Disability_Type
      } = req.body;

      // Check if vulnerability record exists
      const [existing] = await this.db.execute(
        'SELECT Resident_ID FROM vulnerabilities WHERE Resident_ID = ?',
        [resident_id]
      );

      const vulnerability_score = this.calculateVulnerabilityScore({
        Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth
      });

      if (existing.length > 0) {
        // Update existing record
        await this.db.execute(`
          UPDATE vulnerabilities SET 
            Is_4Ps = ?, Is_PWD = ?, Is_Senior = ?, Is_Solo_Parent = ?, 
            Is_Out_of_School_Youth = ?, Disability_Type = ?, 
            Vulnerability_Score = ?, updated_at = NOW()
          WHERE Resident_ID = ?
        `, [
          Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, 
          Is_Out_of_School_Youth, Disability_Type,
          vulnerability_score, resident_id
        ]);
      } else {
        // Create new record
        await this.db.execute(`
          INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent,
            Is_Out_of_School_Youth, Disability_Type, Vulnerability_Score
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          resident_id, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent,
          Is_Out_of_School_Youth, Disability_Type, vulnerability_score
        ]);
      }

      // Create notification for staff if high vulnerability score
      if (vulnerability_score >= 3 && global.createBulkNotification) {
        const [staff] = await this.db.execute(
          'SELECT id FROM users WHERE role IN (2, 3) AND is_active = 1'
        );
        const staffIds = staff.map(s => s.id);
        
        const [resident] = await this.db.execute(
          'SELECT First_Name, Last_Name FROM residents WHERE Resident_ID = ?',
          [resident_id]
        );

        await global.createBulkNotification(
          staffIds,
          'High Vulnerability Resident',
          `${resident[0].First_Name} ${resident[0].Last_Name} updated beneficiary status (Score: ${vulnerability_score})`,
          'warning',
          'high',
          { resident_id, vulnerability_score }
        );
      }

      res.json({ 
        success: true, 
        message: 'Beneficiary status updated successfully',
        vulnerability_score 
      });
    } catch (error) {
      console.error('Error updating beneficiary status:', error);
      res.status(500).json({ success: false, message: 'Failed to update beneficiary status' });
    }
  }

  calculateVulnerabilityScore(status) {
    let score = 0;
    if (status.Is_4Ps) score += 1;
    if (status.Is_PWD) score += 2;
    if (status.Is_Senior) score += 1;
    if (status.Is_Solo_Parent) score += 1;
    if (status.Is_Out_of_School_Youth) score += 1;
    return score;
  }

  async getVerificationStatus(req, res) {
    try {
      // If resident_id is present, query by that, otherwise use user id
      const query = req.user.resident_id 
        ? 'SELECT email_verified, phone_verified, verified_at FROM users WHERE resident_id = ?'
        : 'SELECT email_verified, phone_verified, verified_at FROM users WHERE id = ?';
      
      const param = req.user.resident_id || req.user.id;

      const [user] = await this.db.execute(query, [param]);

      if (user.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, data: user[0] });
    } catch (error) {
      console.error('Error fetching verification status:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch verification status' });
    }
  }
}

module.exports = ResidentProfileController;
