I have identified the cause of the 500 Internal Server Error and a related issue with retrieving manual certificates.

**1. The Error ("Bind parameters must not contain undefined")**
*   **Cause:** When you use "Manual Certificate Creation", the frontend does not send a `resident_id` (because it's manual). The backend controller expects `resident_id` and passes it to the database query as `undefined`, which the MySQL driver rejects.
*   **Fix:** I will update `server/controllers/certificateController.js` to default `resident_id` to `null` if it is missing.

**2. Missing Data Handling**
*   **Cause:** The current database insert query ignores all the manual fields you are filling out (`resident_name`, `address`, `signatory_captain`, etc.). Even if I fixed the error, your certificate would be saved without the name and address you typed!
*   **Fix:** I will update the `INSERT` query to save `resident_name`, `address`, `signatory_captain`, `signatory_secretary`, and `is_manual`.

**3. Displaying Manual Certificates**
*   **Cause:** The current "Certificate History" list uses a strict `JOIN` with the residents table. This means any certificate *without* a linked resident ID (like the manual ones you are trying to create) would be invisible in the list.
*   **Fix:** I will update the `getAll` query to use a `LEFT JOIN` so that both linked and manual certificates appear in the history.

**Plan:**
1.  **Update `create` in `certificateController.js`**: Handle manual fields and fix the `undefined` error.
2.  **Update `getAll` in `certificateController.js`**: Use `LEFT JOIN` to correctly display manual certificates.