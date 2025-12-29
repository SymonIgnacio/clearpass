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

// Controllers
const authController = require('./authController');
const adminController = require('./adminController');
const clerkController = require('./clerkController');
const blotterController = require('./blotterController');
const residentController = require('./residentController');
const captainController = require('./captainController');

// =========================================================================
// PUBLIC ROUTES (Restricted: No Signup, Login Only)
// =========================================================================
router.post('/auth/login', authController.login);
router.post('/auth/officer-login', authController.staffLogin); // THEMIS: Separate officer login endpoint
// Note: Resident Signup is DISABLED per security policy.

// =========================================================================
// ROLE 1: IT ADMIN ROUTES (System Owner)
// =========================================================================
router.get('/admin/dashboard',
    verifyToken, checkRole([1]), enforcePermissions('/api/admin/dashboard'), adminController.getDashboardStats);
router.post('/admin/residents/import',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/admin/residents/import'), BUSINESS_RULES.restrictUserCreation, adminController.bulkImportResidents); // Admin + Clerk per requirements
router.get('/admin/ai-analytics',
    verifyToken, checkRole([1]), enforcePermissions('/api/admin/ai-analytics'), adminController.getAiTechnicalView);
router.get('/admin/users',
    verifyToken, checkRole([1]), enforcePermissions('/api/users'), adminController.getAllUsers);
router.post('/admin/users',
    verifyToken, checkRole([1]), enforcePermissions('/api/users'), adminController.createUser);
router.put('/admin/users/:id',
    verifyToken, checkRole([1]), enforcePermissions('/api/users/:id'), adminController.updateUser);
router.get('/admin/settings',
    verifyToken, checkRole([1]), enforcePermissions('/api/admin/settings'), async (req, res) => {
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
    verifyToken, checkRole([1, 2, 3, 5, 6]), enforcePermissions('/api/admin/reports/pdf/blotter'), adminController.generateBlotterPDF);
router.get('/admin/reports/pdf/residents',
    verifyToken, checkRole([1, 2, 3, 5, 6]), enforcePermissions('/api/admin/reports/pdf/residents'), adminController.generateResidentsPDF);

// =========================================================================
// ROLE 2: CLERK ROUTES (ClearPass Operator)
// =========================================================================
router.get('/clerk/clearances',
    verifyToken, checkRole([2]), enforcePermissions('/api/clerk/clearances'), clerkController.getAllClearances);
router.post('/clerk/residents',
    verifyToken, checkRole([2]), enforcePermissions('/api/clerk/residents'), clerkController.registerResident);
router.post('/clerk/clearances/issue',
    verifyToken, checkRole([2]), enforcePermissions('/api/clerk/clearances/issue'), BUSINESS_RULES.checkBlotterBeforeClearance, clerkController.issueClearance); // The Logic Gate Endpoint
router.get('/clerk/documents',
    verifyToken, checkRole([2]), enforcePermissions('/api/clerk/documents'), clerkController.getDocumentIssuance);

// =========================================================================
// ROLE 3: BLOTTER OFFICER ROUTES (Encoder)
// =========================================================================
router.post('/officer/cases',
    verifyToken, checkRole([3]), enforcePermissions('/api/officer/cases'), blotterController.createCase);
router.put('/officer/cases/:caseNumber/resolve',
    verifyToken, checkRole([3]), enforcePermissions('/api/officer/cases/:caseNumber/resolve'), blotterController.updateCaseStatus);
router.get('/officer/ai-analytics',
    verifyToken, checkRole([3]), enforcePermissions('/api/officer/ai-analytics'), blotterController.getHotspotAnalytics);
router.get('/officer/reports',
    verifyToken, checkRole([3]), enforcePermissions('/api/officer/reports'), blotterController.generateMonthlyReport);

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

        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);

        await knex('ai_chatbot_conversations').insert({
            session_id,
            user_message,
            bot_response,
            intent_detected,
            confidence_score,
            user_id,
            resident_id,
            created_at: knex.fn.now()
        });

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
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const programs = await knex('community_programs')
            .select('*')
            .orderBy('program_date', 'desc');
        res.json(programs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch programs' });
    }
});

// Templates - Clerk, Captain, and Secretary access (Captain for oversight)
router.get('/templates',
    verifyToken, checkRole([2, 5, 6]), enforcePermissions('/api/templates'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const templates = await knex('templates')
            .select('*')
            .where('is_active', true)
            .orderBy('name');
        res.json(templates);
    } catch (error) {
        res.json([]); // Return empty array if table doesn't exist
    }
});

// Households - Read access for Clerk, Captain and above
router.get('/households',
    verifyToken, checkRole([1, 2, 5, 6]), enforcePermissions('/api/households'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const households = await knex('households')
            .select('*')
            .orderBy('Household_Number');
        res.json(households);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch households' });
    }
});

// Sitios - Read access for all officer roles
router.get('/sitios',
    verifyToken, checkRole([1, 2, 3, 5, 6]), enforcePermissions('/api/sitios'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const sitios = await knex('sitios')
            .select('*')
            .orderBy('name');
        res.json(sitios);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sitios' });
    }
});

// Certificate types - Clerk, Captain, and Secretary access (Captain for oversight)
router.get('/certificate-types',
    verifyToken, checkRole([2, 5, 6]), enforcePermissions('/api/certificate-types'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const types = await knex('certificate_types')
            .select('*')
            .where('is_active', true)
            .orderBy('name');
        res.json({ success: true, data: types });
    } catch (error) {
        res.json({ success: true, data: [] });
    }
});

// Blotter Cases - Read access for staff roles (Admin, Clerk, Blotter Officer, Captain)
router.get('/blotter',
    verifyToken, checkRole([1, 2, 3, 5]), enforcePermissions('/api/blotter'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const blotterCases = await knex('blotter')
            .select('*')
            .orderBy('DateTime_Incident', 'desc');
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
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const { search, sitio_id, residency_status, show_vulnerable, dateFrom, dateTo, gender } = req.query;

        let query = knex('residents as r')
            .leftJoin('households as h', 'r.Household_ID', 'h.Household_ID')
            .leftJoin('sitios as s', 'h.Sitio_ID', 's.id')
            .select(
                'r.*',
                'h.Household_Number',
                's.name as sitio_name'
            );

        if (search) {
            query = query.where(function() {
                this.where('r.First_Name', 'like', `%${search}%`)
                    .orWhere('r.Last_Name', 'like', `%${search}%`)
                    .orWhere('r.Middle_Name', 'like', `%${search}%`)
                    .orWhere('h.Household_Number', 'like', `%${search}%`)
                    .orWhere('s.name', 'like', `%${search}%`)
                    .orWhere('r.Occupation', 'like', `%${search}%`);
            });
        }

        if (sitio_id) {
            query = query.where('s.name', sitio_id);
        }

        if (residency_status) {
            query = query.where('r.Residency_Status', residency_status);
        }

        if (gender) {
            query = query.where('r.Gender', gender);
        }

        if (show_vulnerable === 'true') {
            query = query.where(function() {
                this.where('r.Is_4Ps', true)
                    .orWhere('r.Is_PWD', true)
                    .orWhere('r.Is_Senior', true)
                    .orWhere('r.Is_Solo_Parent', true)
                    .orWhere('r.Is_Out_of_School_Youth', true);
            });
        }

        if (dateFrom) {
            query = query.where('r.Date_Arrival', '>=', dateFrom);
        }

        if (dateTo) {
            query = query.where('r.Date_Arrival', '<=', dateTo + ' 23:59:59');
        }

        const residents = await query.orderBy('r.Last_Name');
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
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const residentData = req.body;

        console.log('🔍 Resident creation request data:', residentData);

        // Generate unique Resident ID (6-digit format like RES-123456)
        const residentIdNumber = Math.floor(100000 + Math.random() * 900000);
        const residentId = `RES-${residentIdNumber}`;

        // Generate temporary 6-digit password
        const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

        // Prepare data for residents table - using correct PascalCase field names
        const residentDataFormatted = {
            Resident_ID: residentId,
            Household_ID: residentData.household_id,
            Relation_to_Head: residentData.relation_to_head || 'Head',
            First_Name: residentData.first_name,
            Middle_Name: residentData.middle_name || '',
            Last_Name: residentData.last_name,
            Suffix: residentData.suffix || '',
            Birthdate: residentData.birthdate,
            Gender: residentData.gender,
            Civil_Status: residentData.civil_status,
            Occupation: residentData.occupation || '',
            Income_Estimate: parseFloat(residentData.income_estimate) || 0,
            Mobile_Number: residentData.mobile_number || '',
            Voter_Status: residentData.voter_status || 'Non-Registered',
            Date_Arrival: residentData.date_arrival,
            Residency_Status: 'Active',
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
        };

        console.log('💾 Prepared residents table data:', residentDataFormatted);

        // Create resident record in database
        await knex('residents').insert(residentDataFormatted);

        // Prepare vulnerabilities data for separate table
        const vulnerabilitiesData = {
            Resident_ID: residentId,
            Is_4Ps: residentData.is_4ps === 'true' || residentData.is_4ps === true,
            Is_PWD: residentData.is_pwd === 'true' || residentData.is_pwd === true,
            Is_Senior: false, // Will be calculated based on birthdate
            Is_Solo_Parent: residentData.is_solo_parent === 'true' || residentData.is_solo_parent === true,
            Is_Out_of_School_Youth: residentData.is_out_of_school_youth === 'true' || residentData.is_out_of_school_youth === true,
            Disability_Type: residentData.disability_type || '',
            Vulnerability_Score: 0, // Will be calculated
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
        };

        // Calculate if senior citizen (65+ years old) and vulnerability score
        if (residentData.birthdate) {
            const birthDate = new Date(residentData.birthdate);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            vulnerabilitiesData.Is_Senior = age >= 65;
        }

        // Calculate vulnerability score
        vulnerabilitiesData.Vulnerability_Score =
            (vulnerabilitiesData.Is_4Ps ? 1 : 0) +
            (vulnerabilitiesData.Is_PWD ? 2 : 0) +
            (vulnerabilitiesData.Is_Senior ? 1 : 0) +
            (vulnerabilitiesData.Is_Solo_Parent ? 1 : 0) +
            (vulnerabilitiesData.Is_Out_of_School_Youth ? 1 : 0);

        console.log('💾 Prepared vulnerabilities table data:', vulnerabilitiesData);

        // Insert vulnerabilities record
        await knex('vulnerabilities').insert(vulnerabilitiesData);

        // Auto-create user account for resident
        let userAccount = null;
        try {
            // Hash the temporary password
            const bcrypt = require('bcryptjs');
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

            // Create user account in users table
            const [userResult] = await knex('users').insert({
                username: residentData.email, // Use email as username
                password_hash: hashedPassword,
                role: 'resident',
                email: residentData.email,
                full_name: `${residentData.First_Name} ${residentData.Last_Name}`,
                contact_number: residentData.Mobile_Number || '',
                is_active: true,
                created_at: knex.fn.now(),
                updated_at: knex.fn.now()
            }).returning('id');

            userAccount = {
                user_id: userResult.id || userResult,
                username: residentData.email,
                email: residentData.email,
                full_name: `${residentData.First_Name} ${residentData.Last_Name}`,
                role: 'resident'
            };

            console.log('✅ User account created for resident:', residentId);
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

        console.log('✅ Resident created with auto-generated credentials:', {
            resident_id: residentId,
            user_created: !!userAccount
        });

        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating resident:', error);
        res.status(500).json({ error: 'Failed to create resident' });
    }
});

router.put('/residents/:id',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/residents/:id'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const { id } = req.params;
        const updateData = req.body;

        await knex('residents')
            .where('Resident_ID', id)
            .update({
                ...updateData,
                updated_at: knex.fn.now()
            });

        res.json({ message: 'Resident updated successfully' });
    } catch (error) {
        console.error('Error updating resident:', error);
        res.status(500).json({ error: 'Failed to update resident' });
    }
});

router.put('/residents/:id/archive',
    verifyToken, checkRole([1, 2]), enforcePermissions('/api/residents/:id/archive'), async (req, res) => {
    try {
        const knex = require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
        const { id } = req.params;
        const { departure_reason, departure_date } = req.body;

        await knex('residents')
            .where('Resident_ID', id)
            .update({
                Residency_Status: 'Transferred Out',
                departure_reason,
                departure_date,
                updated_at: knex.fn.now()
            });

        res.json({ message: 'Resident archived successfully' });
    } catch (error) {
        console.error('Error archiving resident:', error);
        res.status(500).json({ error: 'Failed to archive resident' });
    }
});

module.exports = router;
