const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (!admin.apps.length) {
    // Load service account from JSON file
    let serviceAccount;
    const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

    try {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.error('❌ Failed to load Firebase service account:', error.message);
      console.error('   Make sure firebase-service-account.json exists in the project root');
      process.exit(1);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "clearpass-ed442"
    });

    console.log('✅ Firebase Admin SDK initialized');
  }
};

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authorization header with Firebase ID token required'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return res.status(401).json({
        error: 'Firebase ID token is required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Attach Firebase user to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified,
      phone_number: decodedToken.phone_number,
      name: decodedToken.name
    };

    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);

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
        error: 'Invalid Firebase ID token'
      });
    }
  }
};

// Initialize Firebase Admin on module load
initializeFirebaseAdmin();

module.exports = {
  verifyFirebaseToken
};
