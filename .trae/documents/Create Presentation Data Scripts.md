I have verified the project structure and dependencies. I will create three scripts in `server/scripts/` to ensure safe execution and accurate data generation.

### 1. Create `server/scripts/test_db_connection.js` (New Request)
This script will verify that we can connect and write to the database without destroying existing data.
- **Action:** Connects to the database using your existing configuration.
- **Test:** Inserts a temporary "Test Sitio" record.
- **Verification:** Reads it back to confirm success.
- **Cleanup:** Deletes the temporary record immediately.
- **Goal:** Confirms the environment is ready for the other scripts.

### 2. Create `server/scripts/clean_presentation_data.js`
This script will safely reset the system for your presentation.
- **Tables to Clear:** `document_requests`, `clearance_requests`, `certificates_log`, `blotter`, `vulnerabilities`, `residents`, `households`, `users` (residents only).
- **Sequence Reset:** Crucially, it will also reset `blotter_case_sequences` so your presentation starts with Case #0001.

### 3. Create `server/scripts/seed_presentation_data.js`
This script will insert the "Mock Data" using the **exact backend logic** I researched.
- **Households:** 3 Households in "Batia Proper".
- **Residents:**
  - `Juan Good` (Clean record)
  - `Pedro Bad` (Active Case - triggers AI blocking)
  - `Maria Settled` (Settled Case)
- **Blotter Cases:**
  - Active Case for Pedro (`BLOT-2025-01-0001`)
  - Settled Case for Maria (`BLOT-2025-01-0002`)
- **Logic Mirroring:**
  - Uses `bcryptjs` for passwords (same as `01_initial_data.js`).
  - Uses `crypto` for Resident IDs (same as `residentController.js`).
  - Updates `blotter_case_sequences` to ensure future cases don't conflict.

### 4. Create `server/scripts/README.md`
- Simple instructions on how to run these scripts:
  1. `node server/scripts/test_db_connection.js` (Safety check)
  2. `node server/scripts/clean_presentation_data.js` (Reset)
  3. `node server/scripts/seed_presentation_data.js` (Populate)

I will now proceed to create these files.
