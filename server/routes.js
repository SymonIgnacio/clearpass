const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, checkRole } = require('./authMiddleware');
const { enforcePermissions, BUSINESS_RULES } = require('./permissions');

// Configure multer for photo uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for verification uploads
const verificationUpload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF images and PDF files are allowed'));
    }
  }
});

// Controllers
const authController = require('./authController');
const adminController = require('./adminController');
const clerkController = require('./clerkController');
const blotterController = require('./blotterController');
const residentController = require('./residentController');
const captainController = require('./captainController');
const documentController = require('./documentController');

// =========================================================================
// PUBLIC ROUTES (Restricted: No Signup, Login Only)
// =========================================================================
router.post('/auth/officer-login', authController.staffLogin); // THEMIS: Officer login endpoint
router.post('/auth/register', verifyToken, authController.register); // User registration - Super Admin only

router.post('/auth/check-census', authController.checkCensus);
router.post('/auth/register-resident', authController.registerResident);
router.post('/auth/resident/login', authController.loginResident);

// Note: Resident Signup is DISABLED per security policy.

// =========================================================================
// ROLE 1: IT ADMIN ROUTES (System Owner)
// =========================================================================
router.get('/admin/dashboard',
    verifyToken, enforcePermissions('/api/admin/dashboard'), adminController.getDashboardStats);
router.post('/admin/residents/import',
    verifyToken, enforcePermissions('/api/admin/residents/import'), BUSINESS_RULES.restrictUserCreation, adminController.bulkImportResidents); // Admin + Clerk per requirements
router.get('/admin/ai-analytics',
    verifyToken, enforcePermissions('/api/admin/ai-analytics'), adminController.getAiTechnicalView);
router.get('/admin/users',
    verifyToken, enforcePermissions('/api/users'), adminController.getAllUsers);
router.post('/admin/users',
    verifyToken, enforcePermissions('/api/users'), adminController.createUser);
router.put('/admin/users/:id',
    verifyToken, enforcePermissions('/api/users/:id'), adminController.updateUser);
router.get('/admin/settings',
    verifyToken, enforcePermissions('/api/admin/settings'), async (req, res) => {
    res.json({
        message: 'System settings management',
        settings: {
            maintenance_mode: false,
            sms_enabled: true,
            email_enabled: true,
            backup_schedule: 'daily',
            session_timeout: 3600
        }
    });
});
router.get('/admin/reports/pdf/blotter',
    verifyToken, enforcePermissions('/api/admin/reports/pdf/blotter'), adminController.generateBlotterPDF);
router.get('/admin/reports/pdf/residents',
    verifyToken, enforcePermissions('/api/admin/reports/pdf/residents'), adminController.generateResidentsPDF);

// =========================================================================
// ROLE 2: CLERK ROUTES (ClearPass Operator)
// =========================================================================
router.get('/clerk/clearances',
    verifyToken, enforcePermissions('/api/clerk/clearances'), clerkController.getAllClearances);
router.post('/clerk/residents',
    verifyToken, enforcePermissions('/api/clerk/residents'), clerkController.registerResident);
router.post('/clerk/clearances/issue',
    verifyToken, enforcePermissions('/api/clerk/clearances/issue'), BUSINESS_RULES.checkBlotterBeforeClearance, clerkController.issueClearance); // The Logic Gate Endpoint
router.get('/clerk/documents',
    verifyToken, enforcePermissions('/api/clerk/documents'), clerkController.getDocumentIssuance);

// =========================================================================
// ROLE 3: BLOTTER OFFICER ROUTES (Encoder)
// =========================================================================
router.post('/officer/cases',
    verifyToken, enforcePermissions('/api/officer/cases'), blotterController.createCase);
router.put('/officer/cases/:caseNumber/resolve',
    verifyToken, enforcePermissions('/api/officer/cases/:caseNumber/resolve'), blotterController.updateCaseStatus);
router.get('/officer/ai-analytics',
    verifyToken, enforcePermissions('/api/officer/ai-analytics'), blotterController.getHotspotAnalytics);
router.get('/officer/reports',
    verifyToken, enforcePermissions('/api/officer/reports'), blotterController.generateMonthlyReport);

// =========================================================================
// ROLE 4: RESIDENT ROUTES (Self-Service)
// =========================================================================
router.get('/resident/dashboard',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/dashboard'), residentController.getDashboardStats);
router.post('/resident/request-clearance',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/request-clearance'), residentController.requestClearance);
router.get('/resident/requests',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/requests'), residentController.getMyRequests);
router.get('/resident/profile',
    verifyToken, checkRole([4]), enforcePermissions('/api/auth/profile'), residentController.getProfile);
router.post('/resident/profile/update-photo',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/profile/update-photo'), upload.single('photo'), residentController.updateProfilePhoto);
router.post('/resident/upload-verification',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/upload-verification'), verificationUpload.single('verification'), residentController.uploadVerification);

// =========================================================================
// ROLE 5: CAPTAIN ROUTES (Read-Only Executive)
// =========================================================================
router.get('/captain/dashboard',
    verifyToken, checkRole([5]), enforcePermissions('/api/captain/dashboard'), captainController.getExecutiveDashboard);
// Note: Additional captain routes commented out - functions not yet implemented
// router.get('/captain/residents', verifyToken, checkRole([5]), captainController.getResidentsReadOnly);
// router.get('/captain/blotters', verifyToken, checkRole([5]), captainController.getBlottersReadOnly);
// router.get('/captain/clearances', verifyToken, checkRole([5]), captainController.getClearancesReadOnly);
// router.get('/captain/reports', verifyToken, checkRole([5]), captainController.getAnalyticsReports);
// router.get('/captain/settings', verifyToken, checkRole([5]), captainController.getSettingsReadOnly);

// =========================================================================
// ROLE 6: SECRETARY ROUTES (Overseer)
// =========================================================================
router.get('/secretary/clearances',
    verifyToken, checkRole([6]), enforcePermissions('/api/secretary/clearances'), clerkController.getAllClearances); // View Only
// router.put('/secretary/clearances/:id/approve',
//     verifyToken, checkRole([6]), enforcePermissions('/api/secretary/clearances/:id/approve'), clerkController.approveClearance); // Override
// Note: Additional secretary routes commented out - functions not yet implemented
// router.get('/secretary/dashboard', verifyToken, checkRole([6]), clerkController.getSecretaryDashboard);
// router.get('/secretary/residents', verifyToken, checkRole([6]), clerkController.getResidentsManagement);
// router.get('/secretary/blotters', verifyToken, checkRole([6]), clerkController.getBlottersMonitoring);
// router.get('/secretary/reports', verifyToken, checkRole([6]), clerkController.getAnalyticsReports);
// router.get('/secretary/settings', verifyToken, checkRole([6]), clerkController.getSettingsManagement);

// =========================================================================
// AI CHATBOT ROUTES (Available to all authenticated users)
// =========================================================================
router.post('/ai/chatbot/log',
    verifyToken, async (req, res) => {
    try {
        const {
            session_id,
            user_message,
            bot_response,
            intent_detected,
            confidence_score,
            user_id,
            resident_id
        } = req.body;

        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        await db.execute(
            'INSERT INTO ai_chatbot_conversations (session_id, user_message, bot_response, intent_detected, confidence_score, user_id, resident_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [session_id, user_message, bot_response, intent_detected, confidence_score, user_id, resident_id]
        );

        res.json({ success: true, message: 'Conversation logged successfully' });

    } catch (error) {
        console.error('Chatbot logging error:', error);
        res.status(500).json({
            error: 'Failed to log conversation',
            details: error.message
        });
    }
});

// =========================================================================
// DOCUMENT VERIFICATION ROUTES
// =========================================================================

// QR Code verification for documents and IDs
router.post('/documents/verify-qr', documentController.verifyQRCode);

// =========================================================================
// SHARED/LEGACY ROUTES (Maintained for Frontend Compatibility)
// =========================================================================
router.post('/ai/chatbot/message',
    verifyToken, async (req, res) => {
    try {
        const { message, session_id, context } = req.body;

        // Simple chatbot responses based on keywords
        const lowerMessage = message.toLowerCase();

        let response = '';
        let intent = 'general_inquiry';
        let confidence = 0.8;

        // Certificate-related queries
        if (lowerMessage.includes('certificate') || lowerMessage.includes('clearance') || lowerMessage.includes('document')) {
            intent = 'certificate_inquiry';
            response = "For certificate requests, you can:\n\n• Visit the Document Center to request certificates online\n• Required documents: Valid ID, Proof of Residency\n• Processing time: 1-3 business days\n• Fees vary by certificate type\n\nWould you like me to guide you to the request form?";
        }
        // Appointment queries
        else if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('meeting')) {
            intent = 'appointment_request';
            response = "To schedule an appointment:\n\n• Barangay Office Hours: Mon-Fri, 8AM-5PM\n• Contact: (02) 123-4567 or visit the office\n• Online scheduling coming soon!\n\nWhat type of appointment do you need?";
        }
        // Blotter queries
        else if (lowerMessage.includes('blotter') || lowerMessage.includes('complaint') || lowerMessage.includes('report')) {
            intent = 'blotter_inquiry';
            response = "For blotter reports:\n\n• File complaints at the Barangay Office\n• Required: Valid ID, Witness statements if applicable\n• Emergency: Call 911 or Barangay Hotline\n• Processing: 24-48 hours\n\nWhat type of incident would you like to report?";
        }
        // Residency queries
        else if (lowerMessage.includes('residency') || lowerMessage.includes('resident') || lowerMessage.includes('registration')) {
            intent = 'residency_inquiry';
            response = "For residency matters:\n\n• New residents: Register at Barangay Office\n• Required: Valid ID, Proof of address\n• Processing time: 3-5 business days\n• Update your profile in Settings\n\nDo you need help with registration?";
        }
        // Greeting responses
        else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('good')) {
            intent = 'greeting';
            response = "Hello! I'm BANTAY, your barangay assistant. How can I help you today?\n\nI can assist with:\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• General barangay information";
        }
        // Help requests
        else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
            intent = 'help_request';
            response = "I can help you with:\n\n📋 Certificate Requests\n• Barangay Clearance, Indigency, Residency certificates\n• Requirements and processing times\n\n📅 Appointments\n• Schedule meetings with barangay officials\n• Office hours and contact information\n\n🚨 Blotter Reports\n• File complaints and incident reports\n• Emergency contact numbers\n\n🏠 Residency Services\n• Registration for new residents\n• Profile updates and verification\n\nWhat would you like to know more about?";
        }
        // Default response
        else {
            intent = 'general_inquiry';
            response = "I'm here to help with barangay services! I can assist you with:\n\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• Residency registration\n• General barangay information\n\nPlease let me know what you need help with!";
        }

        res.json({
            response: response,
            intent: intent,
            confidence: confidence,
            session_id: session_id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            error: 'Chatbot service temporarily unavailable',
            response: "Sorry, I'm having trouble responding right now. Please try again later or contact the barangay office directly.",
            intent: 'error',
            confidence: 0
        });
    }
});

// =========================================================================
// SHARED/LEGACY ROUTES (Maintained for Frontend Compatibility)
// =========================================================================

// Firebase users - Admin and Captain access for oversight
router.get('/auth/firebase-users',
    verifyToken, checkRole([1, 5]), enforcePermissions('/api/auth/firebase-users'), async (req, res) => {
    res.json([]); // Return empty array - no firebase users in current system
});

// Residency verifications - Admin access only
router.get('/auth/residency-verifications/pending',
    verifyToken, checkRole([1]), enforcePermissions('/api/auth/residency-verifications/pending'), async (req, res) => {
    res.json([]); // Return empty array - simplified system
});

// Programs - Captain and Secretary access
router.get('/programs',
    verifyToken, checkRole([5, 6]), enforcePermissions('/api/programs'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [programs] = await db.execute(
            'SELECT * FROM community_programs ORDER BY program_date DESC'
        );
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
});

// Templates - Clerk, Captain, and Secretary access (Captain for oversight)
router.get('/templates',
    verifyToken, checkRole([2, 5, 6]), enforcePermissions('/api/templates'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [templates] = await db.execute(
            'SELECT * FROM templates WHERE is_active = true ORDER BY name'
        );
        res.json(templates);
    } catch (error) {
        res.json([]); // Return empty array if table doesn't exist
    }
});

// Households - Read access for Clerk, Captain and above
router.get('/households',
    verifyToken, checkRole([1, 2, 5, 6]), enforcePermissions('/api/households'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [households] = await db.execute(
            'SELECT * FROM households ORDER BY Household_Number'
        );
        res.json(households);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch households' });
    }
});

// Sitios - Read access for all officer roles
router.get('/sitios',
    verifyToken, checkRole([1, 2, 3, 5, 6]), enforcePermissions('/api/sitios'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [sitios] = await db.execute(
            'SELECT * FROM sitios ORDER BY name'
        );
        res.json(sitios);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sitios' });
    }
});

// Certificate types - Clerk, Captain, and Secretary access (Captain for oversight)
router.get('/certificate-types',
    verifyToken, checkRole([2, 5, 6]), enforcePermissions('/api/certificate-types'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [types] = await db.execute(
            'SELECT * FROM certificate_types WHERE is_active = true ORDER BY name'
        );
        res.json({ success: true, data: types });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// Blotter Cases - Read access for staff roles (Admin, Clerk, Blotter Officer, Captain)
router.get('/blotter',
    verifyToken, checkRole([1, 2, 3, 5]), enforcePermissions('/api/blotter'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const [blotterCases] = await db.execute(
            'SELECT * FROM blotter ORDER BY DateTime_Incident DESC'
        );
        res.json(blotterCases);
    } catch (error) {
        console.error('Error fetching blotter cases:', error);
        res.status(500).json({ error: 'Failed to fetch blotter cases' });
    }
});

// Blotter Cases - Create access for authorized staff (Admin, Clerk, Blotter Officer)
router.post('/blotter',
    verifyToken, checkRole([1, 2, 3]), enforcePermissions('/api/blotter'), blotterController.createCase);

// Blotter Cases - Delete access for authorized blotter officers only
router.delete('/blotter/:id',
    verifyToken, checkRole([3]), enforcePermissions('DELETE /api/blotter/:id'), blotterController.deleteCase);

// Census data - Read access for authorized staff (Captain, Secretary, Clerk, Admin)
router.get('/census',
    verifyToken, checkRole(['captain', 'secretary', 'clerk', 'admin']), residentController.getCensusData);

// Residents - Read access for staff roles (Admin, Clerk, Captain, Secretary)
router.get('/residents',
    verifyToken, checkRole([1, 2, 3, 5, 6]), enforcePermissions('/api/residents'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const { search, sitio_id, residency_status, show_vulnerable, dateFrom, dateTo, gender } = req.query;

        // Build WHERE conditions
        let whereConditions = [];
        let values = [];

        if (search) {
            whereConditions.push('(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Middle_Name LIKE ? OR h.Household_Number LIKE ? OR s.name LIKE ? OR r.Occupation LIKE ?)');
            const searchTerm = `%${search}%`;
            values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (sitio_id) {
            whereConditions.push('s.name = ?');
            values.push(sitio_id);
        }

        if (residency_status) {
            whereConditions.push('r.Residency_Status = ?');
            values.push(residency_status);
        }

        if (gender) {
            whereConditions.push('r.Gender = ?');
            values.push(gender);
        }

        if (show_vulnerable === 'true') {
            whereConditions.push('(r.Is_4Ps = true OR r.Is_PWD = true OR r.Is_Senior = true OR r.Is_Solo_Parent = true OR r.Is_Out_of_School_Youth = true)');
        }

        if (dateFrom) {
            whereConditions.push('r.Date_Arrival >= ?');
            values.push(dateFrom);
        }

        if (dateTo) {
            whereConditions.push('r.Date_Arrival <= ?');
            values.push(dateTo + ' 23:59:59');
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const [residents] = await db.execute(`
            SELECT r.*, h.Household_Number, s.name as sitio_name
            FROM residents r
            LEFT JOIN households h ON r.Household_ID = h.Household_ID
            LEFT JOIN sitios s ON h.Sitio_ID = s.id
            ${whereClause}
            ORDER BY r.Last_Name
        `, values);

        res.json(residents);
    } catch (error) {
        console.error('Error fetching residents:', error);
        res.status(500).json({ error: 'Failed to fetch residents' });
    }
});

// Residents CRUD operations
router.post('/residents',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/residents'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const residentData = req.body;

        // Generate unique Resident ID (6-digit format like RES-123456)
        const residentIdNumber = Math.floor(100000 + Math.random() * 900000);
        const residentId = `RES-${residentIdNumber}`;

        // Generate temporary 6-digit password
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

        // Create resident record in database
        await db.execute(`
            INSERT INTO residents (
                Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
                Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
                Voter_Status, Date_Arrival, Residency_Status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            residentId,
            residentData.household_id,
            residentData.relation_to_head || 'Head',
            residentData.first_name,
            residentData.middle_name || '',
            residentData.last_name,
            residentData.suffix || '',
            residentData.birthdate,
            residentData.gender,
            residentData.civil_status,
            residentData.occupation || '',
            parseFloat(residentData.income_estimate) || 0,
            residentData.mobile_number || '',
            residentData.voter_status || 'Non-Registered',
            residentData.date_arrival,
            'Active'
        ]);

        // Prepare vulnerabilities data for separate table
        const is4Ps = residentData.is_4ps === 'true' || residentData.is_4ps === true;
        const isPwd = residentData.is_pwd === 'true' || residentData.is_pwd === true;
        const isSoloParent = residentData.is_solo_parent === 'true' || residentData.is_solo_parent === true;
        const isOutOfSchoolYouth = residentData.is_out_of_school_youth === 'true' || residentData.is_out_of_school_youth === true;

        // Calculate if senior citizen (65+ years old) and vulnerability score
        let isSenior = false;
        if (residentData.birthdate) {
            const birthDate = new Date(residentData.birthdate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            isSenior = age >= 65;
        }

        // Calculate vulnerability score
        const vulnerabilityScore =
            (is4Ps ? 1 : 0) +
            (isPwd ? 2 : 0) +
            (isSenior ? 1 : 0) +
            (isSoloParent ? 1 : 0) +
            (isOutOfSchoolYouth ? 1 : 0);

        // Insert vulnerabilities record
        await db.execute(`
            INSERT INTO vulnerabilities (
                Resident_ID, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth,
                Disability_Type, Vulnerability_Score, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            residentId,
            is4Ps,
            isPwd,
            isSenior,
            isSoloParent,
            isOutOfSchoolYouth,
            residentData.disability_type || '',
            vulnerabilityScore
        ]);

        // Auto-create user account for resident
        let userAccount = null;
        try {
            // Hash the temporary password
            const bcrypt = require('bcryptjs');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

            // Create user account in users table
            await db.execute(`
                INSERT INTO users (
                    username, password_hash, role, email, full_name, contact_number, is_active, created_at, updated_at
                ) VALUES (?, ?, 'resident', ?, ?, ?, true, NOW(), NOW())
            `, [
                residentData.email, // Use email as username
                hashedPassword,
                residentData.email,
                `${residentData.first_name} ${residentData.last_name}`,
                residentData.mobile_number || ''
            ]);

            userAccount = {
                username: residentData.email,
                email: residentData.email,
                full_name: `${residentData.first_name} ${residentData.last_name}`,
                role: 'resident'
            };
        } catch (userError) {
            console.error('❌ Failed to create user account:', userError.message);
            // Continue without user account - don't fail the entire operation
        }

        // Return response with generated credentials
        const response = {
            resident_id: residentId,
            resident_code: residentId,
            temp_password: tempPassword,
            user_email: userAccount ? userAccount.email : null,
            user_created: !!userAccount,
            login_instructions: userAccount ?
                `Resident can login with email: ${userAccount.email} and password: ${tempPassword}` :
                `Resident ID: ${residentId} - User account creation failed, manual setup required`
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating resident:', error);
        res.status(500).json({ error: 'Failed to create resident' });
    }
});

router.put('/residents/:id',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/residents/:id'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const { id } = req.params;
        const updateData = req.body;

        // Build dynamic update query
        const updateFields = [];
        const values = [];

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                values.push(updateData[key]);
            }
        });

        if (updateFields.length > 0) {
            updateFields.push('updated_at = NOW()');

            const sql = `UPDATE residents SET ${updateFields.join(', ')} WHERE Resident_ID = ?`;
            values.push(id);

            await db.execute(sql, values);
        }

        res.json({ message: 'Resident updated successfully' });
    } catch (error) {
        console.error('Error updating resident:', error);
        res.status(500).json({ error: 'Failed to update resident' });
    }
});

router.put('/residents/:id/archive',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/residents/:id/archive'), async (req, res) => {
    try {
        // Get database connection
        const mysql = require('mysql2/promise');
        const db = mysql.createPool(require('./database'));

        const { id } = req.params;
        const { departure_reason, departure_date } = req.body;

        await db.execute(`
            UPDATE residents
            SET Residency_Status = 'Transferred Out', departure_reason = ?, departure_date = ?, updated_at = NOW()
            WHERE Resident_ID = ?
        `, [departure_reason, departure_date, id]);

        res.json({ message: 'Resident archived successfully' });
    } catch (error) {
        console.error('Error archiving resident:', error);
        res.status(500).json({ error: 'Failed to archive resident' });
    }
});

module.exports = router;
