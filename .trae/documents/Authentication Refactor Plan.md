# Authentication Refactor Plan (Confirmed SMTP Usage)

**Yes, we will absolutely reuse the existing SMTP configuration (`server/utils/emailService.js` and `.env`) for the email verification feature.** The infrastructure is already there; we just need to repoint the logic.

## 1. Remove MFA for Residents (Revert)
*   **Backend**: In `residentAuthRoutes.js`, remove the mandatory MFA check for Role 12 (Residents).
*   **Frontend**: In `ProtectedRoute.jsx` and `ResidentLogin.jsx`, remove the MFA redirects for residents.

## 2. Implement Email Verification for Guests (Using SMTP)
We will use the same OTP mechanism but for a different purpose: **Identity Verification** instead of **Login Security**.

### Backend Logic (`server/routes/residentAuthRoutes.js`)
1.  **Reuse `mfaOtp.js`**: We will use `createOtpChallenge` and `sendOtpEmail` functions.
2.  **Modify Registration**:
    *   After a guest registers, immediately call `createOtpChallenge`.
    *   Send the email using the **existing SMTP credentials**.
    *   Subject: "Verify your email for ClearPass".
3.  **New Endpoint**: `POST /verify-email`
    *   Accepts `{ otp }`.
    *   Calls `verifyOtpChallenge`.
    *   If valid: Updates `users` table -> `email_verified = 1`.

### Frontend Logic
1.  **Modify `ResidentLogin.jsx`**:
    *   If user logs in and is a **Guest (Role 13)** AND `email_verified == 0`:
    *   Redirect to a **new page**: `/guest/verify-email`.
2.  **New Page: `VerifyEmail.jsx`**:
    *   Simple UI: "Enter the 6-digit code sent to your email".
    *   Calls the new `/verify-email` endpoint.
    *   On success: Redirects to dashboard.

## 3. Execution Order
1.  **Strip MFA** from Resident flow.
2.  **Build Verification API** (Backend).
3.  **Build Verification Page** (Frontend).
4.  **Test** with a new guest registration.
