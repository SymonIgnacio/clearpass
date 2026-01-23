class ResidentProfileController {
  constructor(db) {
    this.db = db;
  }

  async getProfile(req, res) {
    try {
      const resident_id = req.user.resident_id;

      // Handle Guest/Applicant scenario
      if (!resident_id) {
        const [applications] = await this.db.execute(
          `
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
        `,
          [req.user.email]
        );

        if (applications.length === 0) {
          // Fallback if no application found but user exists (should rarely happen for guests)
          return res.json({
            success: true,
            data: {
              First_Name: req.user.username,
              Last_Name: '',
              Residency_Status: 'Guest',
            },
          });
        }

        // Add calculated fields for consistency
        const app = applications[0];
        app.Vulnerability_Score = this.calculateVulnerabilityScore({
          Is_4Ps: app.Is_4Ps,
          Is_PWD: app.Is_PWD,
          Is_Senior: false, // Not tracked in applications explicitly usually
          Is_Solo_Parent: app.Is_Solo_Parent,
          Is_Out_of_School_Youth: app.Is_Out_of_School_Youth,
        });

        return res.json({ success: true, data: app });
      }

      const [residents] = await this.db.execute(
        `
        SELECT r.*, r.Email as email, h.Street_Address, h.Household_Number, s.name as sitio_name,
               v.Is_4Ps, v.Is_PWD, v.Is_Senior, v.Is_Solo_Parent, v.Is_Out_of_School_Youth,
               v.Disability_Type, v.Vulnerability_Score, v.validation_status
        FROM residents r
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
        WHERE r.Resident_ID = ?
      `,
        [resident_id]
      );

      if (residents.length === 0) {
        return res.status(404).json({ success: false, message: 'Resident not found' });
      }

      res.json({ success: true, data: residents[0] });
    } catch (error) {
      console.error('Error fetching profile:', { err: error, reqId: req.requestId });
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req, res) {
    try {
      const resident_id = req.user.resident_id;
      const {
        First_Name,
        Last_Name,
        Middle_Name,
        Suffix,
        Mobile_Number,
        Occupation,
        Income_Estimate,
        Civil_Status,
        email,
      } = req.body;

      // Sanitize inputs to avoid database errors with empty strings
      const safeIncome = Income_Estimate === '' ? null : Income_Estimate;
      const safeCivilStatus = Civil_Status === '' ? null : Civil_Status;
      const safeOccupation = Occupation === '' ? null : Occupation;
      const safeMobile = Mobile_Number === '' ? null : Mobile_Number;
      const safeEmail = email === '' ? null : email;

      if (!resident_id) {
        // Handle Guest/Applicant update (update resident_applications)
        // Note: Applicants typically cannot change their name/email easily as it's part of the application identity,
        // but we allow updating contact info and other details.
        await this.db.execute(
          `
            UPDATE resident_applications SET 
              first_name = ?, last_name = ?, middle_name = ?, suffix = ?,
              mobile_number = ?, occupation = ?, income_estimate = ?,
              civil_status = ?, updated_at = NOW()
            WHERE email = ?
          `,
          [
            First_Name,
            Last_Name,
            Middle_Name,
            Suffix,
            safeMobile,
            safeOccupation,
            safeIncome,
            safeCivilStatus,
            req.user.email,
          ]
        );

        // If email is being changed, we need to update users table too, but we used email as the lookup key above.
        // Changing email for an unverified applicant is risky without re-verification logic.
        // For now, we skip email updates for guests or require them to contact admin.
      } else {
        // Handle Verified Resident update
        await this.db.execute(
          `
            UPDATE residents SET 
              First_Name = ?, Last_Name = ?, Middle_Name = ?, Suffix = ?,
              Mobile_Number = ?, Occupation = ?, Income_Estimate = ?,
              Civil_Status = ?, Email = ?, updated_at = NOW()
            WHERE Resident_ID = ?
          `,
          [
            First_Name,
            Last_Name,
            Middle_Name,
            Suffix,
            safeMobile,
            safeOccupation,
            safeIncome,
            safeCivilStatus,
            safeEmail,
            resident_id,
          ]
        );

        // Update user email if provided
        if (safeEmail) {
          await this.db.execute('UPDATE users SET email = ? WHERE resident_id = ?', [
            safeEmail,
            resident_id,
          ]);
        }
      }

      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', { err: error, reqId: req.requestId });
      res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  }

  async updateBeneficiaryStatus(req, res) {
    try {
      const resident_id = req.user.resident_id;

      // Block guests/applicants from submitting beneficiary claims until they are verified residents
      if (!resident_id) {
        return res.status(403).json({
          success: false,
          message:
            'Beneficiary claims can only be submitted by verified residents. Please complete your residency verification first.',
        });
      }

      // Handle multipart form data
      const { Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth, Disability_Type } =
        req.body;

      // Handle file uploads if any
      const files = req.files || {};
      const toBool = val => val === 'true' || val === true || val === '1';

      // Check if vulnerability record exists to get current state
      const [existingVulnerabilities] = await this.db.execute(
        'SELECT * FROM vulnerabilities WHERE Resident_ID = ?',
        [resident_id]
      );
      const currentStatus = existingVulnerabilities.length > 0 ? existingVulnerabilities[0] : {};

      // Helper to check if a status is already approved/active in DB
      const isAlreadyActive = field => currentStatus[field] === 1 || currentStatus[field] === true;

      // Server-side validation for required documents
      // Only require files if the status is being set to true AND it wasn't already true (new claim)
      if (
        toBool(Is_4Ps) &&
        !isAlreadyActive('Is_4Ps') &&
        !(files.Is_4Ps_File && files.Is_4Ps_File.length > 0)
      ) {
        return res.status(400).json({ success: false, message: '4Ps ID proof is required' });
      }
      if (
        toBool(Is_PWD) &&
        !isAlreadyActive('Is_PWD') &&
        (!Disability_Type || Disability_Type.length === 0)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Disability Type is required for PWD' });
      }
      if (
        toBool(Is_PWD) &&
        !isAlreadyActive('Is_PWD') &&
        (!files.Is_PWD_File_Front || !files.Is_PWD_File_Back)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'PWD ID front and back are required' });
      }
      if (
        toBool(Is_Senior) &&
        !isAlreadyActive('Is_Senior') &&
        (!files.Is_Senior_File_Front || !files.Is_Senior_File_Back)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Senior ID front and back are required' });
      }
      if (
        toBool(Is_Solo_Parent) &&
        !isAlreadyActive('Is_Solo_Parent') &&
        (!files.Is_Solo_Parent_File_Front || !files.Is_Solo_Parent_File_Back)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Solo Parent ID front and back are required' });
      }
      if (
        toBool(Is_Out_of_School_Youth) &&
        !isAlreadyActive('Is_Out_of_School_Youth') &&
        !(files.Is_Out_of_School_Youth_File && files.Is_Out_of_School_Youth_File.length > 0)
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'Out of School Youth certification is required' });
      }

      // We will store document proofs in a separate table or reuse resident_documents
      // For this implementation, we assume we insert into resident_documents

      const uploadDocument = async (file, type) => {
        if (!file) return;

        // Store in database as BLOB
        await this.db.execute(
          `
          INSERT INTO resident_documents (
            resident_id, document_type, file_name, file_path, file_data, mime_type, verification_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        `,
          [resident_id, type, file.originalname, 'database_blob', file.buffer, file.mimetype]
        );
      };

      if (files.Is_4Ps_File && files.Is_4Ps_File.length > 0)
        await uploadDocument(files.Is_4Ps_File[0], '4Ps Proof');

      // Handle PWD (Front/Back)
      if (files.Is_PWD_File_Front && files.Is_PWD_File_Front.length > 0)
        await uploadDocument(files.Is_PWD_File_Front[0], 'PWD ID (Front)');
      if (files.Is_PWD_File_Back && files.Is_PWD_File_Back.length > 0)
        await uploadDocument(files.Is_PWD_File_Back[0], 'PWD ID (Back)');

      // Handle Senior (Front/Back)
      if (files.Is_Senior_File_Front && files.Is_Senior_File_Front.length > 0)
        await uploadDocument(files.Is_Senior_File_Front[0], 'Senior ID (Front)');
      if (files.Is_Senior_File_Back && files.Is_Senior_File_Back.length > 0)
        await uploadDocument(files.Is_Senior_File_Back[0], 'Senior ID (Back)');

      // Handle Solo Parent (Front/Back)
      if (files.Is_Solo_Parent_File_Front && files.Is_Solo_Parent_File_Front.length > 0)
        await uploadDocument(files.Is_Solo_Parent_File_Front[0], 'Solo Parent ID (Front)');
      if (files.Is_Solo_Parent_File_Back && files.Is_Solo_Parent_File_Back.length > 0)
        await uploadDocument(files.Is_Solo_Parent_File_Back[0], 'Solo Parent ID (Back)');

      if (files.Is_Out_of_School_Youth_File && files.Is_Out_of_School_Youth_File.length > 0)
        await uploadDocument(files.Is_Out_of_School_Youth_File[0], 'OSY Certification');

      // Check if vulnerability record exists
      // Re-query not needed as we already fetched existingVulnerabilities above
      const existing = existingVulnerabilities;

      // Helper to convert 'true'/'false' strings to booleans (FormData sends strings)
      // Merge logic: If a flag is already true in DB, keep it true regardless of input (unless explicitly untoggled, but frontend locks prevents untoggling approved ones)
      // Actually, we should respect the input if it's explicitly false (user removing a claim),
      // BUT for approved claims, we usually don't let users self-remove easily or it requires re-verification.
      // Given the issue, we want to ensure we don't accidentally set an approved claim to false if the frontend didn't send it or sent it as false due to locking bugs.
      // However, the frontend sends the locked values as 'true'.
      // The issue is likely that we were overwriting everything.

      const newStatus = {
        Is_4Ps: toBool(Is_4Ps) || isAlreadyActive('Is_4Ps'),
        Is_PWD: toBool(Is_PWD) || isAlreadyActive('Is_PWD'),
        Is_Senior: toBool(Is_Senior) || isAlreadyActive('Is_Senior'),
        Is_Solo_Parent: toBool(Is_Solo_Parent) || isAlreadyActive('Is_Solo_Parent'),
        Is_Out_of_School_Youth:
          toBool(Is_Out_of_School_Youth) || isAlreadyActive('Is_Out_of_School_Youth'),
      };

      const vulnerability_score = this.calculateVulnerabilityScore(newStatus);

      if (existing.length > 0) {
        // Update existing record and set status to pending
        await this.db.execute(
          `
          UPDATE vulnerabilities SET 
            Is_4Ps = ?, Is_PWD = ?, Is_Senior = ?, Is_Solo_Parent = ?, 
            Is_Out_of_School_Youth = ?, Disability_Type = ?, 
            Vulnerability_Score = ?, validation_status = 'pending', updated_at = NOW()
          WHERE Resident_ID = ?
        `,
          [
            newStatus.Is_4Ps,
            newStatus.Is_PWD,
            newStatus.Is_Senior,
            newStatus.Is_Solo_Parent,
            newStatus.Is_Out_of_School_Youth,
            Disability_Type || currentStatus.Disability_Type || null, // Preserve existing disability type if not provided
            vulnerability_score,
            resident_id,
          ]
        );
      } else {
        // Create new record with pending status
        await this.db.execute(
          `
          INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent,
            Is_Out_of_School_Youth, Disability_Type, Vulnerability_Score, validation_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `,
          [
            resident_id,
            toBool(Is_4Ps),
            toBool(Is_PWD),
            toBool(Is_Senior),
            toBool(Is_Solo_Parent),
            toBool(Is_Out_of_School_Youth),
            Disability_Type || null,
            vulnerability_score,
          ]
        );
      }

      // Create notification for staff
      const [staff] = await this.db.execute(
        'SELECT id FROM users WHERE role IN (2, 3) AND is_active = 1'
      );
      const staffIds = staff.map(s => s.id);

      const [resident] = await this.db.execute(
        'SELECT First_Name, Last_Name FROM residents WHERE Resident_ID = ?',
        [resident_id]
      );

      if (global.createBulkNotification) {
        await global.createBulkNotification(
          staffIds,
          'Beneficiary Status Update Request',
          `${resident[0].First_Name} ${resident[0].Last_Name} requested acknowledgement for beneficiary status. Documents uploaded for review.`,
          'info',
          'medium',
          { resident_id, vulnerability_score }
        );
      }

      res.json({
        success: true,
        message: 'Request for acknowledgement submitted successfully',
        vulnerability_score,
      });
    } catch (error) {
      console.error('Error updating beneficiary status:', { err: error, reqId: req.requestId });
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
      console.error('Error fetching verification status:', { err: error, reqId: req.requestId });
      res.status(500).json({ success: false, message: 'Failed to fetch verification status' });
    }
  }

  async getDashboardStats(req, res) {
    try {
      const resident_id = req.user.resident_id;
      if (!resident_id) {
        // Guest or applicant has no certificates
        return res.json({ certificates: 0 });
      }

      const [certs] = await this.db.execute(
        'SELECT COUNT(*) as total FROM certificates_log WHERE resident_id = ?',
        [resident_id]
      );
      res.json({ certificates: certs[0].total });
    } catch (error) {
      console.error('Error fetching dashboard stats:', { err: error, reqId: req.requestId });
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  }
}

module.exports = ResidentProfileController;
