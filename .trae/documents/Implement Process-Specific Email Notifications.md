I will implement the specific email notification logic for Blotter Summons and Certificate Approvals as requested.

### 1. Update Email Service
**File:** `server/utils/emailService.js`
- **Action:** Add two new specialized functions:
    - `sendBlotterStatusEmail`:
        - **Approved:** Includes the "7 days later" hearing schedule and "Barangay Hall" location.
        - **Rejected:** Includes the rejection reason.
    - `sendCertificateStatusEmail`:
        - **Approved:** Includes the "Next Day" pickup schedule.
        - **Rejected:** Includes the remarks.
- **Reason:** To centralize the email formatting logic and ensure consistent messaging.

### 2. Update Blotter Controller
**File:** `server/controllers/blotterRequestController.js`
- **Action:**
    - Import `sendBlotterStatusEmail`.
    - In `setStatus` method:
        - Update the query to fetch the resident's **Email** and **Name** (currently it only fetches IDs).
        - Calculate the hearing date (7 days from now).
        - Call `sendBlotterStatusEmail` when approving or rejecting.

### 3. Update Certificate Controller
**File:** `server/controllers/certificateRequestController.js`
- **Action:**
    - Import `sendCertificateStatusEmail`.
    - In `updateRequestStatus` method:
        - Calculate the pickup date (1 day from now).
        - Replace the generic `sendRequestStatusEmail` call with the new `sendCertificateStatusEmail`, passing the calculated pickup date.

### 4. Verification
- **Test:** I will verify the code changes by reviewing the logic to ensure dates are calculated correctly and the correct email templates are triggered. (Since I cannot receive real emails, code verification is the primary method).
