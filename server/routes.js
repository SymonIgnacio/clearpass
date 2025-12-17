const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('./authMiddleware');
const { enforcePermissions, BUSINESS_RULES } = require('./permissions');

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
    verifyToken, checkRole([1]), enforcePermissions('/api/users'), BUSINESS_RULES.restrictUserCreation, adminController.createUser);
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
router.post('/resident/request-clearance',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/request-clearance'), residentController.requestClearance);
router.get('/resident/requests',
    verifyToken, checkRole([4]), enforcePermissions('/api/resident/requests'), residentController.getMyRequests);
router.get('/resident/profile',
    verifyToken, checkRole([4]), enforcePermissions('/api/auth/profile'), residentController.getProfile);

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

// Households - Read access for Captain and above
router.get('/households',
    verifyToken, checkRole([1, 5, 6]), enforcePermissions('/api/households'), async (req, res) => {
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

module.exports = router;
