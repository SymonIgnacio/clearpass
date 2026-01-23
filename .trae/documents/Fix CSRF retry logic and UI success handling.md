I have identified the root cause: **Broken CSRF Token Retry Logic**.

1.  **The Error**: The server returns a `403 Forbidden` error (likely due to an invalid/expired CSRF token or a permission issue).
2.  **The Handling Failure**:
    -   The backend's `errorHandler.js` wraps errors in a nested structure: `{ success: false, error: { message: '...', ... } }`.
    -   The frontend's `api.js` expects the error details at the top level (`errorData.message` or `errorData.code`) to detect CSRF issues and retry.
    -   Because of this mismatch, `api.js` fails to detect the CSRF error, doesn't retry, and passes the 403 response back to the component.
3.  **The UI Bug**:
    -   The `RequestDetail.jsx` component blindly assumes the API call succeeded without checking `response.ok` or the JSON result. It displays "Validation started" even when the request fails with a 403.

### Plan
1.  **Fix `client/src/utils/api.js`**: Update the CSRF detection logic to look inside the nested `error` object (`errorData.error.message`) so it can correctly identify and retry failed CSRF requests.
2.  **Fix `server/middleware/errorHandler.js`**: Explicitly handle `EBADCSRFTOKEN` errors to return a clear 403 response with the correct error code.
3.  **Fix `client/src/pages/RequestDetail.jsx`**: Update `startValidation` (and other action methods) to check if the response was actually successful before displaying the success message.
4.  **Enhance `server/routes/blotterRequestRoutes.js`**: Add `secretary` (Role 3) to the allowed roles for validation to prevent genuine permission errors for valid officers.