# Resolve 404 Error on QR Generation Endpoint

## Diagnosis

The 404 error is caused by a **route mismatch** between the server definition and the client request:

* **Client Request:** `POST /api/residents/:id/generate-qr`

* **Server Route:** `POST /api/residents/:id/qr` (in `server/routes/residentRoutes.js`)

Additionally, the current controller logic blindly attempts to update the resident without verifying if the ID exists, leading to "false positive" success responses for invalid IDs.

## Implementation Plan

### 1. Fix Route Definition

Update `server/routes/residentRoutes.js` to match the client's expected URL structure.

* **Change:** `router.post('/:id/qr', ...)` → `router.post('/:id/generate-qr', ...)`

### 2. Enhance Controller Logic

Refactor `generateQR` in `server/controllers/residentController.js` to improve reliability and observability:

* **Add Logging:** Log the incoming request for the specific resident ID.

* **Validate Existence:** Check `affectedRows` from the database update operation.

* **Error Handling:**

  * Return `404 Not Found` if the resident ID does not exist (currently it returns 200).

  * Return `500 Internal Server Error` for database failures.

### 3. API Documentation

Add JSDoc-style comments to the controller method specifying:

* **URL:** `POST /api/residents/:id/generate-qr`

* **Params:** `id` (Resident ID)

* **Response:** JSON with `qr_code` string and status message.

* **Status Codes:** 200 (Success), 404 (Not Found), 500 (Server Error).

### 4. Verification

* Since direct DB access failed (Access Denied), verification will rely on the API response.

* **Test Case 1 (Valid):** Retry the request for `RES-2025-055` via the client or curl.

* **Test Case 2 (Invalid):** Send a request for `RES-INVALID-999` to ensure it returns 404.

