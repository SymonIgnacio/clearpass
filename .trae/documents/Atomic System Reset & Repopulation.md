I have analyzed the current seed files and the user's request for an atomic system reset and repopulation.

# System Reset & Repopulation Plan

## 1. Analysis
-   **Current State**: `server/seeds/01_initial_data.js` contains a mix of purge logic (`.del()`) and data insertion (Sitios, Users, Households, Residents, Certificates).
-   **Problem**:
    -   The existing `01_initial_data.js` deletes `users` and re-inserts them, which might conflict with preserving existing admin accounts if they are not in the seed.
    -   The user wants to **preserve system configuration and essential reference data** but purge resident data.
    -   The user wants "Fresh resident data following the original schema structure".
-   **Solution**: Create a dedicated "Reset & Repopulate" script that uses Knex transactions to ensure atomicity.

## 2. Strategy
I will create a new script `server/scripts/reset_and_seed_residents.js` (or similar) that:
1.  **Connects** to the database using the existing Knex configuration.
2.  **Starts a Transaction**.
3.  **Purges** Resident-related tables *only* (keeping Users, Roles, Settings).
    -   `DELETE FROM residents`, `households`, `blotter`, `certificates_log`, etc.
    -   *Note*: I will NOT delete `users` unless they are resident-users (if distinguishable). The current seed adds a resident user, so I should be careful.
4.  **Repopulates** Resident data using a modified version of the logic from `01_initial_data.js`.
    -   Insert Sitios (if missing).
    -   Insert Households.
    -   Insert Residents.
    -   Insert Vulnerabilities.
5.  **Commits** the transaction.

## 3. Execution Steps
1.  **Create Script**: `server/scripts/atomic_system_reset.js`.
    -   Import Knex config.
    -   Define the `resetSystem` function.
    -   **Purge Logic**: Use `DELETE` statements ordered by foreign key dependencies (child first).
    -   **Seed Logic**: Extract resident/household seeding from `01_initial_data.js` and include it directly in the script.
2.  **Run Script**: Execute with `node server/scripts/atomic_system_reset.js`.
3.  **Verify**: Check that tables are populated and the system is operational.

This satisfies the "atomic transaction" requirement (using Knex transaction) and "fresh resident data" (using the seed data).

## 4. Why this approach?
-   **Atomicity**: `knex.transaction` guarantees all-or-nothing.
-   **Safety**: We control exactly what gets deleted (Resident data) vs what stays (Admin users, Configs).
-   **Speed**: One script handling both purge and seed.

I will reuse the sample resident data from `01_initial_data.js` as the "fresh resident data".