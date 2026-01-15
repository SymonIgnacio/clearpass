# Database Restoration and Repopulation Process

## Overview
This document outlines the process for restoring and repopulating the ClearPass database to ensure system integrity and availability of test data.

## Restoration Script
A dedicated script `server/scripts/restore_and_repopulate.js` has been created to automate this process.

### Features
1.  **Backup**: Automatically creates a SQL dump of the current database state in `database/backups/`.
2.  **Core Data Verification**: Checks and restores missing reference data:
    *   Sitios (Batia Proper, Northville 5, etc.)
    *   Certificate Types (Clearance, Indigency, etc.)
    *   Roles & Permissions
3.  **Admin User Recovery**: Ensures a default `IT Admin` user exists if no admins are found.
4.  **Test Data Generation**:
    *   Generates realistic Resident profiles with Filipino names.
    *   Creates Households with proper family structures (Head, Spouse, Children).
    *   Ensures valid relationships and Foreign Key integrity.
5.  **Validation**: Performs post-execution checks on table counts and integrity.

## Usage
To run the restoration process:

```bash
cd server
node scripts/restore_and_repopulate.js
```

## Audit Trail
### Execution Log (2026-01-14)
- **Backup Created**: `database/backups/backup_2026-01-13T23-10-31-830Z.sql`
- **Core Data**: Verified presence of Sitios and Certificate Types.
- **User Management**: Verified Admin user existence (using `IT Admin` role).
- **Test Data**:
    - Added ~20 new Households.
    - Added ~60-70 new Residents.
- **Validation Results**:
    - Sitios: PASS
    - Certificate Types: PASS
    - Admin Users: PASS
    - Residents: PASS (>10 records)
    - Households: PASS (>5 records)

## Data Structure Notes
- **Roles**: The system uses a `roles` table (not ENUM). Key roles: `IT Admin` (1), `Captain` (2), `Secretary` (3), `Clerk` (4), `Blotter Officer` (6), `Resident` (12).
- **Residents**: Linked to `households` via `Household_ID`. `Resident_ID` is the primary key.
- **Security**: Passwords are hashed using `bcrypt`. Default admin password is `admin123`.

## Future Maintenance
- Run this script whenever the database is reset or when fresh test data is required.
- The script uses `INSERT IGNORE` or checks existence to prevent duplicate data, so it is safe to run multiple times.
