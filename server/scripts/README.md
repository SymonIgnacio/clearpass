# Presentation Data Scripts

These scripts are designed to prepare the database for your Capstone presentation.

## Prerequisites

- Node.js installed
- Database running (MySQL)
- Environment variables configured in `.env` (Root or Server directory)

## Scripts

Run these commands from the **root** directory of the project (`c:\xampp\htdocs\clearpass`).

### 1. Test Database Connection (Safety Check)

Run this first to ensure everything is connected properly without changing any real data. It creates and deletes a temporary test record.

```bash
node server/scripts/test_db_connection.js
```

### 2. Clean Data (Reset)

**WARNING:** This will delete data from the following tables to provide a clean slate:

- `certificates_log`, `document_requests`, `clearance_requests`
- `blotter`, `blotter_case_sequences` (Resets case numbering to 0001)
- `vulnerabilities`, `residents`, `households`
- `users` (Only accounts with `role='resident'`)

```bash
node server/scripts/clean_presentation_data.js
```

### 3. Seed Presentation Data (Populate)

This inserts the mock data scenarios specifically designed for testing AI features (Certificate Blocking).

```bash
node server/scripts/seed_presentation_data.js
```

## Mock Data Scenarios

### Residents

All resident accounts use the password: `123456`

1. **Juan Good** (`juan.good@example.com`)
   - **Status:** Clean Record
   - **Expected AI Result:** Certificate Approved

2. **Pedro Bad** (`pedro.bad@example.com`)
   - **Status:** Active Blotter Case (Theft)
   - **Expected AI Result:** **BLOCKED** by AI (Active Case)

3. **Maria Settled** (`maria.settled@example.com`)
   - **Status:** Settled Blotter Case (Noise Barrage)
   - **Expected AI Result:** Certificate Approved (Case Settled)

### Blotter Cases

- **Case #0001**: Theft (Active) - Linked to Pedro Bad
- **Case #0002**: Noise Barrage (Settled) - Linked to Maria Settled

## Technical Notes

- The scripts use the **exact** ID generation logic as the backend (`RES-...`, `BLOT-...`).
- `blotter_case_sequences` is manually updated so the next manually created case will correctly be `#0003`.
