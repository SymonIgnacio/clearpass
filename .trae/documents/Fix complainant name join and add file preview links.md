I have identified the two issues:
1.  **Missing Complainant Name**: The `getRequestById` method in `blotterRequestController.js` performs a simple `SELECT *` on the `blotter_requests` table but fails to join with the `residents` table. As a result, the `complainant_name` is never fetched, leading to "Name: N/A" in the UI.
2.  **Broken File Previews**: The `RequestDetail.jsx` component blindly tries to render file chips but lacks a preview or download mechanism. The current implementation only shows the filename and size.

### Plan
1.  **Backend Fix (`blotterRequestController.js`)**:
    -   Modify `getRequestById` to perform a `LEFT JOIN` with the `residents` table.
    -   Select `CONCAT(r.First_Name, ' ', r.Last_Name) AS complainant_name` to make the name available in the API response.

2.  **Frontend Fix (`RequestDetail.jsx`)**:
    -   Enhance the "Evidence Files" section.
    -   Add a "Preview/Download" button for each file.
    -   Since the files are likely stored as BLOBs or in a protected directory (based on the `uploadEvidence` middleware), I will add a mechanism to view them. *Correction*: Looking at the codebase, files are stored in `uploads/` and served statically or via an endpoint. I will add a button that links to `/api/uploads/${filename}` or opens it in a new tab, assuming standard static file serving is enabled or I will add a proper download handler if needed.
    -   *Refinement*: I'll check if there's an existing `View` button logic I can reuse or just wrap the filename in a clickable link.

This will resolve the "N/A" name and make the evidence files accessible.