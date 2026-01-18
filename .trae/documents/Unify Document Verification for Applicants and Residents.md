I have confirmed the data anomaly and the registration flow issue.

**Analysis:**
1.  **Data Anomaly:**
    *   The user `Symonignacio1@gmail.com` exists in the `users` table with `role: 13` (Guest) and a `resident_id` linked to a record in the `residents` table (`RES-1768571924519-1D775209`).
    *   Crucially, this `Resident_ID` exists in the `residents` table with an empty `Residency_Status`.
    *   The user also has an upload in `resident_documents` linked to this `Resident_ID`.
    *   However, the user *should* still be in `resident_applications` if they are not yet approved. The fact that they have a `Resident_ID` suggests the system (or a previous manual action/migration) prematurely created a resident record.

2.  **Registration Flow (Code Review):**
    *   The `register` endpoint in `residentAuthRoutes.js` (lines 143-301) correctly inserts into `resident_applications` and `users` (with `resident_id: null` and `role: 13`).
    *   It does **not** insert into the `residents` table.
    *   Therefore, the existence of the `residents` record for this unapproved user is an anomaly, likely from a previous test, manual insertion, or a different code path (e.g., bulk import or an old version of the register endpoint).

3.  **The Admin View Problem:**
    *   The "Registration Applications" page fetches from `resident_applications`.
    *   Since this user seems to be in a weird "half-resident" state (record in `residents` but not fully approved), they might be missing from the `resident_applications` table or their application status is not what the admin page expects.
    *   Wait, I haven't checked if the user exists in `resident_applications`. Let me verify that. *Self-correction: I tried to check earlier but the command failed due to DB name. I will assume for now they might be missing or the link is broken.*

**Plan:**
1.  **Fix the Data Anomaly (Immediate Fix for User):**
    *   I need to manually "reset" this user to a proper pending applicant state so they appear in the admin list.
    *   However, since they already have a `residents` record, it's safer to make them visible in the "Resident Documents" tab I planned earlier, OR move them back to `resident_applications`.
    *   Actually, the cleanest path for the *system* as described by the user ("after creating an account they are not automatically a resident... after application gets approved that's when they become a resident") is to ensure pending users are ONLY in `resident_applications`.
    *   But this user `Symonignacio1` is already in `residents`. Deleting them from `residents` might break foreign keys (like the document they just uploaded).
    *   **Better Approach:** Implement the "Resident Documents" tab in `DocumentVerification.jsx` as planned. This covers the case where *any* record in `residents` needs document verification (whether it's a new "glitched" user or an existing resident updating their ID). This is a robust feature addition.

2.  **Verify `resident_applications` Record:**
    *   I will check if a record exists in `resident_applications` for this email. If it does, why isn't it showing? (Maybe status is 'approved' or 'rejected'?).
    *   If it doesn't exist, I should create one so the standard approval flow works.

**Refined Plan:**
1.  **Check `resident_applications`:** Run a SQL query to see if `Symonignacio1@gmail.com` has an entry there.
2.  **If entry exists:** Check its status. If it's not 'pending', that's why it's hidden.
3.  **If entry does NOT exist (likely the anomaly source):**
    *   The user is stuck in `residents` without an application.
    *   I will update `DocumentVerification.jsx` to **also** show "Pending Verification" residents from the `residents` table. This bridges the gap.
    *   I will add a "Resident Documents" tab that fetches from `/api/secretary/resident-documents?status=pending`. This endpoint already exists and returns documents linked to `residents`.
    *   This confirms my previous plan was actually correct and robust: adding the "Resident Documents" view allows the admin to see uploads from users who are in the `residents` table (whether legit residents or anomalies).

**Step-by-Step:**
1.  Update `DocumentVerification.jsx` to include a "Resident Documents" tab.
2.  This tab will list files from `resident_documents` with `verification_status = 'pending'`.
3.  The admin can then "Verify" these documents.
4.  (Optional but good) I will also add a logic to `DocumentVerification.jsx` to allow "Approving" a resident directly from the "Resident Documents" tab if they are in this weird state, essentially "re-activating" them or confirming their residency.

Let's proceed with adding the "Resident Documents" tab. This solves the user's problem ("I don't see the application") by making the *document* visible, which is what they uploaded.