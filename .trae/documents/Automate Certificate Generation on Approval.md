I will implement the automated certificate generation workflow and ensure residents can track their request status via notifications.

**Analysis:**
The user has two main requirements:
1.  **Automated Certificate Generation:** When a certificate request is approved, the system must automatically generate a downloadable document (using the active `.docx` template) and save it for the admin to download.
2.  **Resident Notifications:** Residents need to be notified of status updates (already partially implemented) and have a visible notification bell in their dashboard to track these updates.

**Plan:**

**Part 1: Automated Certificate Generation (Backend)**

1.  **Enhance `CertificateRequestController.js`:**
    *   **Dependencies:** Import `docxtemplater`, `pizzip`, and `fs` (or use buffer directly).
    *   **Logic in `updateRequestStatus`:**
        *   When `status === 'approved'`:
            *   Fetch the latest active template from `document_templates` where `document_type` matches the request.
            *   Fetch the resident's data.
            *   Use `docxtemplater` to render the `.docx` template, replacing placeholders (e.g., `{resident_name}`, `{purpose}`, `{date}`) with actual data.
            *   Generate the `.docx` buffer.
            *   Update the `document_requests` table to store this generated file in a new `generated_file` column (LONGBLOB).
    *   **New Endpoint:** Add `GET /api/certificate-requests/:request_id/download-generated` to allow admins to download the generated file.

2.  **Database Schema Update:**
    *   Create a migration to add `generated_file` (LONGBLOB) and `generated_filename` (VARCHAR) columns to the `document_requests` table.

**Part 2: Resident Notifications (Frontend & Backend)**

1.  **Verify Notification Logic:**
    *   The `updateRequestStatus` method already calls `global.createNotification` [certificateRequestController.js:280](file:///c:/xampp/htdocs/clearpass/server/controllers/certificateRequestController.js#L280), which creates a system notification.
    *   The `NotificationBell` component is already present in the `Header` [Header.jsx:46](file:///c:/xampp/htdocs/clearpass/client/src/components/Header.jsx#L46), which is used by the resident layout (`AppShell`).
    *   **Action:** I will verify that the resident actually sees these notifications. The current logic sends to `null` (system notification) or specific users?
    *   *Correction:* The current code `global.createNotification(null, ...)` might be creating a "system-wide" notification or failing to target the specific resident if the first argument is `null`. I need to ensure it targets the **resident's user ID**.
    *   *Refinement:* I will check `notificationController.js` to see how `createNotification` handles the recipient. It likely needs `userId` as the first argument. The current code passes `null`, which might be wrong. I will fix this to pass the resident's User ID (retrieved from `users` table via `resident_id`).

2.  **Frontend Update:**
    *   The `NotificationBell` is already in the `Header`, so residents should see it. I will double-check that `AppShell` is indeed used for resident routes (confirmed by search result).

**Task List:**

1.  **Migration:** Create `add_generated_file_to_document_requests` migration.
2.  **Backend Logic:**
    *   Update `updateRequestStatus` in `CertificateRequestController` to:
        *   Fix notification targeting (get User ID from Resident ID).
        *   Implement `docxtemplater` generation logic.
    *   Add `downloadGeneratedCertificate` method and route.
3.  **Frontend Logic:**
    *   Add "Download Generated Certificate" button to the Admin's request view.

This plan covers both the automation and the notification fix.