# ClearPass Core Directives

**Version:** 1.1 (Simplified)

## 1. Stack & Environment

- **Core:** React 18 (Vite), Node 18 (Express), MySQL 8, Python 3.11.
- **Ports:** Client `5174`, Server `3002`.
- **Env:** Validate with `npm run validate-env`. **Never** commit `.env`.

## 2. Workflow

- **Start:** `npm run dev:all` (Client + Server + AI).
- **Git:** Descriptive branches (`feature/xyz`) and imperative commits ("Add user validation").
- Update `GROUND_RULES.md` before every git commit.

## 3. Coding Standards

- **Strict Linting:** Zero ESLint warnings allowed.
- **Frontend:** Functional components + Hooks only. Use Context for global state.
- **Backend:** `async/await` only. Use centralized `errorHandler`.
- **Formatting:** Prettier on save is mandatory.

## 4. Database

- **Migrations:** **REQUIRED** for all schema changes (`npm run db:migrate`).
- **Queries:** Use `Knex` builder or parameterized SQL. **No raw strings.**
- **Safety:** No `DROP TABLE` in production scripts.

## 5. Security

- **Auth:** All private routes need `verifyToken`.
- **Access:** Use `checkRole(['admin'])` for restrictions.
- **Input:** Sanitize all user data.

## 6. Naming Reference

| Type          | Format                     | Example                                |
| :------------ | :------------------------- | :------------------------------------- |
| **Files**     | `camelCase` / `PascalCase` | `authController.js`, `UserProfile.jsx` |
| **Variables** | `camelCase`                | `isValid`, `userData`                  |
| **DB Tables** | `snake_case`               | `residents`, `blotter_cases`           |
| **API**       | `kebab-case`               | `/api/resident-profiles`               |
| **Constants** | `UPPER_SNAKE`              | `MAX_RETRY`                            |
