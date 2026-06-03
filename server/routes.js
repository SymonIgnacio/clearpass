const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, verifyRole } = require('./middleware/authMiddleware');
const { asyncHandler } = require('./middleware/errorHandler');
const db = require('./database');
const { allocateBlotterCaseNumber } = require('./utils/blotterCaseNumber');
const { validateUploadedFiles } = require('./utils/fileTypeValidation');
const { requireMfaForRoles } = require('./middleware/mfaMiddleware');

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
  },
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
  },
});
const validateImageFiles = validateUploadedFiles(['jpeg', 'png', 'gif'], { maxSizeBytes: 5 * 1024 * 1024 });
const validateVerificationFiles = validateUploadedFiles(['jpeg', 'png', 'gif', 'pdf'], { maxSizeBytes: 10 * 1024 * 1024 });

// Controllers
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const reportController = require('./controllers/reportController');
const residentController = require('./controllers/residentController');
const AIAnalyticsController = require('./controllers/AIAnalyticsController');
const aiController = new AIAnalyticsController(db);

// Import validation middleware
const {
  validateLogin,
  validateRegister,
  validateBlotter,
  validateResident,
  validateCertificateRequest,
  validateDocumentRequest,
  validateCommunityProgram,
  validateHousehold,
  validateChatbotMessage,
} = require('./middleware/validate');
const { ROLES } = require('./config/roles');
const requireAdminMfa = requireMfaForRoles([ROLES.ADMIN]);
const requireVerificationMfa = requireMfaForRoles([ROLES.ADMIN, ROLES.SECRETARY, ROLES.CLERK]);

/**
 * @swagger
 * /auth/officer-login:
 *   post:
 *     summary: Officer login endpoint
 *     description: Authenticates staff members (admin, clerk, blotter officer, captain, secretary)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 description: Staff username
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Staff password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many authentication attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Auth routes
router.post('/auth/login', validateLogin, authController.login);
router.post('/auth/officer-login', validateLogin, authController.login);
router.post('/auth/resident/login', validateLogin, authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', verifyToken, authController.me);
router.post('/auth/mfa/request', verifyToken, authController.requestMfaOtp);
router.post('/auth/mfa/verify', verifyToken, authController.verifyMfaOtpCode);

// SECURITY CRITICAL: Public registration completely disabled - only admin can create users via database
router.post('/auth/register', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Public registration is disabled. Contact administrator for account creation.',
  });
});

// Note: Resident Signup is DISABLED per security policy.

// =========================================================================
// ROLE 1: IT ADMIN ROUTES (System Owner) - Role 5
// =========================================================================
// Note: Frontend uses /dashboard for all roles, not /admin/dashboard
// Backend should support both /api/admin/* and generic endpoints
router.get(
  '/admin/dashboard',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const [users] = await db.execute('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [blotter] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [certificates] = await db.execute(
      'SELECT COUNT(*) as total FROM certificates_log WHERE status = "Released"'
    );

    res.json({
      users: users[0].total,
      residents: residents[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
    });
  })
);

// Admin stats endpoint (used by dashboard)
router.get(
  '/admin/stats',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const [users] = await db.execute('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [blotter] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [certificates] = await db.execute(
      'SELECT COUNT(*) as total FROM certificates_log WHERE status = "Released"'
    );
    const [seniors] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Senior = 1'
    );
    const [pwd] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_PWD = 1'
    );
    const [singleParents] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Solo_Parent = 1'
    );

    res.json({
      overall: {
        total_residents: residents[0].total,
        total_seniors: seniors[0].total,
        total_pwd: pwd[0].total,
        total_single_parents: singleParents[0].total,
      },
      users: users[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
    });
  })
);

// User Management Routes (IT Admin - All Users Management)
router.get('/admin/users', verifyToken, verifyRole([ROLES.ADMIN]), adminController.getAllUsers);
router.post('/admin/users', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.createUser);
router.put('/admin/users/:id', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.updateUser);
router.delete(
  '/admin/users/:id',
  verifyToken,
  requireAdminMfa,
  verifyRole([ROLES.ADMIN]),
  adminController.deleteUser
);
router.get('/admin/roles', verifyToken, verifyRole([ROLES.ADMIN]), adminController.getAllRoles);
router.post('/admin/roles', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.createRole);
router.put('/admin/roles/:id', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.updateRole);
router.delete(
  '/admin/roles/:id',
  verifyToken,
  requireAdminMfa,
  verifyRole([ROLES.ADMIN]),
  adminController.deleteRole
);

// Staff Management Routes
router.get('/admin/staff', verifyToken, verifyRole([ROLES.ADMIN]), adminController.getAllStaff);
router.post('/admin/staff', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.createStaff);
router.put('/admin/staff/:id', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), adminController.updateStaff);
router.delete(
  '/admin/staff/:id',
  verifyToken,
  requireAdminMfa,
  verifyRole([ROLES.ADMIN]),
  adminController.deleteStaff
);

// Verification Management Routes (Secretary & IT Admin)
router.get(
  '/admin/residents-verification',
  verifyToken,
  verifyRole([ROLES.SECRETARY, ROLES.ADMIN]),
  adminController.getResidentsForVerification
);
router.post(
  '/admin/verify-resident/:id',
  verifyToken,
  requireVerificationMfa,
  verifyRole([ROLES.SECRETARY, ROLES.ADMIN]),
  adminController.verifyResident
);

// Admin reports endpoints
router.get(
  '/admin/reports/users',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  adminController.getUsersReport
);
router.get(
  '/admin/reports/blotter',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  adminController.getBlotterReport
);
router.get(
  '/admin/reports/certificates',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  adminController.getCertificatesReport
);
router.get(
  '/admin/reports/residents',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  adminController.getResidentsReport
);
router.get(
  '/admin/reports/system',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  adminController.getSystemReport
);
router.get(
  '/admin/reports/security',
  verifyToken,
  requireAdminMfa,
  verifyRole([ROLES.ADMIN]),
  adminController.getSecurityReport
);
router.post(
  '/admin/residents/import',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CLERK]),
  upload.single('file'),
  residentController.importResidents
); // Admin + Clerk per requirements
router.get('/admin/ai-analytics', verifyToken, verifyRole([ROLES.ADMIN]), (req, res) =>
  aiController.getSecretaryRiskAnalytics(req, res)
);
router.get(
  '/admin/users',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const [users] = await db.execute(
      'SELECT id, username, full_name, email, role, is_active FROM users ORDER BY role, username'
    );
    res.json(users);
  })
);
router.post('/admin/users', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), (req, res) => {
  res.status(501).json({ message: 'User creation via API coming soon - use database directly' });
});
router.put('/admin/users/:id', verifyToken, requireAdminMfa, verifyRole([ROLES.ADMIN]), (req, res) => {
  res.status(501).json({ message: 'User update via API coming soon' });
});
router.get(
  '/admin/settings',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    res.json({
      message: 'System settings management',
      settings: {
        maintenance_mode: false,
        sms_enabled: true,
        email_enabled: true,
        backup_schedule: 'daily',
        session_timeout: 3600,
      },
    });
  })
);
router.get('/admin/reports/pdf/blotter', verifyToken, (req, res) =>
  reportController.generateBlotterPDF(req, res)
);
router.get('/admin/reports/pdf/residents', verifyToken, (req, res) =>
  reportController.generateResidentsPDF(req, res)
);

// =========================================================================
// ROLE 2: CLERK ROUTES (ClearPass Operator)
// =========================================================================
router.get(
  '/clerk/dashboard',
  verifyToken,
  verifyRole([ROLES.CLERK]),
  asyncHandler(async (req, res) => {
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [certificates] = await db.execute(
      'SELECT COUNT(*) as total FROM certificates_log WHERE certificate_type IN ("Barangay Clearance", "Good Moral")'
    );
    res.json({ residents: residents[0].total, certificates: certificates[0].total });
  })
);
router.get(
  '/clerk/clearances',
  verifyToken,
  verifyRole([ROLES.CLERK]),
  asyncHandler(async (req, res) => {
    const [certs] = await db.execute(`
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE c.certificate_type IN ('Barangay Clearance', 'Good Moral')
        ORDER BY c.created_at DESC LIMIT 50
    `);
    res.json(certs);
  })
);
router.post('/clerk/residents', verifyToken, verifyRole([ROLES.CLERK]), (req, res) => {
  res.status(501).json({ message: 'Use /api/residents endpoint instead' });
});
router.post('/clerk/clearances/issue', verifyToken, verifyRole([ROLES.CLERK]), (req, res) => {
  res.status(501).json({ message: 'Use /api/certificates endpoint instead' });
}); // The Logic Gate Endpoint
router.get('/clerk/documents', verifyToken, verifyRole([ROLES.CLERK]), (req, res) => {
  res.status(501).json({ message: 'Use /api/documents/requests endpoint instead' });
});

// =========================================================================
// ROLE 3: BLOTTER OFFICER ROUTES (Encoder)
// =========================================================================
router.get(
  '/officer/dashboard',
  verifyToken,
  verifyRole([ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    const [activeCases] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [resolvedCases] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status = "Amicably Settled"'
    );
    res.json({ active_cases: activeCases[0].total, resolved_cases: resolvedCases[0].total });
  })
);
router.post('/officer/cases', verifyToken, verifyRole([ROLES.BLOTTER_OFFICER]), (req, res) => {
  res.status(501).json({ message: 'Use /api/blotter endpoint instead' });
});
router.put(
  '/officer/cases/:caseNumber/resolve',
  verifyToken,
  verifyRole([ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    await db.execute('UPDATE blotter SET Status = ? WHERE Case_Number = ?', [
      'Amicably Settled',
      req.params.caseNumber,
    ]);
    res.json({ message: 'Case resolved successfully' });
  })
);
router.get(
  '/officer/ai-analytics',
  verifyToken,
  verifyRole([ROLES.BLOTTER_OFFICER]),
  (req, res) => {
    res.status(501).json({ message: 'AI analytics feature coming soon' });
  }
);
router.get('/officer/reports', verifyToken, verifyRole([ROLES.BLOTTER_OFFICER]), (req, res) => {
  res.status(501).json({ message: 'Reports feature coming soon' });
});

// =========================================================================
// ROLE 4: RESIDENT ROUTES (Self-Service)
// =========================================================================
router.get(
  '/resident/dashboard',
  verifyToken,
  verifyRole([ROLES.RESIDENT]),
  asyncHandler(async (req, res) => {
    const [certs] = await db.execute(
      'SELECT COUNT(*) as total FROM certificates_log WHERE resident_id = ?',
      [req.user.id]
    );
    res.json({ certificates: certs[0].total });
  })
);
router.post(
  '/resident/request-clearance',
  verifyToken,
  verifyRole([ROLES.RESIDENT]),
  (req, res) => {
    res.status(501).json({ message: 'Use /api/certificates endpoint instead' });
  }
);
router.get('/resident/requests', verifyToken, verifyRole([ROLES.RESIDENT]), (req, res) => {
  res.status(501).json({ message: 'Use /api/certificates endpoint instead' });
});
router.get('/resident/profile', verifyToken, verifyRole([ROLES.RESIDENT]), (req, res) => {
  res.status(501).json({ message: 'Use /api/auth/profile endpoint instead' });
});
router.post(
  '/resident/profile/update-photo',
  verifyToken,
  verifyRole([ROLES.RESIDENT]),
  upload.single('photo'),
  validateImageFiles,
  (req, res) => {
    res.status(501).json({ message: 'Photo upload feature coming soon' });
  }
);
router.post(
  '/resident/upload-verification',
  verifyToken,
  verifyRole([ROLES.RESIDENT]),
  verificationUpload.single('verification'),
  validateVerificationFiles,
  (req, res) => {
    res.status(501).json({ message: 'Verification upload feature coming soon' });
  }
);

// =========================================================================
// ROLE 5: CAPTAIN ROUTES (Read-Only Executive)
// =========================================================================
router.get(
  '/captain/dashboard',
  verifyToken,
  verifyRole([ROLES.CAPTAIN]),
  asyncHandler(async (req, res) => {
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [blotter] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    res.json({
      residents: residents[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
    });
  })
);
// Note: Additional captain routes commented out - functions not yet implemented
// router.get('/captain/residents', verifyToken, verifyRole([5]), captainController.getResidentsReadOnly);
// router.get('/captain/blotters', verifyToken, verifyRole([5]), captainController.getBlottersReadOnly);
// router.get('/captain/clearances', verifyToken, verifyRole([5]), captainController.getClearancesReadOnly);
// router.get('/captain/reports', verifyToken, verifyRole([5]), captainController.getAnalyticsReports);
// router.get('/captain/settings', verifyToken, verifyRole([5]), captainController.getSettingsReadOnly);

// =========================================================================
// ROLE 6: SECRETARY ROUTES (Overseer)
// =========================================================================
router.get(
  '/secretary/dashboard',
  verifyToken,
  verifyRole([ROLES.SECRETARY]),
  asyncHandler(async (req, res) => {
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [blotter] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    res.json({
      residents: residents[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
    });
  })
);
router.get(
  '/secretary/clearances',
  verifyToken,
  verifyRole([ROLES.SECRETARY]),
  asyncHandler(async (req, res) => {
    const [certs] = await db.execute(`
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        ORDER BY c.created_at DESC LIMIT 100
    `);
    res.json(certs);
  })
); // View Only
// router.put('/secretary/clearances/:id/approve',
//     verifyToken, verifyRole([6]), enforcePermissions('/api/secretary/clearances/:id/approve'), clerkController.approveClearance); // Override
// Note: Additional secretary routes commented out - functions not yet implemented
// router.get('/secretary/dashboard', verifyToken, verifyRole([6]), clerkController.getSecretaryDashboard);
// router.get('/secretary/residents', verifyToken, verifyRole([6]), clerkController.getResidentsManagement);
// router.get('/secretary/blotters', verifyToken, verifyRole([6]), clerkController.getBlottersMonitoring);
// router.get('/secretary/reports', verifyToken, verifyRole([6]), clerkController.getAnalyticsReports);
// router.get('/secretary/settings', verifyToken, verifyRole([6]), clerkController.getSettingsManagement);

// =========================================================================
// GENERIC DASHBOARD ENDPOINT (All Roles)
// =========================================================================
router.get(
  '/dashboard',
  verifyToken,
  asyncHandler(async (req, res) => {
    const userRole = req.user.role;

    // Get basic stats for all roles
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [blotter] = await db.execute(
      'SELECT COUNT(*) as total FROM blotter WHERE Status IN ("Pending", "Ongoing")'
    );
    const [certificates] = await db.execute('SELECT COUNT(*) as total FROM certificates_log');
    const [seniors] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Senior = 1'
    );
    const [pwd] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_PWD = 1'
    );
    const [singleParents] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Solo_Parent = 1'
    );

    const dashboardData = {
      overall: {
        total_residents: residents[0].total,
        total_seniors: seniors[0].total,
        total_pwd: pwd[0].total,
        total_single_parents: singleParents[0].total,
      },
      residents: residents[0].total,
      active_blotter: blotter[0].total,
      certificates: certificates[0].total,
      role: userRole,
    };

    // Add role-specific data
    if (userRole === ROLES.ADMIN) {
      const [users] = await db.execute(
        'SELECT COUNT(*) as total FROM users WHERE is_active = true'
      );
      dashboardData.users = users[0].total;
    }

    res.json(dashboardData);
  })
);

// =========================================================================
// AI CHATBOT ROUTES (Available to all authenticated users)
// =========================================================================

// AI patrol suggestions endpoint
router.get(
  '/ai/patrol-suggestions',
  verifyToken,
  asyncHandler((req, res) => aiController.getPatrolSuggestions(req, res))
);

router.post(
  '/ai/chatbot/log',
  verifyToken,
  asyncHandler(async (req, res) => {
    const {
      session_id,
      user_message,
      bot_response,
      intent_detected,
      confidence_score,
      user_id,
      resident_id,
    } = req.body;

    await db.execute(
      'INSERT INTO ai_chatbot_conversations (session_id, user_message, bot_response, intent_detected, confidence_score, user_id, resident_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [
        session_id,
        user_message,
        bot_response,
        intent_detected,
        confidence_score,
        user_id,
        resident_id,
      ]
    );

    res.json({ success: true, message: 'Conversation logged successfully' });
  })
);

// =========================================================================
// DOCUMENT VERIFICATION ROUTES
// =========================================================================

// QR Code verification for documents and IDs
router.post(
  '/documents/verify-qr',
  asyncHandler(async (req, res) => {
    const { qr_hash } = req.body;
    const [certs] = await db.execute(
      'SELECT * FROM certificates_log WHERE qr_validation_string = ?',
      [qr_hash]
    );
    if (certs.length === 0) return res.json({ status: 'INVALID', message: 'QR code not found' });
    res.json({ status: 'VALID', certificate: certs[0] });
  })
);

// =========================================================================
// SHARED/LEGACY ROUTES (Maintained for Frontend Compatibility)
// =========================================================================
router.post(
  '/ai/chatbot/message',
  verifyToken,
  validateChatbotMessage,
  asyncHandler(async (req, res) => {
    const { message, session_id, context } = req.body;

    // Simple chatbot responses based on keywords
    const lowerMessage = message.toLowerCase();

    let response = '';
    let intent = 'general_inquiry';
    let confidence = 0.8;

    // Certificate-related queries
    if (
      lowerMessage.includes('certificate') ||
      lowerMessage.includes('clearance') ||
      lowerMessage.includes('document')
    ) {
      intent = 'certificate_inquiry';
      response =
        'For certificate requests, you can:\n\n• Visit the Document Center to request certificates online\n• Required documents: Valid ID, Proof of Residency\n• Processing time: 1-3 business days\n• Fees vary by certificate type\n\nWould you like me to guide you to the request form?';
    }
    // Appointment queries
    else if (
      lowerMessage.includes('appointment') ||
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('meeting')
    ) {
      intent = 'appointment_request';
      response =
        'To schedule an appointment:\n\n• Barangay Office Hours: Mon-Fri, 8AM-5PM\n• Contact: (02) 123-4567 or visit the office\n• Online scheduling coming soon!\n\nWhat type of appointment do you need?';
    }
    // Blotter queries
    else if (
      lowerMessage.includes('blotter') ||
      lowerMessage.includes('complaint') ||
      lowerMessage.includes('report')
    ) {
      intent = 'blotter_inquiry';
      response =
        'For blotter reports:\n\n• File complaints at the Barangay Office\n• Required: Valid ID, Witness statements if applicable\n• Emergency: Call 911 or Barangay Hotline\n• Processing: 24-48 hours\n\nWhat type of incident would you like to report?';
    }
    // Residency queries
    else if (
      lowerMessage.includes('residency') ||
      lowerMessage.includes('resident') ||
      lowerMessage.includes('registration')
    ) {
      intent = 'residency_inquiry';
      response =
        'For residency matters:\n\n• New residents: Register at Barangay Office\n• Required: Valid ID, Proof of address\n• Processing time: 3-5 business days\n• Update your profile in Settings\n\nDo you need help with registration?';
    }
    // Greeting responses
    else if (
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi') ||
      lowerMessage.includes('good')
    ) {
      intent = 'greeting';
      response =
        "Hello! I'm BANTAY, your barangay assistant. How can I help you today?\n\nI can assist with:\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• General barangay information";
    }
    // Help requests
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      intent = 'help_request';
      response =
        'I can help you with:\n\n📋 Certificate Requests\n• Barangay Clearance, Indigency, Residency certificates\n• Requirements and processing times\n\n📅 Appointments\n• Schedule meetings with barangay officials\n• Office hours and contact information\n\n🚨 Blotter Reports\n• File complaints and incident reports\n• Emergency contact numbers\n\n🏠 Residency Services\n• Registration for new residents\n• Profile updates and verification\n\nWhat would you like to know more about?';
    }
    // Default response
    else {
      intent = 'general_inquiry';
      response =
        "I'm here to help with barangay services! I can assist you with:\n\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• Residency registration\n• General barangay information\n\nPlease let me know what you need help with!";
    }

    res.json({
      response: response,
      intent: intent,
      confidence: confidence,
      session_id: session_id,
      timestamp: new Date().toISOString(),
    });
  })
);

// =========================================================================
// SHARED/LEGACY ROUTES (Maintained for Frontend Compatibility)
// =========================================================================

// Residency verifications - Admin access only
router.get(
  '/auth/residency-verifications/pending',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  async (req, res) => {
    res.json([]); // Return empty array - simplified system
  }
);

// Programs - All authenticated users can view programs
router.get(
  '/programs',
  verifyToken,
  asyncHandler(async (req, res) => {
    try {
      const [programs] = await db.execute(
        'SELECT * FROM community_programs ORDER BY program_date DESC'
      );
      res.json(programs);
    } catch (error) {
      console.error('Error fetching programs:', error);
      // Return empty array if table doesn't exist
      res.json([]);
    }
  })
);

// Templates - All authenticated staff can view templates
router.get(
  '/templates',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CLERK, ROLES.CAPTAIN, ROLES.SECRETARY]),
  async (req, res) => {
    try {
      const [templates] = await db.execute(
        `
          SELECT
            id,
            template_name,
            document_type,
            certificate_type_id,
            template_content,
            is_active,
            created_at,
            updated_at
          FROM document_templates
          WHERE is_active = 1
          ORDER BY template_name
        `
      );
      res.json(templates);
    } catch (error) {
      res.json([]); // Return empty array if table doesn't exist
    }
  }
);

// Households - Read access for Clerk, Captain and above
router.get(
  '/households',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    const [households] = await db.execute('SELECT * FROM households ORDER BY Household_Number');
    res.json(households);
  })
);

// Sitios - Read access for all officer roles
router.get(
  '/sitios',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    const [sitios] = await db.execute('SELECT * FROM sitios ORDER BY name');
    res.json(sitios);
  })
);

// Certificate types - Clerk, Captain, and Secretary access (Captain for oversight)
router.get(
  '/certificate-types',
  verifyToken,
  verifyRole([ROLES.CAPTAIN, ROLES.ADMIN, ROLES.SECRETARY]),
  async (req, res) => {
    try {
      const [types] = await db.execute(
        'SELECT * FROM certificate_types WHERE is_active = true ORDER BY name'
      );
      res.json({ success: true, data: types });
    } catch (error) {
      res.json({ success: true, data: [] });
    }
  }
);

// Certificates - Read access for staff roles
router.get(
  '/certificates',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK]),
  asyncHandler(async (req, res) => {
    const [certificates] = await db.execute(
      'SELECT * FROM certificates_log ORDER BY created_at DESC'
    );
    res.json(certificates);
  })
);

// Blotter Cases - Read access for staff roles
router.get(
  '/blotter',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    const [blotterCases] = await db.execute(
      'SELECT * FROM blotter ORDER BY DateTime_Incident DESC'
    );
    res.json(blotterCases);
  })
);

// Blotter Cases - Create access for authorized staff (Admin, Clerk, Blotter Officer)
router.post(
  '/blotter',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.BLOTTER_OFFICER]),
  validateBlotter,
  asyncHandler(async (req, res) => {
    const {
      Complainant_Details,
      Respondent_Details,
      respondent_id,
      Incident_Type,
      Narrative,
      DateTime_Incident,
      Location_Sitio,
    } = req.body;
    const caseNumber = await allocateBlotterCaseNumber(db, { incidentDate: DateTime_Incident });
    await db.execute(
      `
        INSERT INTO blotter (Case_Number, Complainant_Details, Respondent_Details, respondent_id, Incident_Type, Narrative, DateTime_Incident, Location_Sitio, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `,
      [
        caseNumber,
        JSON.stringify(Complainant_Details),
        JSON.stringify(Respondent_Details),
        respondent_id,
        Incident_Type,
        Narrative,
        DateTime_Incident,
        Location_Sitio,
      ]
    );
    res.status(201).json({ Case_Number: caseNumber });
  })
);

// Blotter Cases - Delete access for authorized blotter officers only
router.delete(
  '/blotter/:id',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.BLOTTER_OFFICER]),
  asyncHandler(async (req, res) => {
    await db.execute('DELETE FROM blotter WHERE Case_Number = ?', [req.params.id]);
    res.json({ message: 'Blotter deleted' });
  })
);

// Census data - Read access for authorized staff (Captain, Secretary, Clerk, Admin)
router.get(
  '/census',
  verifyToken,
  verifyRole([ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const [stats] = await db.execute(`
        SELECT s.name as sitio_name, COUNT(r.Resident_ID) as total_residents
        FROM sitios s
        LEFT JOIN households h ON s.id = h.Sitio_ID
        LEFT JOIN residents r ON h.Household_ID = r.Household_ID
        GROUP BY s.id, s.name
    `);

    // Also get overall stats for dashboard
    const [residents] = await db.execute(
      'SELECT COUNT(*) as total FROM residents WHERE Residency_Status = "Active"'
    );
    const [seniors] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Senior = 1'
    );
    const [pwd] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_PWD = 1'
    );
    const [singleParents] = await db.execute(
      'SELECT COUNT(*) as total FROM vulnerabilities WHERE Is_Solo_Parent = 1'
    );

    res.json({
      sitio_stats: stats,
      overall: {
        total_residents: residents[0].total,
        total_seniors: seniors[0].total,
        total_pwd: pwd[0].total,
        total_single_parents: singleParents[0].total,
      },
    });
  })
);

// Users - Read access for admin roles
router.get(
  '/users',
  verifyToken,
  verifyRole([ROLES.ADMIN]),
  asyncHandler(async (req, res) => {
    const [users] = await db.execute(
      'SELECT id, username, full_name, email, role, is_active, created_at FROM users ORDER BY role, username'
    );
    res.json(users);
  })
);

// Residents - Read access for staff roles (Admin, Clerk, Captain, Secretary)
router.get(
  '/residents',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK]),
  asyncHandler(async (req, res) => {
    const { search, sitio_id, residency_status, show_vulnerable, dateFrom, dateTo, gender } =
      req.query;

    // Build WHERE conditions
    let whereConditions = [];
    let values = [];

    if (search) {
      whereConditions.push(
        '(r.First_Name LIKE ? OR r.Last_Name LIKE ? OR r.Middle_Name LIKE ? OR h.Household_Number LIKE ? OR s.name LIKE ? OR r.Occupation LIKE ?)'
      );
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
      whereConditions.push(
        '(r.Is_4Ps = true OR r.Is_PWD = true OR r.Is_Senior = true OR r.Is_Solo_Parent = true OR r.Is_Out_of_School_Youth = true)'
      );
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

    const [residents] = await db.execute(
      `
        SELECT r.*, h.Household_Number, s.name as sitio_name
        FROM residents r
        LEFT JOIN households h ON r.Household_ID = h.Household_ID
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        ${whereClause}
        ORDER BY r.Last_Name
    `,
      values
    );

    res.json(residents);
  })
);

// Residents CRUD operations
router.post(
  '/residents',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN]),
  validateResident,
  asyncHandler(async (req, res) => {
    const residentData = req.body;

    // Generate unique Resident ID (6-digit format like RES-123456)
    const residentIdNumber = Math.floor(100000 + Math.random() * 900000);
    const residentId = `RES-${residentIdNumber}`;

    // Generate temporary 6-digit password
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // Create resident record in database
    await db.execute(
      `
        INSERT INTO residents (
            Resident_ID, Household_ID, Relation_to_Head, First_Name, Middle_Name, Last_Name, Suffix,
            Birthdate, Gender, Civil_Status, Occupation, Income_Estimate, Mobile_Number,
            Voter_Status, Date_Arrival, Residency_Status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
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
        'Active',
      ]
    );

    // Prepare vulnerabilities data for separate table
    const is4Ps = residentData.is_4ps === 'true' || residentData.is_4ps === true;
    const isPwd = residentData.is_pwd === 'true' || residentData.is_pwd === true;
    const isSoloParent =
      residentData.is_solo_parent === 'true' || residentData.is_solo_parent === true;
    const isOutOfSchoolYouth =
      residentData.is_out_of_school_youth === 'true' ||
      residentData.is_out_of_school_youth === true;

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
    await db.execute(
      `
        INSERT INTO vulnerabilities (
            Resident_ID, Is_4Ps, Is_PWD, Is_Senior, Is_Solo_Parent, Is_Out_of_School_Youth,
            Disability_Type, Vulnerability_Score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        residentId,
        is4Ps,
        isPwd,
        isSenior,
        isSoloParent,
        isOutOfSchoolYouth,
        residentData.disability_type || '',
        vulnerabilityScore,
      ]
    );

    // Auto-create user account for resident
    let userAccount = null;
    try {
      // Hash the temporary password
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

      // Create user account in users table
      await db.execute(
        `
            INSERT INTO users (
                username, password_hash, role, email, full_name, contact_number, is_active, created_at, updated_at
            ) VALUES (?, ?, 'resident', ?, ?, ?, true, NOW(), NOW())
        `,
        [
          residentData.email, // Use email as username
          hashedPassword,
          residentData.email,
          `${residentData.first_name} ${residentData.last_name}`,
          residentData.mobile_number || '',
        ]
      );

      userAccount = {
        username: residentData.email,
        email: residentData.email,
        full_name: `${residentData.first_name} ${residentData.last_name}`,
        role: 'resident',
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
      login_instructions: userAccount
        ? `Resident can login with email: ${userAccount.email} and password: ${tempPassword}`
        : `Resident ID: ${residentId} - User account creation failed, manual setup required`,
    };

    res.status(201).json(response);
  })
);

router.put(
  '/residents/:id',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN]),
  asyncHandler(async (req, res) => {
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
  })
);

router.put(
  '/residents/:id/archive',
  verifyToken,
  verifyRole([ROLES.ADMIN, ROLES.CAPTAIN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { departure_reason, departure_date } = req.body;

    await db.execute(
      `
        UPDATE residents
        SET Residency_Status = 'Transferred Out', departure_reason = ?, departure_date = ?, updated_at = NOW()
        WHERE Resident_ID = ?
    `,
      [departure_reason, departure_date, id]
    );

    res.json({ message: 'Resident archived successfully' });
  })
);

module.exports = router;
