I will resolve the issue by fixing the data mismatch between the frontend and backend, and implementing the requested dropdown for locations.

**Frontend Changes (`client/src/pages/ResidentBlotterReport.jsx`)**

1. **Fetch Sitios**: Implement a `useEffect` hook to fetch the list of sitios from `/api/sitios` when the component mounts.
2. **Implement Dropdown**: Replace the "Location" text input with a Material UI `Select` or `Autocomplete` component, populated with the fetched sitios.
3. **Format Payload**: Update the `handleSubmit` function to transform the form data into the format expected by the backend:

   * `location` → `location_sitio`

   * `description` → `narrative`

   * `date_time` → Split into `incident_date` (YYYY-MM-DD) and `incident_time` (HH:mm)

**Backend Changes (`server/controllers/blotterComplaintController.js`)**

1. **Input Validation**: Add null-coalescing to ensure that extracted parameters default to `null` (or appropriate defaults) if they are missing from the request body. This prevents the "Bind parameters must not contain undefined" SQL error.

   * Ensure `location_sitio`, `narrative`, `incident_type` are never `undefined`.

**Verification**

* I will verify the code structure ensures all parameters are defined before sending to the database.

* I will verify the frontend correctly fetches and displays the sitios.

