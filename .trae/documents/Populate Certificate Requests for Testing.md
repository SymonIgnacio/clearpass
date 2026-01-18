I will create a seeding script to populate the `document_requests` table with sample data linked to existing residents.

### 1. Create Seeding Script (`scripts/seed_certificate_requests.js`)
This script will:
1.  Connect to the database using the existing `server/database.js` configuration.
2.  Fetch up to 5 existing residents from the `residents` table to ensure valid foreign keys.
3.  Generate mixed sample requests (Pending and Approved) for different document types:
    *   **Barangay Clearance** (Pending)
    *   **Certificate of Indigency** (Pending)
    *   **Business Permit** (Approved)
4.  Insert these records into the `document_requests` table with properly formatted JSON for `request_data` and `resident_data`.

### 2. Execution
I will run the script using Node.js:
```bash
node scripts/seed_certificate_requests.js
```

This will verify the data insertion and allow you to see the requests in the "Certificate Requests" dashboard immediately.