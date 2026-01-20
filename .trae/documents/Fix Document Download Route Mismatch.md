# Fix "Cannot GET /api/documents/download" Error

The error `Cannot GET /api/documents/download` happens because the frontend is trying to access a URL that doesn't exist in the backend routing configuration.

## 1. Audit Report: The Mismatch
- **Frontend ([DocumentsDashboard.jsx](file:///c:/xampp/htdocs/clearpass/client/src/pages/DocumentsDashboard.jsx))**:
    - The code constructs a download link: `${window.location.origin}/api/documents/download?...`.
    - It attempts to use a generic `/download` endpoint with query parameters.
- **Backend ([documentRoutes.js](file:///c:/xampp/htdocs/clearpass/server/routes/documentRoutes.js))**:
    - The actual route is defined as `/api/documents/requests/:request_id/download`.
    - It requires a specific `request_id` in the URL path, not just query parameters.
    - It also requires `verifyToken` middleware, which means a simple `window.open` might fail if the token isn't passed (though browsers send cookies, JWTs usually require headers). **However**, for a simple download, we might need a public or query-param based token approach, or simply fix the URL structure first.

## 2. Implementation Plan
- **Backend Action**:
    - Create a new, flexible route `GET /download` in `server/routes/documentRoutes.js` that handles manual downloads via query parameters (like `controlNo` or `type`).
    - This route will map to `DocumentController.downloadDocument` but without the strict `request_id` path requirement, allowing the controller to find the document by `control_no` (which we have from the issuance response).
- **Frontend Action**:
    - Ensure the `window.open` URL matches this new route structure exactly.

## 3. Verification
- I will verify that `GET /api/documents/download?type=...&manual=true&controlNo=...` hits the new route.
- I will verify that `DocumentController.downloadDocument` can handle looking up a certificate by `control_no` (I'll double-check the controller logic next to ensure it supports this lookup strategy).
