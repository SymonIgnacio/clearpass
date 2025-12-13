import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'clearpass-ed442'
  });
}

const auth = admin.auth();

// Default accounts with hierarchy
const defaultAccounts = [
  {
    email: 'superadmin@barangay.local',
    password: 'superadmin123',
    displayName: 'Super Admin',
    role: 'Super Admin',
    hierarchy: 1
  },
  {
    email: 'captain@barangay.local',
    password: 'captain',
    displayName: 'Barangay Captain',
    role: 'captain',
    hierarchy: 2
  },
  {
    email: 'secretary@barangay.local',
    password: 'secretary',
    displayName: 'Barangay Secretary',
    role: 'secretary',
    hierarchy: 3
  },
  {
    email: 'clerk@barangay.local',
    password: 'clerk123',
    displayName: 'Barangay Clerk',
    role: 'clerk',
    hierarchy: 4
  }
];

async function createDefaultAccounts() {
  console.log('🚀 Setting up default Firebase accounts...\n');

  for (const account of defaultAccounts) {
    try {
      // Check if user already exists
      let user;
      try {
        user = await auth.getUserByEmail(account.email);
        console.log(`✅ ${account.displayName} (${account.role}) already exists`);
        continue;
      } catch (error) {
        if (error.code !== 'auth/user-not-found') {
          throw error;
        }
      }

      // Create user account
      const userRecord = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true, // Skip email verification for default accounts
        disabled: false
      });

      // Set custom claims for role and hierarchy
      await auth.setCustomUserClaims(userRecord.uid, {
        role: account.role,
        hierarchy: account.hierarchy,
        isDefaultAccount: true
      });

      console.log(`✅ Created ${account.displayName} (${account.role})`);
      console.log(`   Email: ${account.email}`);
      console.log(`   UID: ${userRecord.uid}\n`);

    } catch (error) {
      console.error(`❌ Failed to create ${account.displayName}:`, error.message);
    }
  }

  console.log('🎉 Default Firebase accounts setup complete!');
  console.log('\n📋 Default Account Credentials:');
  console.log('================================');
  defaultAccounts.forEach(account => {
    console.log(`${account.displayName}:`);
    console.log(`  Email: ${account.email}`);
    console.log(`  Password: ${account.password}`);
    console.log(`  Role: ${account.role}`);
    console.log('');
  });

  console.log('⚠️  WARNING: These are default development accounts.');
  console.log('   Change passwords in production!');
  console.log('   Use real email addresses for actual users.');
}

async function listExistingAccounts() {
  console.log('📋 Existing Firebase accounts:\n');

  try {
    const listUsersResult = await auth.listUsers(100);
    const accounts = listUsersResult.users;

    if (accounts.length === 0) {
      console.log('No accounts found.');
      return;
    }

    accounts.forEach(user => {
      const claims = user.customClaims || {};
      console.log(`- ${user.displayName || 'No Name'} (${user.email})`);
      console.log(`  Role: ${claims.role || 'No Role'}`);
      console.log(`  Hierarchy: ${claims.hierarchy || 'No Hierarchy'}`);
      console.log(`  UID: ${user.uid}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error listing accounts:', error.message);
  }
}

async function deleteDefaultAccounts() {
  console.log('🗑️  Deleting default Firebase accounts...\n');

  for (const account of defaultAccounts) {
    try {
      const user = await auth.getUserByEmail(account.email);
      await auth.deleteUser(user.uid);
      console.log(`✅ Deleted ${account.displayName} (${account.email})`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️  ${account.displayName} (${account.email}) not found`);
      } else {
        console.error(`❌ Failed to delete ${account.displayName}:`, error.message);
      }
    }
  }

  console.log('\n🗑️  Default accounts cleanup complete!');
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'create':
    createDefaultAccounts().then(() => process.exit(0));
    break;
  case 'list':
    listExistingAccounts().then(() => process.exit(0));
    break;
  case 'delete':
    deleteDefaultAccounts().then(() => process.exit(0));
    break;
  default:
    console.log('Firebase Account Management Script');
    console.log('====================================');
    console.log('');
    console.log('Usage:');
    console.log('  node setup_firebase_accounts.js create  - Create default accounts');
    console.log('  node setup_firebase_accounts.js list    - List existing accounts');
    console.log('  node setup_firebase_accounts.js delete  - Delete default accounts');
    console.log('');
    console.log('Environment Variables:');
    console.log('  FIREBASE_SERVICE_ACCOUNT_KEY - Service account JSON (as string)');
    console.log('  FIREBASE_PROJECT_ID - Firebase project ID');
    console.log('');
    console.log('Or place firebase-service-account.json in the root directory');
    process.exit(1);
}
