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
