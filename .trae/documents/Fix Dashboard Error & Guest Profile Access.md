I will resolve the dashboard loading error and enable profile access for guest users.

### **1. Fix Dashboard Error (`client/src/pages/ResidentDocuments.jsx`)**
- **Issue:** The code `throw new Error(...)` crashes because the variable `Error` is shadowed by the imported MUI component `import { Error } from '@mui/icons-material'`.
- **Fix:** Rename the import to `ErrorIcon` and update its usage in the JSX.
  - `import { ..., Error as ErrorIcon, ... } from '@mui/icons-material';`
  - Replace `<Error />` with `<ErrorIcon />`.

### **2. Enable Guest Profile Access**

#### **A. Update Middleware (`server/middleware/authMiddleware.js`)**
- **Issue:** The `ROLE_MAP` lacks the 'guest' role (13), and `verifyToken` logic doesn't fully account for guests who lack a `resident_id`.
- **Fix:**
  - Add `'guest': 13` to `ROLE_MAP`.
  - Ensure `req.user.role` correctly handles role 13.

#### **B. Update Routes (`server/routes/residentProfileRoutes.js`)**
- **Issue:** Routes are restricted to `ROLES.RESIDENT` only.
- **Fix:** Update `checkRole` to allow `[ROLES.RESIDENT, ROLES.GUEST]` (or role 13) for profile endpoints.

#### **C. Update Controller (`server/controllers/residentProfileController.js`)**
- **Issue:** `getProfile` assumes `req.user.resident_id` exists and queries the `residents` table. Guests (applicants) don't have a `resident_id` or a record in `residents` yet.
- **Fix:**
  - In `getProfile`, check if `req.user.resident_id` is present.
  - If missing (Guest), query `resident_applications` using `req.user.email` to return the applicant's profile data.
  - Map `resident_applications` columns to match the expected frontend format (e.g., `First_Name`, `Street_Address`).

**Verification Plan:**
1.  **Frontend Test:** Log in as a Guest and verify `ResidentDocuments` loads without the "Error is not a constructor" crash.
2.  **Backend Test:** Access "My Profile" as a Guest and verify it returns the applicant's details instead of a 401/403 error.
