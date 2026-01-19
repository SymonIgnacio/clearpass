I have identified the issue causing the "Cannot read properties of undefined (reading 'total')" error on the "My Requests" page.

### **Root Cause Analysis**
1.  **Frontend Expectation (`RequestHistory.jsx:47`)**:
    The frontend expects the API response to have a `pagination` object with a `total` property:
    ```javascript
    setPagination(prev => ({ ...prev, total: data.pagination.total }));
    ```

2.  **Backend Reality (`certificateRequestController.js:153`)**:
    The `getMyRequests` method returns a JSON structure **without** a `pagination` object. It simply returns:
    ```javascript
    res.json({
      success: true,
      data: allRequests
    });
    ```
    Since `data.pagination` is undefined, trying to access `data.pagination.total` throws the TypeError.

### **The Fix Plan**
I will modify the backend controller `getMyRequests` method in `server/controllers/certificateRequestController.js` to match the expected response structure.

1.  **Update `getMyRequests`**:
    *   Calculate the total count (length of `allRequests`).
    *   Implement manual pagination (slice the array based on `page` and `limit` query parameters) or simply return the full list with a compliant structure if client-side pagination is preferred (though the frontend sends `page` and `limit`, implying server-side expectation).
    *   **Action**: I will verify if the frontend is sending pagination params (it is: `params: { page: pagination.page, limit: pagination.limit }`).
    *   **Refactor**:
        *   Extract `page` and `limit` from `req.query`.
        *   Slice the `allRequests` array to return only the requested page.
        *   Include the `pagination` object in the response: `{ page, limit, total }`.

This ensures the frontend receives exactly what it expects, preventing the crash.