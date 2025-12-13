# Firebase Account Setup Guide

This guide will help you set up the default Firebase Authentication accounts for your Barangay Management System.

## Prerequisites

1. **Firebase Project**: You need an active Firebase project
2. **Service Account Key**: Download the service account key from Firebase Console
3. **Node.js**: Ensure Node.js is installed

## Step 1: Set Up Firebase Service Account

### Option A: Using Service Account JSON File

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Save the downloaded JSON file as `firebase-service-account.json` in the root directory

### Option B: Using Environment Variables

Set the following environment variable with the service account JSON content:
```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{ "type": "service_account", ... }'
```

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=your-service-account-json-string
```

## Step 3: Install Dependencies

Install the Firebase Admin SDK:
```bash
npm install
cd server
npm install
```

## Step 4: Create Default Accounts

Run the account creation script:
```bash
npm run firebase:create-accounts
```

This will create the following default accounts:

| Role | Email | Password | Hierarchy Level |
|------|-------|----------|----------------|
| Super Admin | `superadmin@barangay.local` | `superadmin123` | 1 (Highest) |
| Barangay Captain | `captain@barangay.local` | `captain` | 2 |
| Barangay Secretary | `secretary@barangay.local` | `secretary` | 3 |
| Barangay Clerk | `clerk@barangay.local` | `clerk` | 4 (Lowest) |

## Step 5: Verify Accounts

Check that accounts were created successfully:
```bash
npm run firebase:list-accounts
```

## Account Hierarchy System

The accounts follow a strict hierarchy system where higher-level accounts can manage lower-level accounts:

- **Super Admin (Level 1)**: Can manage all accounts and access everything
- **Captain (Level 2)**: Can manage Secretary and Clerk accounts
- **Secretary (Level 3)**: Can manage Clerk accounts
- **Clerk (Level 4)**: Basic access, no account management

## Security Features

✅ **Email Verified**: All default accounts are pre-verified (no email verification required)  
✅ **Custom Claims**: Role and hierarchy information stored in Firebase custom claims  
✅ **Secure Passwords**: Strong passwords for default accounts  
✅ **Account Flags**: Marked as default accounts for easy identification  

## Production Considerations

### For Production Deployment:

1. **Change Default Passwords**: Update passwords for all default accounts
2. **Use Real Emails**: Replace dummy emails with real organizational emails
3. **Enable Email Verification**: Set `emailVerified: false` for new accounts
4. **Restrict Service Account**: Limit service account permissions to only necessary operations

### Environment Variables for Production:

```bash
# Production Firebase Configuration
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_SERVICE_ACCOUNT_KEY=your-production-service-account
CLIENT_URL=https://your-production-domain.com
```

## Troubleshooting

### Common Issues:

**"Firebase project not found"**
- Check that `FIREBASE_PROJECT_ID` matches your Firebase project ID
- Verify the service account key is for the correct project

**"Permission denied"**
- Ensure the service account has Admin SDK privileges
- Check that the service account JSON is valid

**"Account already exists"**
- The script will skip existing accounts
- Use `npm run firebase:list-accounts` to see current accounts
- Use `npm run firebase:delete-accounts` to remove existing default accounts

### Manual Account Management:

```bash
# List all Firebase accounts
npm run firebase:list-accounts

# Delete default accounts (for cleanup)
npm run firebase:delete-accounts

# Recreate accounts (after deletion)
npm run firebase:create-accounts
```

## Firebase Console Verification

After running the setup script, you can verify the accounts in Firebase Console:

1. Go to **Authentication** → **Users**
2. You should see the 4 default accounts
3. Click on each account to verify custom claims (role, hierarchy, isDefaultAccount)

## Next Steps

After setting up Firebase accounts:

1. **Configure Database**: Set up your MySQL database
2. **Environment Variables**: Configure all required environment variables
3. **Start Services**: Run `npm run dev:all` to start the application
4. **Test Login**: Use the default account credentials to log in

## Security Reminder

⚠️ **Important**: These default accounts are for development/testing only. In production:

- Change all default passwords immediately
- Use real email addresses
- Enable proper email verification
- Regularly rotate service account keys
- Monitor account access and usage
