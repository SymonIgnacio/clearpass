I have completed the analysis and identified the root cause of the discrepancy.

**Root Cause Analysis:**
1.  **Frontend (The Issue)**: In `ResidentDashboard.jsx`, the code checks if `user.resident_id` exists before fetching the profile.
    *   For "Guests" (like Symon), `resident_id` is typically null.
    *   The code falls back to a **manual mock profile** (lines 120-130) which **does not include** the `verification_document`.
    *   Consequently, the logic that adds the "Verification Request" to the list (lines 162-170) is never triggered, resulting in 0 pending requests.
2.  **Backend**: The `/resident-auth/profile` endpoint **is correctly implemented** to handle Guests. It looks up `resident_applications` by email and returns the profile *with* the `verification_document` if one exists.
3.  **Database**: The data exists (indicated by the "Pending Verification" status), but the frontend simply isn't asking for it.

**Proposed Solution:**
I will modify `client/src/pages/ResidentDashboard.jsx` to **always fetch the profile from the API**, regardless of whether `resident_id` is present. The backend is already capable of returning the correct data for guests.

**Implementation Plan:**
1.  **Update `ResidentDashboard.jsx`**:
    *   Remove the conditional `if (user.resident_id)` check around the profile fetch.
    *   Remove the hardcoded mock profile logic.
    *   Ensure the API call is made for all authenticated users.

**Verification:**
Once applied, the dashboard will fetch the real profile from the backend, which includes the `verification_document`. The existing logic will then correctly add the "Residency Verification" item to the requests list, and the "Pending Requests" count will update from 0 to 1.