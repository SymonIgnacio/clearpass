I have analyzed the request tracking logic and the provided logs/screenshots.

**Discrepancy Analysis:**
The user sees "1 Total Request" and "0 Pending Requests" in the dashboard stats, but their notification list shows multiple "Document Verified" and "Document Rejected" notifications (at least 4 visible in the screenshot).

**Root Cause:**

1. **Notifications vs. Requests**: Notifications (in the bell icon menu) and Requests (in the dashboard stats/list) are **separate data sources**.

   * **Notifications** (`user_notifications` table) are historical alerts. They accumulate over time. The fact that you have 6 notifications means you've interacted with the system 6 times (or received 6 alerts).

   * **Requests** (`certificates_log` table + injected Verification Request) are the *current* state of your applications.
2. **Dashboard Logic**: The "Pending", "Completed", and "Total" counts on the Resident Dashboard (lines 187-194) are calculated **only from the currently active requests** fetched from the `/certificates` endpoint, plus the single "Residency Verification" placeholder we injected.

   * The code `finalRequests.filter(...)` counts what is in the `requests` array.

   * Since your `resident_id` is missing (as established in previous turns), the `/certificates` call (lines 149-151) likely returns an empty list or isn't even made (line 147 checks `if (user.resident_id)`).

   * Therefore, the **only** request the dashboard knows about is the one we manually injected ("Residency Verification").

   * This explains why "Total Requests" is **1** (the placeholder).

   * And "Pending Requests" is **0**? Wait, my previous fix *should* have made it 1.

   * **Correction**: In the previous turn, I updated the filter to include `Pending Verification` (or `Pending Upload`). If it still says 0, then the status string might not match exactly what I put in the filter.

   * Looking at the code (line 179): `status: 'Pending Verification'`.

   * Looking at the filter (line 187): `r.status === 'Pending' || ... || r.status === 'Pending Upload'`.

   * **Bug Found**: I changed the placeholder status to `'Pending Verification'` but I **did not update the filter** to count `'Pending Verification'`. I only added `'Pending Upload'` to the filter.

**Why Notifications != Requests:**

* The notifications you see ("Document Verified", "Document Rejected") suggest you *did* have previous attempts.

* However, if those requests were processed and "Completed" (Verified/Rejected), they might not show up in the "Pending" count.

* More importantly, because of the missing `resident_id` linkage we discovered earlier, the system cannot find your *past* certificate requests in the database. It only knows about your *current* guest status.

**The Fix:**

1. **Update Stats Calculation**: I must update the `pending` filter in `ResidentDashboard.jsx` to include `'Pending Verification'`. This will make the "Pending Requests" count correct (1).
2. **Explanation**: The "1 Total Request" is correct because the system currently only sees your active "Residency Verification" task. The historical notifications are just a log of what happened, not active requests.

**Implementation Plan:**

1. **Modify** **`ResidentDashboard.jsx`**:

   * Update the `pending` filter logic (line 187) to include `r.status === 'Pending Verification'`.

**Verification:**

* Pending Requests will update from 0 to 1.

* Total Requests will remain 1.

* This accurately reflects your current state: You have 1 active item (Verification) that is pending. The past notifications are just history.

