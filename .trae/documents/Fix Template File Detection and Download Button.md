I will fix the template file detection issue by updating both the backend SQL query and the frontend rendering logic.

**Analysis of the Issue:**

1. **Backend (`templateRoutes.js`):** The SQL query uses `(t.file_data IS NOT NULL) as has_file`. With the `mysql2` driver and prepared statements, this boolean expression often returns `0` or `1` as a number. The mapping function `!!row.has_file` might be misinterpreting the result if the driver returns a buffer or if `file_data` is technically not null but empty. More importantly, checking for `NULL` might not be enough if an empty buffer was stored.
2. **Frontend (`DocumentsDashboard.jsx`):** The frontend checks `template.file_data` to show the download button. However, the backend list endpoint *does not return* the `file_data` blob (for performance). It only returns `has_file`. Therefore, `template.file_data` is always `undefined`, and the download button never shows.

**Plan:**

1. **Backend Fix (`templateRoutes.js`):**

   * Update the SQL query in `GET /` to use a more robust check: `IF(t.file_data IS NOT NULL AND LENGTH(t.file_data) > 0, 1, 0) as has_file`. This ensures a clear `1` or `0` integer result.

   * Ensure `mapTemplateRow` handles this integer correctly (e.g., `has_file: !!row.has_file` is fine if `row.has_file` is 1 or 0).

2. **Frontend Fix (`DocumentsDashboard.jsx`):**

   * Change the condition for rendering the download button from `template.file_data` to `template.has_file`.

   * Update the "No file" chip logic to use `!template.has_file`.

   * Update the file info chip to use `template.has_file` as the condition, and display "File Attached" if `original_filename` is missing (since we don't send `original_filename` in the list view currently, though we probably should).

3. **Refinement:**

   * Update the backend list query to *also* return `original_filename` and `file_size` so the frontend can display the filename and size without needing the full blob.

**Task List:**

1. Update `GET /` in `templateRoutes.js` to select `original_filename`, `file_size`, and the improved `has_file` logic.
2. Update `mapTemplateRow` in `templateRoutes.js` to include `original_filename` and `file_size`.
3. Update `DocumentsDashboard.jsx` to use `template.has_file`, `template.original_filename`, and `template.file_size`.

