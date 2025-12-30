const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

// REMEDIATION: Implement QR-Based Clearance Request with Logic Gate
exports.requestClearance = async (req, res) => {
    const residentId = req.user.resident_id; // Extracted from Token
    const { clearanceType, purpose } = req.body;

    try {
        // STEP 1: SELF-CHECK CLEARPASS LOGIC GATE
        // We check this BEFORE creating the request to give instant feedback
        const activeCases = await knex('blotter')
            .where({ respondent_id: residentId })
            .whereIn('status', ['Active', 'Pending'])
            .count('id as count')
            .first();

        if (activeCases.count > 0) {
            return res.status(403).json({
                error: "CLEARPASS BLOCKED: You have active accountabilities. Please visit the Barangay Hall."
            });
        }

        // STEP 2: GENERATE REQUEST
        const requestId = `REQ-${Date.now()}`;
        await knex('certificates_log').insert({
            control_no: requestId,
            resident_id: residentId,
            certificate_type: clearanceType,
            purpose: purpose,
            status: 'Pending',
            processed_by: 0 // System generated
        });

        // STEP 3: GENERATE QR CODE
        const QRCode = require('qrcode');
        const qrData = JSON.stringify({
            request_id: requestId,
            resident_id: residentId,
            clearance_type: clearanceType,
            timestamp: Date.now(),
            type: 'clearance_request'
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData);

        res.status(201).json({
            message: "Request Submitted Successfully",
            request_id: requestId,
            status: "Pending",
            qr_code: qrCodeDataURL
        });

    } catch (error) {
        console.error("Resident Request Error:", error);
        res.status(500).json({ error: "System Error processing request" });
    }
};

exports.getMyRequests = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        const requests = await knex('certificates_log')
            .where({ resident_id: residentId })
            .orderBy('date_issued', 'desc');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

exports.getDashboardStats = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Get resident profile
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        // Check for active blotter cases (THEMIS ClearPass logic)
        const activeCases = await knex('blotter')
            .where({ respondent_id: residentId })
            .whereIn('status', ['Active', 'Pending'])
            .count('id as count')
            .first();

        // Determine status
        const hasActiveCase = activeCases.count > 0;
        const status = hasActiveCase ? 'BLOCKED' : 'CLEARED';

        // Get blocking case details if blocked
        let blockingCase = null;
        if (hasActiveCase) {
            const caseDetails = await knex('blotter')
                .where({ respondent_id: residentId })
                .whereIn('status', ['Active', 'Pending'])
                .select('case_number', 'DateTime_Incident', 'complaint')
                .orderBy('DateTime_Incident', 'desc')
                .first();

            if (caseDetails) {
                blockingCase = `Case #${caseDetails.case_number}`;
            }
        }

        res.json({
            profile: {
                name: `${profile.First_Name} ${profile.Last_Name}`.trim(),
                photo_url: profile.photo_url || null,
                resident_id: profile.Resident_ID,
                contact_number: profile.Mobile_Number,
                email: profile.Email
            },
            status: status,
            blocking_case: blockingCase
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateProfilePhoto = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Check if photo update is allowed (6 month rule)
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        const lastUpdate = profile.last_updated ? new Date(profile.last_updated) : new Date(2000, 0, 1);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        if (lastUpdate >= sixMonthsAgo) {
            return res.status(403).json({
                error: "Photo update not allowed. You can only update your photo once every 6 months."
            });
        }

        // Handle file upload
        if (!req.file) {
            return res.status(400).json({ error: "No photo file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Invalid file type. Only JPEG, PNG, and GIF images are allowed."
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                error: "File too large. Maximum size is 5MB."
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `profile_${residentId}_${Date.now()}.${fileExtension}`;
        const filepath = `uploads/profiles/${filename}`;

        // Ensure directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const uploadDir = path.dirname(filepath);

        try {
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.rename(req.file.path, filepath);
        } catch (fileError) {
            console.error('File operation error:', fileError);
            return res.status(500).json({ error: "Failed to save photo" });
        }

        // Update profile with new photo URL
        const photoUrl = `/uploads/profiles/${filename}`;
        await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                photo_url: photoUrl,
                last_updated: knex.fn.now()
            });

        res.json({
            message: "Profile photo updated successfully",
            photo_url: photoUrl
        });

    } catch (error) {
        console.error("Photo update error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.getProfile = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        const profile = await knex('residents').where({ Resident_ID: residentId }).first();
        if (!profile) return res.status(404).json({ error: "Profile not found" });

        // Calculate if Photo Update is needed (6 month rule)
        const lastUpdate = new Date(profile.last_updated);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const photoUpdateNeeded = lastUpdate < sixMonthsAgo;

        res.json({ ...profile, photoUpdateNeeded });
    } catch (error) {
        res.status(500).json({ error: "Database error" });
    }
};

exports.getCensusData = async (req, res) => {
    try {
        // Get census statistics by sitio
        const statsBySitio = await knex('sitios as s')
            .leftJoin('households as h', 's.id', 'h.Sitio_ID')
            .leftJoin('residents as r', 'h.Household_ID', 'r.Household_ID')
            .leftJoin('vulnerabilities as v', 'r.Resident_ID', 'v.Resident_ID')
            .select(
                's.name as sitio_name',
                knex.raw('COUNT(r.Resident_ID) as total_residents'),
                knex.raw('SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as seniors'),
                knex.raw('SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as pwd'),
                knex.raw('SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as single_parents')
            )
            .groupBy('s.id', 's.name')
            .orderBy('s.name');

        // Get overall statistics
        const overallStats = await knex('residents as r')
            .leftJoin('vulnerabilities as v', 'r.Resident_ID', 'v.Resident_ID')
            .select(
                knex.raw('COUNT(*) as total_residents'),
                knex.raw('SUM(CASE WHEN v.Is_Senior = 1 THEN 1 ELSE 0 END) as total_seniors'),
                knex.raw('SUM(CASE WHEN v.Is_PWD = 1 THEN 1 ELSE 0 END) as total_pwd'),
                knex.raw('SUM(CASE WHEN v.Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as total_single_parents')
            )
            .first();

        res.json({
            bySitio: statsBySitio,
            overall: overallStats
        });

    } catch (error) {
        console.error('Census data error:', error);
        res.status(500).json({ error: "Failed to fetch census data" });
    }
};

exports.uploadVerification = async (req, res) => {
    const residentId = req.user.resident_id;
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: "No verification file provided" });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Invalid file type. Only JPEG, PNG, GIF images and PDF files are allowed."
            });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (req.file.size > maxSize) {
            return res.status(400).json({
                error: "File too large. Maximum size is 10MB."
            });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
        const filename = `verification_${residentId}_${Date.now()}.${fileExtension}`;
        const filepath = `uploads/verification/${filename}`;

        // Ensure directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const uploadDir = path.dirname(filepath);

        try {
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.rename(req.file.path, filepath);
        } catch (fileError) {
            console.error('File operation error:', fileError);
            return res.status(500).json({ error: "Failed to save verification file" });
        }

        // Update resident record
        const verificationFileUrl = `/uploads/verification/${filename}`;
        await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                verification_file: verificationFileUrl,
                account_status: 'Pending Verification',
                updated_at: knex.fn.now()
            });

        res.json({
            message: "Verification file uploaded successfully. Your account is now under review.",
            verification_file: verificationFileUrl,
            account_status: 'Pending Verification'
        });

    } catch (error) {
        console.error("Verification upload error:", error);
        res.status(500).json({ error: "Database error" });
    }
};

exports.updateContactInfo = async (req, res) => {
    const residentId = req.user.resident_id;
    const { email, mobile_number } = req.body;

    try {
        // Create updateData object with only provided fields
        const updateData = {};
        if (email !== undefined) updateData.Email = email;
        if (mobile_number !== undefined) updateData.Mobile_Number = mobile_number;

        // Validate that updateData is not empty
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update data provided. Please provide email or mobile_number.'
            });
        }

        // Update the residents table
        const result = await knex('residents')
            .where({ Resident_ID: residentId })
            .update({
                ...updateData,
                updated_at: knex.fn.now()
            });

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Contact information updated successfully',
            records_updated: result
        });

    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update contact information',
            error: error.message
        });
    }
};

exports.requestDocument = async (req, res) => {
    const residentId = req.user.resident_id;
    const { document_type, request_data } = req.body;

    try {
        // Validate input
        if (!document_type) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }

        // Verify resident exists
        const resident = await knex('residents')
            .select('Resident_ID', 'First_Name', 'Last_Name')
            .where('Resident_ID', residentId)
            .first();

        if (!resident) {
            return res.status(404).json({
                success: false,
                message: 'Resident not found'
            });
        }

        // Generate request ID
        const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        // Insert new record into document requests table
        const [insertedRecord] = await knex('document_requests')
            .insert({
                request_id: requestId,
                resident_id: residentId,
                document_type: document_type,
                request_data: JSON.stringify(request_data || {}),
                status: 'pending',
                created_at: knex.fn.now(),
                updated_at: knex.fn.now()
            })
            .returning('*');

        // Return the created request object
        res.status(201).json({
            success: true,
            message: 'Document request created successfully',
            data: {
                request_id: insertedRecord.request_id,
                resident_id: insertedRecord.resident_id,
                document_type: insertedRecord.document_type,
                request_data: JSON.parse(insertedRecord.request_data || '{}'),
                status: insertedRecord.status,
                created_at: insertedRecord.created_at,
                updated_at: insertedRecord.updated_at
            }
        });

    } catch (error) {
        console.error('Error creating document request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create document request',
            error: error.message
        });
    }
};
