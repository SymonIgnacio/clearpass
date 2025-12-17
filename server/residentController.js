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

        res.status(201).json({
            message: "Request Submitted Successfully",
            request_id: requestId,
            status: "Pending"
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
