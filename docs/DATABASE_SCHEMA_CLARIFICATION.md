# Database Schema Clarification

## Users vs. Residents vs. Admins

### 1. Structure Overview
The system uses a normalized relational schema where "Login Accounts" and "Resident Profiles" are distinct entities.

*   **`users` Table:** Handles **Authentication**.
    *   Stores `username`, `password_hash`, `role`, and `is_active`.
    *   Contains a foreign key `resident_id` linking to the resident profile.
    *   **Admins** are simply records in this table with a specific Role ID (e.g., `role: 1`). There is **no separate admins table**.
*   **`residents` Table:** Handles **Demographics**.
    *   Stores `First_Name`, `Last_Name`, `Address`, `Age`, etc.
    *   Does not contain login credentials.

### 2. Workflows

#### A. Admin Adding a Resident
When an Admin adds a resident via the dashboard:
1.  **Resident Creation:** A new row is inserted into the `residents` table with the profile data.
2.  **User Creation (Auto):** A new row is automatically inserted into the `users` table.
    *   System generates a `username` and `password`.
    *   `role` is set to Resident (e.g., 12).
    *   `resident_id` is linked to the new resident record.

#### B. User Self-Registration
When a user registers via the public portal:
1.  **User Creation:** A new row is inserted into the `users` table with the **user-provided** `username` and `password`.
2.  **Resident Creation:** A new row is inserted into the `residents` table.
    *   `Residency_Status` is typically set to "Pending Verification".
    *   `resident_id` is linked.

### 3. Summary Table

| Entity | Table | Notes |
| :--- | :--- | :--- |
| **User Account** | `users` | Contains login info. |
| **Resident Profile** | `residents` | Contains personal info. |
| **Admin** | `users` | A User with `role = 1`. |
| **Resident User** | `users` | A User with `role = 12` + linked `resident_id`. |
