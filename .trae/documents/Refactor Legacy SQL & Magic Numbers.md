# Safe Refactoring Plan: Admin Controller

## 1. Safety & Baseline
- [ ] Run existing tests to confirm current system health.
- [ ] Create a safety backup: `server/controllers/adminController.js` -> `server/controllers/adminController.js.bak`.

## 2. Implementation (Rule 4 & 6 Compliance)
- [ ] Create a **new** `server/controllers/adminController.js`.
- [ ] Implement using **Knex Query Builder** (replacing `db.execute`).
- [ ] Implement using **Role Constants** (replacing `12`, `1`, etc. with `ROLES.RESIDENT`, `ROLES.ADMIN`).
- [ ] Ensure all input validation remains strict.

## 3. Verification
- [ ] Run the test suite again.
- [ ] If tests pass: Refactoring is a success.
- [ ] If tests fail: Delete new file, restore backup, and report issues.
