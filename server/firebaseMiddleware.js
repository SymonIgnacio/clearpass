const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    let serviceAccount;

    // First, try to get service account from environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
        console.log('✅ Firebase service account loaded from environment variable');
      } catch (envError) {
        console.warn('⚠️  Firebase service account environment variable is invalid JSON:', envError.message);
      }
    }

    // If not in environment variable, try to load from file
    if (!serviceAccount) {
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        console.log('✅ Firebase service account loaded from file');
      } catch (fileError) {
        console.warn('⚠️  Firebase service account file not found or invalid:', fileError.message);
        console.warn('   To use Firebase, set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or add firebase-service-account.json file');
        console.warn('   Using MySQL authentication only. Some Firebase features will be unavailable.');
        return; // Continue without Firebase
      }
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "clearpass-ed442"
      });
      console.log('✅ Firebase Admin SDK initialized');
    } catch (firebaseError) {
      console.warn('⚠️  Failed to initialize Firebase Admin SDK:', firebaseError.message);
      console.warn('   Using MySQL authentication only. Some Firebase features will be unavailable.');
      return; // Continue without Firebase
    }
  }
};

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  console.log('🔐 [Firebase Middleware] Verifying Firebase token...');
  console.log('🔐 [Firebase Middleware] Authorization header present:', !!req.headers.authorization);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [Firebase Middleware] No authorization header or not Bearer token');
      return res.status(401).json({
        error: 'Authorization header with Firebase ID token required'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      console.log('❌ [Firebase Middleware] No ID token in header');
      return res.status(401).json({
        error: 'Firebase ID token is required'
      });
    }

    console.log('🔐 [Firebase Middleware] Found ID token, verifying...');
    console.log('🔐 [Firebase Middleware] Token starts with:', idToken.substring(0, 20) + '...');

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log('✅ [Firebase Middleware] Token verified successfully');
    console.log('✅ [Firebase Middleware] Firebase UID:', decodedToken.uid);
    console.log('✅ [Firebase Middleware] Email verified:', decodedToken.email_verified);

    // Attach Firebase user to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      phone_number: decodedToken.phone_number,
      name: decodedToken.name
    };

    console.log('✅ [Firebase Middleware] Firebase user attached to request');
    next();
  } catch (error) {
    console.error('❌ [Firebase Middleware] Token verification error:', error);
    console.error('❌ [Firebase Middleware] Error code:', error.code);
    console.error('❌ [Firebase Middleware] Error message:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Firebase ID token has expired'
      });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Firebase ID token has been revoked'
      });
    } else {
      return res.status(401).json({
        error: 'Invalid Firebase ID token',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

module.exports = {
  verifyFirebaseToken
};
