I will remove the "Quick Stats" section (Pending Requests, Completed, Total Requests) from the Resident Dashboard page.

**File to modify:** `c:\xampp\htdocs\clearpass\client\src\pages\ResidentDashboard.jsx`

**Changes:**

* Remove the inner `Grid` container (lines 534-574) that renders the three statistic cards.

* This will leave the "Quick Actions" card as the primary content in that column, which is the desired outcome.

* The `stats` state calculation will be preserved as `profile_completion` is still used in the Profile Summary section.

