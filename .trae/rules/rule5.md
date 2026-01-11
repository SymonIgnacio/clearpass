# ClearPass Core Directives
## 5. Security Requirements

- **Auth:** All private routes need `verifyToken`.
- **Access:** Use `checkRole(['admin'])` for restrictions.
- **Input:** Sanitize all user data.
