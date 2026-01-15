# Template Management Access & Credentials Documentation

I will implement strict role-based access for template management and document the current user credentials.

## 1. Restrict Template Management (Backend)
I will modify `server/routes/templateRoutes.js` to ensure only the **IT Admin** can modify templates, while other staff can view them.
- **GET Routes**: Allow `['admin', 'captain', 'secretary', 'clerk']` (Read-only access for staff).
- **POST/PUT/DELETE Routes**: Allow `['admin']` ONLY (Strict IT Admin control).

## 2. Document User Credentials
I will create `USER_CREDENTIALS.md` in the project root with the following verified users from the database:
| Role | Username | Password (Default) | Full Name | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **IT Admin** | `superadmin` | `superadmin` | System Administrator | Full System Access |
| **IT Admin** | `testadmin...` | *Generated* | Test Admin | Automated Test User |
| **Captain** | `captain` | `captain` | Barangay Captain | Executive Approval |
| **Secretary** | `secretary` | `secretary` | Barangay Secretary | Document Signatory |
| **Clerk** | `clerk` | `clerk` | Administrative Clerk | Document Processor |
| **Officer** | `officer` | `officer` | Chief Tanod | Security/Blotter |
| **Resident** | `resident` | `123456` | Juan Dela Cruz | Test Resident |
| **Resident** | `Symonignacio1...` | `123456` | Symon Ignacio | Real User Test |

## 3. Confirm Resident Request Capability
You asked if residents can create requests. **YES**, they can.
- I verified `server/routes/documentRoutes.js` and `server/routes/certificateRequestRoutes.js`.
- Both have endpoints protected by `checkRole([ROLES.RESIDENT])`.
- Specifically, `POST /api/documents/requests` allows residents to submit new requests.
- No changes are needed here; the functionality already exists.

## 4. Verification
- I will manually verify the `templateRoutes.js` changes to ensure the roles are set correctly.
- The `USER_CREDENTIALS.md` file will serve as the reference for your testing.
