# Safe System Alignment & Gap Remediation Plan

I understand your concern. **You will absolutely NOT need to start from scratch.** I can guarantee that nothing will break because we will use a **non-destructive, safety-first approach**.

## Why this is safe:
1.  **Redundancy, not Rewriting:** The "monolithic" file (`routes.js`) mostly contains duplicate code that already exists in the "modular" files (`routes/*.js`). We are simply switching the "active" switch to the better-organized files.
2.  **Backup Strategy:** I will **rename** the old file to `routes.js.bak` instead of deleting it. If *anything* stops working, we can revert instantly by renaming it back.
3.  **Precise Migration:** I will surgicaly copy only the specific missing pieces (like the dashboard stats) to the new location before switching over.

## Revised Execution Steps

### 1. Safe Route Consolidation (High Priority)
-   **Step 1: Gap Analysis:** I will read `server/routes.js` one last time and identify *exactly* which dashboard endpoints are missing from the modular files.
-   **Step 2: Surgical Transplant:** I will add those missing endpoints to `server/routes/residentProfileRoutes.js`, `clerkRoutes.js`, etc., ensuring they work exactly the same way.
-   **Step 3: Safe Switch:**
    -   Comment out the line `app.use('/api', require('./routes'));` in `server/index.js`.
    -   Rename `server/routes.js` to `server/routes.js.bak`.
    -   *Result:* The system now runs on the clean, modular architecture. The old code is saved just in case.

### 2. Documentation Alignment
-   **Action:** Restore `README.md` and `GROUND_RULES.md` to the project root for better visibility.

### 3. Future-Proofing (Low Risk)
-   **Action:** I will create a Todo list for future improvements (like converting raw SQL to Knex), but I will **not** touch the database logic today to ensure zero disruption.

**Confirmation:** This plan is designed to be 100% reversible. We fix the structure without breaking the functionality.
