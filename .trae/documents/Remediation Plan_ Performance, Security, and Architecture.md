I will address the critical findings from the audit report in the following order:

### Phase 1: Performance Optimization (Database Indexes)
1.  **Create Migration**: Generate a new Knex migration file `server/migrations/YYYYMMDD_add_performance_indexes.js`.
2.  **Implement Indexes**: Add the recommended indexes to the migration:
    - `residents`: `(First_Name, Last_Name)`, `(Residency_Status)`
    - `blotter`: `(Status)`, `(Incident_Type)`
    - `certificates_log`: `(resident_id)`, `(date_issued)`
3.  **Apply Migration**: Run `knex migrate:latest` to apply changes to the database.

### Phase 2: Security Remediation (Replace `xlsx`)
1.  **Install Alternatives**: Install `exceljs` (for XLSX handling) and `fast-csv` (for CSV handling).
2.  **Refactor Code**:
    - Update `server/controllers/residentController.js`:
        - Replace `xlsx` export logic with `exceljs` (for Excel) and `fast-csv` (for CSV).
        - Replace `xlsx` import logic with `exceljs` (for Excel parsing).
    - Check `server/controllers/caseManagementController.js` (it appears to fake XLSX generation; I will fix this to use `exceljs` properly).
3.  **Cleanup**: Uninstall the vulnerable `xlsx` package.

### Phase 3: Architecture Refactoring (Service Layer)
1.  **Create Service**: Create `server/services/residentService.js`.
2.  **Move Logic**: Migrate complex business logic and SQL queries from `residentController.js` to the new service.
3.  **Update Controller**: Refactor `residentController.js` to inject and use `residentService`.
4.  **Unit Tests**: Create `server/tests/unit/services/residentService.test.js` to verify the new service logic.

I will begin with Phase 1 (Performance) immediately after your approval.