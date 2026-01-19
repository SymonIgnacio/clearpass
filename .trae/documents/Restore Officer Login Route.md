# Overlooked Bug: Missing Officer Login Route

I have confirmed why your Admin/Staff login stopped working.

## 1. The Issue: 404 Not Found for Officer Login
- **Symptoms**: You are seeing `POST http://localhost:3002/api/auth/officer-login 404 (Not Found)` in your console.
- **The Cause**:
    - Your frontend `OfficerLogin.jsx` tries to POST to `/api/auth/officer-login`.
    - Your backend controller `authController.js` has logic to handle this specific path (checking roles).
    - **BUT**, the actual route definition is **MISSING** from `server/index.js` or any active route file. It was likely lost during a refactor or cleanup (it exists in `routes.js.bak` but not in the live code).
- **Why it worked before**: You likely had a cached session or were using a different endpoint (like the generic `/login`), or the file was modified recently.

## 2. The Fix: Restore the Route
- I need to add the route definition back into `server/index.js` so the server knows how to handle requests to `/api/auth/officer-login`.

## 3. Database Confusion Clarification
You mentioned confusion about multiple tables:
- `resident_applications`: **This is the correct table** for new signups/guests.
- `application_documents`: **This is the correct table** for documents uploaded by guests (linked to `resident_applications`).
- `resident_documents`: This is for documents uploaded by *verified residents* (linked to `residents`).
- `resident_signup_request`: **This table is DEPRECATED/UNUSED**. It was from an older version of the system.
- `resident_verification_request`: **This table is also likely unused or redundant** if `resident_applications` is doing the job.

**My Plan:**
1.  **Fix the Login**: Add the missing `/officer-login` route to `server/index.js`.
2.  **Verify Tables**: I will double check the database to confirm which tables are actually being used, but the code I've seen so far strictly uses `resident_applications` and `application_documents` for the guest flow we just fixed.

This will resolve your 404 error immediately.
