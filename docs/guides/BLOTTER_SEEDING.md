# Blotter Data Seeding Guide

This guide explains how to populate the `blotter` table with bulk test data using the provided seed script.

## Quick Start

Run the following command from the project root (`C:\xampp\htdocs\clearpass`):

```bash
node scripts/database/seeds/add_bulk_blotter.cjs
```

## detailed Description

The `add_bulk_blotter.cjs` script performs the following actions:

1.  **Checks Existing Data**: It counts the current records in the `blotter` table.
2.  **Generates Random Data**: Creates **100** random blotter entries with:
    *   Varied Incident Types (e.g., Physical Injury, Theft, Noise Complaint).
    *   Randomized dates within the year 2025.
    *   Randomly assigns existing Residents as respondents (50% chance) or generates new names.
    *   Randomly assigns Sitios from the `sitios` table.
3.  **Adds Specific Test Case**: Inserts a hardcoded test case for specific testing:
    *   **Case Number**: `BLOT-2026-01-0001`
    *   **Complainant**: Barangay Officer
    *   **Respondent**: Ana Lizel
    *   **Incident**: Unauthorized parking blocking
4.  **Verifies Insertion**: Outputs the final count of records.

## Troubleshooting

*   **Database Connection Error**: Ensure MySQL is running and your `.env` file has the correct `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
*   **Missing Dependencies**: If the script fails due to missing modules, run:
    ```bash
    npm install
    ```
