# Plan: Implement Real-Time Verification Tracking

## 1. Backend: Update Profile Endpoint
- **File:** `server/routes/residentAuthRoutes.js`
- **Action:** Modify the `GET /profile` route (Lines 308-377).
- **Logic:**
    - When a user is a Guest (fetching from `resident_applications`), execute an additional query to check the `application_documents` table.
    - Query: Check for the latest document uploaded for this `application_id`.
    - **Response Update**: Add a `verification_document` object to the profile response containing:
        - `status`: The verification status from the DB (e.g., 'pending').
        - `uploaded_at`: The timestamp of the upload.

## 2. Frontend: Dashboard Integration
- **File:** `client/src/pages/ResidentDashboard.jsx`
- **Action:** Update `fetchDashboardData`.
- **Logic:**
    - Check `profileData.profile.verification_document`.
    - **Banner**: If a document exists, change the banner text from "Verification Required" to "Verification Under Review" (and hide the "Upload" button or change it to "View").
    - **Recent Requests**: 
        - If a document exists, inject a request entry into the list using the **real data** from the backend.
        - Title: "Residency Verification"
        - Status: Map backend 'pending' -> 'Under Review'.
        - Date: Use the real `uploaded_at` timestamp.

## 3. Database Alignment
- **Verification**: No schema changes needed. We are querying the existing `application_documents` table which maps to `resident_applications` via `application_id`.

This ensures that "Recent Requests" only shows an item if the user **actually uploaded** a file, and the status comes directly from the database.
