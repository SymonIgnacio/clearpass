I have identified the issue: the database table `resident_documents` is missing the `file_content` column, which causes the "Unknown column" error during upload. This likely happened because the previous database migration didn't fully apply to that specific table.

To fix this reliably:

1.  **Create Fix Migration:** I will create a new migration file (`20250126000001_fix_resident_documents_schema.js`) that explicitly checks for and adds the missing `file_content` and `mime_type` columns to the `resident_documents` table.
2.  **Apply Migration:** I will run the database migration command (`npm run db:migrate`) to update your database schema.

Once this is done, you will be able to upload your documents successfully. Since I've already added the "Your Documents" list to your dashboard, you'll be able to see the confirmation immediately after uploading.