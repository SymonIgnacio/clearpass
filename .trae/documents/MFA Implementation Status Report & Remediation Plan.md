# MFA Implementation Plan (With Live Email)

Thank you! Since you've provided the credentials, we can skip "Dev Mode" and implement **Live Email MFA** directly.

## 1. Configure Email Service (Live Credentials)
*   **File**: `.env` (Create or Update)
*   **Action**: Add the following configuration:
    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=themisbioprofiling@gmail.com
    SMTP_PASS=sltl bxdo qgck ksyv
    ```

## 2. Secure Backend (Close the Bypass)
*   **File**: `server/routes/residentAuthRoutes.js`
*   **Action**: Update the `login` route to:
    1.  Check `isMfaEnforced()`.
    2.  Generate OTP using `createOtpChallenge`.
    3.  Send **Real Email** using `sendOtpEmail`.
    4.  Return `{ mfa_required: true }` and a temporary token.

## 3. Update Frontend Enforcement
*   **File**: `client/src/pages/ResidentLogin.jsx`
*   **Action**: Handle the `mfa_required` response -> Redirect to `/mfa-otp`.
*   **File**: `client/src/components/ProtectedRoute.jsx`
*   **Action**: Add `ROLES.RESIDENT` to the redirection logic (ensure unverified residents can't access the dashboard).

## 4. Verify & Test
*   **Action**: I will perform a login attempt.
*   **Expected Result**: The system should send a real email to the resident's registered address.

**Ready to implement live MFA?**
