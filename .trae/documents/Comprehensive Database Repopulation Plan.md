I have analyzed the database schema and foreign key relationships. Here is the comprehensive repopulation plan.

# Database Repopulation Plan

## 1. Data Removal Phase
**Goal**: Safely purge all resident-related data while maintaining schema integrity.

### Target Tables (in dependency order):
1.  **Level 3 (Grandchildren)**:
    -   `blotter_participants`
    -   `resident_documents`
    -   `application_documents`
    -   `program_participants`
    -   `vulnerabilities`
    -   `vehicles`
    -   `visitors`
    -   `document_requests` (via `fk_doc_req_resident`)
    -   `certificates_log`
    -   `audit_logs` (only resident-related actions if distinguishable, otherwise preserve)
2.  **Level 2 (Children)**:
    -   `blotter` (via `respondent_id`)
    -   `households` (circular dependency with `residents` via `Head_Resident_ID`)
    -   `resident_applications`
    -   `users` (specifically the `resident_id` column needs to be NULLed, or resident users deleted)
3.  **Level 1 (Parents)**:
    -   `residents`

### Strategy:
-   **Disable Foreign Key Checks** (`SET FOREIGN_KEY_CHECKS=0`) to handle circular dependencies (like `residents` <-> `households`).
-   **Truncate Tables** for a clean slate on transactional tables.
-   **Conditional Delete** for `users` (DELETE where `role` = 'resident' or `resident_id` IS NOT NULL).

## 2. Data Population Strategy
**Goal**: Insert robust sample data with realistic relationships.

### Dependency Map (Insertion Order):
1.  **Reference Data**:
    -   `sitios` (Batia Proper, Northville 5, etc.)
    -   `certificate_types` (Clearance, Residency, Indigency)
    -   `roles` (Admin, Captain, Secretary, Clerk, Resident)
2.  **Core Entities**:
    -   `households` (Insert initially with `Head_Resident_ID = NULL`)
    -   `residents` (Insert 50+ records linked to households)
    -   **Update** `households` to set valid `Head_Resident_ID`.
3.  **Operational Data**:
    -   `users` (Create accounts for select residents)
    -   `vulnerabilities` (Tag specific residents as 4Ps/PWD/Senior)
    -   `blotter` (Create cases linking Complainant [Resident A] vs Respondent [Resident B])
    -   `certificates_log` (Generate history of issued certs)
    -   `program_participants` (Enroll residents in events)

## 3. Implementation Plan
I will create a Node.js script `server/scripts/repopulate_db.js` using Knex transactions.

### Script Logic:
1.  **Transaction Start**
2.  **Purge**: `SET FOREIGN_KEY_CHECKS=0` -> Truncate tables -> `SET FOREIGN_KEY_CHECKS=1`.
3.  **Seed Reference**: Ensure Sitios and Cert Types exist.
4.  **Seed Residents**:
    -   Generate 50 residents across 15 households.
    -   Use realistic names, ages, and relationships (Head, Spouse, Child).
5.  **Seed Complex Relationships**:
    -   **Blotter**: Create 5 active cases (e.g., "Noise Complaint", "Boundary Dispute") linking random residents.
    -   **Certificates**: Issue 10 past certificates.
    -   **Users**: Register 5 residents as system users.
6.  **Transaction Commit**

## 4. Verification Phase
-   **Relationship Check**: Verify `households` have valid heads.
-   **Data Volume**: Confirm counts (e.g., >50 residents, >5 blotter cases).
-   **Integrity**: Ensure no orphaned records in `blotter` or `certificates_log`.

This plan provides a "Real World" dataset rather than a minimal one, allowing full testing of the system's features.