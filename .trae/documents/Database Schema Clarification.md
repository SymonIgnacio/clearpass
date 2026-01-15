I have analyzed your database schema and code workflows. Here is the answer to your question:

### 1. Does the system have a different table than the users?
**Yes.** Your system separates "login info" from "profile info":

*   **`users` Table:** Handles **authentication**.
    *   Stores: `username`, `password_hash`, `role`, and a link to `resident_id`.
    *   Purpose: Lets people log in.
*   **`residents` Table:** Handles **demographics**.
    *   Stores: `First_Name`, `Last_Name`, `Age`, `Address`, etc.
    *   Purpose: Keeps the official census data.

### 2. Is there a separate table for Admin users?
**No.**
*   Admins are stored in the same **`users`** table.
*   They are distinguished simply by their **Role ID** (e.g., `role: 1` for Admin vs `role: 12` for Resident).

### How the Two Workflows Work (Under the Hood)

| Feature | What happens in the Database |
| :--- | :--- |
| **Admin Adds Resident** | 1. Creates row in `residents`.<br>2. Automatically creates row in `users` (generates username/pass).<br>3. Links them via `users.resident_id`. |
| **User Self-Register** | 1. Creates row in `users` (with their chosen username/pass).<br>2. Creates row in `residents` (status: "Pending").<br>3. Links them via `users.resident_id`. |

**Conclusion:** You have **two** physical tables (`users`, `residents`) that work together. "Admins" and "Residents" are just different *roles* inside that same `users` table.