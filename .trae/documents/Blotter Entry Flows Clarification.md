## Answer (Why both exist)
- **“New Case Encoding”** is a Blotter Officer “quick encode” page: [OfficerNewCase.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/OfficerNewCase.jsx#L98-L107). It posts to `/api/case-management/create` and inserts into the **`blotter`** table: [caseManagementRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/caseManagementRoutes.js#L10-L15), [caseManagementController.createCase](file:///c:/xampp/htdocs/clearpass/server/controllers/caseManagementController.js#L150-L185).
- **“File a Complaint”** in Blotter Records is the **Katarungang Pambarangay wizard** (Intake → Summons → Resolution): [Blotter.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/Blotter.jsx#L392-L412). It posts to `/api/blotter` which also creates blotter entries: [blotterRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/blotterRoutes.js#L12-L39).

So they’re basically **two front-ends that create the same kind of record**, via two different endpoints/controllers.

## Plan (Keep the wizard; remove/redirect “New Case Encoding”)
1. **UI navigation cleanup**
   - Remove the “New Case” item under Case Management from the sidebar, or repoint it to **Blotter Records**.
   - Reference: [Sidebar.jsx](file:///c:/xampp/htdocs/clearpass/client/src/components/Sidebar.jsx#L92-L109)

2. **Route consolidation**
   - Replace the `/officer/new-case` route so it **redirects to `/blotter`** (wizard page).
   - Reference: [App.jsx](file:///c:/xampp/htdocs/clearpass/client/src/App.jsx#L424-L434)

3. **Auto-open wizard when redirected** (so “New Case” still feels like “create”) 
   - Add support in `Blotter.jsx` to auto-open the complaint wizard when a query/state flag is present (e.g. `/blotter?new=1`).
   - Then the redirect can be `/blotter?new=1`.

4. **Optional cleanup** (safe follow-up)
   - Keep `OfficerNewCase.jsx` and `/api/case-management/create` for now (no breaking), or fully deprecate them later once you confirm nobody uses that path.

If you confirm, I’ll implement steps 1–3 so there is only one creation flow (the wizard) and no duplicate “New Case Encoding” entry point.