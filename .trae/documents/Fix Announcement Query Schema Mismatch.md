I have identified the issue causing the "Unknown column 'status' in 'where clause'" error when fetching announcements.

### **Root Cause Analysis**
1.  **SQL Mismatch**: The backend code in `systemAdminController.js` attempts to query the `announcements` table using a `status` column and a `target_audience` column:
    ```sql
    WHERE status = 'active' 
    AND (target_audience = 'all' OR target_audience = 'residents')
    ```
2.  **Database Reality**: The actual database schema for `announcements` (verified via `SHOW COLUMNS`) uses:
    *   `is_active` (tinyint) instead of `status` (varchar).
    *   It **does not have** a `target_audience` column at all.
    *   It has `priority` and `category` which are present in the table.

### **The Fix Plan**
I will modify `getResidentAnnouncements` in `server/controllers/systemAdminController.js` to match the actual database schema.

1.  **Update Query**:
    *   Replace `status = 'active'` with `is_active = 1`.
    *   Remove the `target_audience` check entirely (since the column doesn't exist, we assume all active announcements are visible to residents for now, or we filter by category if needed).
    *   The corrected query will look like:
        ```sql
        SELECT id, title, content, priority, created_at
        FROM announcements 
        WHERE is_active = 1
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
        ```
2.  **Update Count Query**:
    *   Match the same logic for the total count query.

This will align the backend code with the existing database structure and resolve the 500 Error.