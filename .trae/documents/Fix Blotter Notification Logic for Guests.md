# Overlooked Bugs and Fix Plan

Based on the analysis, I have identified two significant overlooked issues related to how the system handles "Guests" (Applicants) compared to "Residents".

## 1. Blotter Notifications for Guests
- **The Issue**: In `blotterController.js`, when a hearing is scheduled or status changes, the system attempts to notify the Complainant and Respondent.
- **The Bug**: The logic (lines 250-278) strictly queries the `users` table using `WHERE resident_id = ?`.
    - **Why it fails**: Guests (applicants) typically have a `resident_id` of `NULL` in the `users` table (or it points to a non-existent resident if not fully linked). If a guest files a complaint (and their temporary ID is stored in the blotter), this query will fail to find their user account, and **they will never receive the summon notification**.
- **Fix**: Update the notification logic to search `users` by `resident_id` OR `email` (since blotter stores details that might include email, or we can look up the applicant's email if they are in the system). Alternatively, if the guest account has a `resident_id` pointing to `resident_applications`, we need to handle that.
    - *Simpler Fix*: Modify the query to `SELECT id FROM users WHERE resident_id = ? OR email = ?` (requires retrieving email from the blotter details if available).

## 2. Search & List Visibility
- **The Issue**: The `getAll` search in `residentController.js` only queries the `residents` table.
- **The Bug**: If an Admin searches for a person who has applied but is not yet verified (a Guest), they will not appear in the main "Residents" list.
- **Fix**: While `secretaryRoutes.js` has a specific `/applications` endpoint, the global search or main resident list often ignores applicants. This might be "by design", but it can be confusing.
- **Recommendation**: For now, we will focus on the **Blotter Notification** bug as it is a functional failure (missed summons).

## Plan: Fix Blotter Notification for Guests
1.  **File**: `server/controllers/blotterController.js`
2.  **Action**: Update the notification query.
    - Instead of just `SELECT id FROM users WHERE resident_id = ?`, we should also try to find the user by **email** if `resident_id` lookup fails.
    - The `blotter` table stores `Complainant_Details` as JSON. If this JSON contains an email, we can use it to find the Guest User.

## Plan: Fix Resident Search (Optional/Future)
- **File**: `server/controllers/residentController.js`
- **Action**: Update `getAll` to optionally `UNION` with `resident_applications` if a specific flag is set, allowing Admins to search *everyone* in one go. (I will skip this for now to focus on the critical notification bug).

I will proceed with fixing the **Blotter Notification Logic** as it is a direct parallel to the "Guest Visibility" issue we just solved.
