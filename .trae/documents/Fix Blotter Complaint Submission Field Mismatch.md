I have identified the issue. The user is trying to submit a complaint, but the server is returning a 500 error. The user's input mentions `http://localhost:3002/api/blotter 500 (Internal Server Error)`, but the frontend code in `ResidentBlotterReport.jsx` calls `/blotter-complaints/submit`.

However, the user's error message says `/api/blotter`. If the user is hitting `/api/blotter`, that endpoint expects `Complainant_Details` as a required field (from `blotterController.js`), but the resident form sends `description`, `incident_type`, etc.

Wait, if the user is using the resident portal (`ResidentBlotterReport.jsx`), it calls `/blotter-complaints/submit`.
In `blotterComplaintController.js`, `submitComplaint` calls `global.createBulkNotification`.
The error might be in `createBulkNotification` or `getIncidentPriority` or the database insert.

Actually, looking at `ResidentBlotterReport.jsx`:
```javascript
const response = await apiRequest('/blotter-complaints/submit', {
```
The user *said* `http://localhost:3002/api/blotter 500`. This suggests they might be looking at the wrong network request or I am misunderstanding.
But if they are using the `ResidentBlotterReport` page, it hits `/api/blotter-complaints/submit`.

Let's assume the user is reporting the error they see in the console, which might be from a different component or they misread it. But if they say "i cant file a complaint", they are likely on the filing page.

I suspect the error is in `blotterComplaintController.js` inside `submitComplaint`.
It calls:
```javascript
      // Create notification for officers
      if (global.createBulkNotification) {
        const [officers] = await this.db.execute(
          'SELECT id FROM users WHERE role = 6 AND is_active = 1'
        );
        // ...
```
If `officers` is empty or the query fails, or `createBulkNotification` fails, it might throw.

However, checking `blotterRoutes.js` (which is `/api/blotter`):
It has `router.post('/', ...)` which is for Admin/Blotter Officer. Residents shouldn't be hitting this.
If the user is a resident, they should use `/api/blotter-complaints/submit`.

**Hypothesis:** The user might have an old version of the frontend code cached or there's a redirect I missed?
No, `ResidentBlotterReport.jsx` clearly uses `/blotter-complaints/submit`.

Let's look at `blotterComplaintController.js` again.
It inserts into `blotter` table.
```javascript
        INSERT INTO blotter (
          Case_Number, Complainant_Details, Respondent_Details,
          Incident_Type, Narrative, DateTime_Incident, Location_Sitio, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
```
The columns `Complainant_Details` and `Respondent_Details` are expected to be JSON.
The controller stringifies them: `JSON.stringify(complainant_details)`.

**Potential Issue:** The `blotter` table schema might have changed or there's a constraint violation.
Or, `global.createBulkNotification` is not defined or failing.
In `server/index.js`:
```javascript
  global.createBulkNotification = createBulkNotification;
```
This is set inside `startServer`.

**Another possibility:** The `blotter` table might be missing a column or `Case_Number` generation is failing.

**Wait**, the user's error message: `http://localhost:3002/api/blotter 500`.
If the frontend is `ResidentBlotterReport.jsx`, it sends a POST to `/blotter-complaints/submit`.
Why does the user say `/api/blotter`?
Maybe the `apiRequest` utility handles the base URL? Yes.
But the path is `/blotter-complaints/submit`.
If the user *actually* saw `/api/blotter`, maybe they are on a different page?
`Blotter.jsx` (Admin side) uses `/api/blotter`.
But the user says "i cant file a complaint" and the context implies a resident action (implied by previous turn about resident dashboard).

Let's assume the user meant the endpoint triggered by `ResidentBlotterReport.jsx`.
If `blotterComplaintController.js` fails, it logs `Error submitting complaint:`.

**Missing Field?**
In `blotterComplaintController.js`:
```javascript
      const {
        incident_type,
        narrative,
        // ...
      } = req.body;
```
In `ResidentBlotterReport.jsx`:
```javascript
          body: {
            incident_type: formData.incident_type,
            location: formData.location, // Mapped to location_sitio?
            date_time: formData.date_time,
            description: formData.description // Mapped to narrative?
          }
```
Wait, the controller expects `narrative` and `location_sitio`.
The frontend sends `description` and `location`.
In `blotterComplaintController.js`:
```javascript
      const {
        // ...
        narrative,
        location_sitio,
        // ...
      } = req.body;
```
If these are undefined, `INSERT` might fail if columns are NOT NULL.
`narrative` comes from `req.body.narrative`. Frontend sends `description`. **Mismatch!**
`location_sitio` comes from `req.body.location_sitio`. Frontend sends `location`. **Mismatch!**

**Fix Plan:**
1.  Update `blotterComplaintController.js` to handle the field names sent by the frontend (`description` -> `narrative`, `location` -> `location_sitio`).
    OR
    Update `ResidentBlotterReport.jsx` to send the correct field names.

Updating the Frontend (`ResidentBlotterReport.jsx`) is cleaner to match the API expectation (or vice versa, but usually API dictates). However, looking at the controller, it seems to expect snake_case specific keys.
The frontend sends:
```javascript
          body: {
            incident_type: formData.incident_type,
            location: formData.location,
            date_time: formData.date_time,
            description: formData.description
          }
```
The controller destructures:
```javascript
      const {
        incident_type,
        narrative,
        incident_date, // Frontend sends date_time
        incident_time, // Frontend sends date_time (combined)
        location_sitio,
        // ...
      } = req.body;
```
There is a **significant mismatch** between Frontend and Backend fields.

**Plan:**
1.  Modify `ResidentBlotterReport.jsx` to format the data correctly before sending.
    -   Split `date_time` into `incident_date` and `incident_time`.
    -   Rename `location` to `location_sitio`.
    -   Rename `description` to `narrative`.
2.  Modify `blotterComplaintController.js` to be more robust or accept the combined datetime if possible (the controller currently concatenates them: `${incident_date} ${incident_time}`). If I send them separately, it's safer.

Actually, I will update `ResidentBlotterReport.jsx` to match the controller's expected schema.

**Controller Expects:**
-   `incident_type`
-   `narrative`
-   `incident_date`
-   `incident_time`
-   `location_sitio`

**Frontend Sends:**
-   `incident_type`
-   `location`
-   `date_time`
-   `description`

I will fix the frontend to send the correct payload.