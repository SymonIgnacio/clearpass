# ClearPass Core Directives
## 4. Database Requirements

- **Migrations:** **REQUIRED** for all schema changes (`npm run db:migrate`).
- **Queries:** Use `Knex` builder or parameterized SQL. **No raw strings.**
- **Safety:** No `DROP TABLE` in production scripts.