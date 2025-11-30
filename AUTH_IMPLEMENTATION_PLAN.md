# 🔒 Authentication & RBAC Implementation Plan

## 1. Objective

This document outlines the step-by-step implementation of a secure JSON Web Token (JWT) based authentication system and Role-Based Access Control (RBAC) for the Barangay Management System. This plan directly addresses the **HIGH PRIORITY** security finding in `SECURITY_AUDIT.md`.

## 2. Defined User Roles

The system will support the following roles, each with a specific level of access:

| Role               | Description                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Super Admin**    | System developer/maintainer with unrestricted access for administrative purposes.                       |
| **Barangay Captain** | Top official with full access to all operational modules and user management for staff.                   |
| **Barangay Staff** | Day-to-day operator with access to create/update records (Residents, Blotter) but not approve or delete. |
| **Tanod**          | Peace officer with read-only access to residents and focused access to the Blotter and AI Patrol modules. |

---

## 3. Implementation Phases

### Phase 1: Backend (Node.js/Express) - The Foundation

This is the most critical phase. We will build the core logic for security and data structure.

#### Step 1.1: Database Schema Update

We will use `knex.js` as a migration tool to version control our database changes.

1.  **Create a `roles` table:** This table will store our defined user roles.
    ```sql
    CREATE TABLE roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role_name VARCHAR(50) NOT NULL UNIQUE
    );
    ```
2.  **Create a `users` table:** This will store user credentials and link to a role.
    ```sql
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
    ```

#### Step 1.2: Secure Environment Configuration

In the `/server` directory, create a `.env` file to store secrets. **This file must be added to `.gitignore`**.

`/server/.env`:
DB_HOST=localhost DB_USER=root DB_PASSWORD=your_db_password DB_NAME=bmw_barangay_batia JWT_SECRET=generate_a_very_long_random_secure_string_here


#### Step 1.3: Implement Authentication Logic

1.  **Login Endpoint (`/api/auth/login`):**
    *   Accepts `username` and `password`.
    *   Finds the user in the `users` table.
    *   Uses `bcrypt.compare()` to check if the provided password matches the `password_hash`.
    *   If valid, generate a JWT containing `userId`, `username`, and `role`.
    *   The JWT will be signed with the `JWT_SECRET` from `.env`.
    *   Return the token to the client.

2.  **Password Hashing:**
    *   When creating users, never store plain-text passwords. Use the `bcryptjs` library to hash and salt passwords before saving them to the database.

#### Step 1.4: Implement Authorization Middleware

This middleware will protect our API routes.

1.  **`verifyToken.js` Middleware:**
    *   It will be attached to all routes that require authentication.
    *   It checks for an `Authorization` header in the format `Bearer <token>`.
    *   It uses `jwt.verify()` to validate the token's signature and expiration.
    *   If the token is valid, it decodes the payload (`userId`, `role`, etc.) and attaches it to the `req` object (e.g., `req.user`).
    *   If the token is invalid or missing, it sends a `401 Unauthorized` or `403 Forbidden` error.

2.  **`checkRole.js` Middleware:**
    *   This is a more granular middleware that checks if the authenticated user's role is allowed to access a specific endpoint.
    *   **Usage Example:** `router.delete('/residents/:id', verifyToken, checkRole(['Barangay Captain', 'Super Admin']), residentsController.deleteResident);`

### Phase 2: Frontend (React) - The User Experience

#### Step 2.1: Login Page

*   Create a new page component `client/src/pages/Login.jsx`.
*   This will be a simple form with "Username" and "Password" fields.
*   On submit, it will call the `/api/auth/login` endpoint.
*   Upon successful login, it must store the received JWT securely in the browser (e.g., `localStorage` or `sessionStorage`).

#### Step 2.2: Global Auth State (React Context)

*   Create an `AuthContext` to provide authentication state to the entire application.
*   The context will expose:
    *   `token`: The JWT.
    *   `user`: An object containing user details like `username` and `role`.
    *   `isAuthenticated`: A boolean flag.
    *   `login()` and `logout()` functions.

#### Step 2.3: Protected Routes

*   Create a wrapper component, `<ProtectedRoute />`.
*   This component will check `isAuthenticated` from the `AuthContext`.
*   If `true`, it renders the child component (e.g., `<Dashboard />`).
*   If `false`, it redirects the user to the `/login` page.

#### Step 2.4: Role-Based UI Rendering

*   Use the `user.role` from the `AuthContext` to conditionally render UI elements.
*   **Example (in `Sidebar.jsx`):**
    ```jsx
    const { user } = useAuth(); // from AuthContext

    {/* ... other links */}
    {(user.role === 'Barangay Captain' || user.role === 'Super Admin') && (
      <Link to="/census">Census</Link>
    )}
    ```

### Phase 3: Initial Data Seeding

We need to populate the database with the initial roles and a Super Admin account.

*   **Create a Knex seed file:**
    1.  Insert the four roles (`Super Admin`, `Barangay Captain`, `Barangay Staff`, `Tanod`) into the `roles` table.
    2.  Create a default `superadmin` user with a temporary, secure password that should be changed on first login.

---

## 4. Action Plan

1.  **Setup Backend:** Install necessary dependencies in the `/server` directory: `npm install jsonwebtoken bcryptjs dotenv knex mysql`.
2.  **Database Migrations:** Create and run the Knex migrations for the `roles` and `users` tables.
3.  **Database Seeding:** Create and run the Knex seed file to populate initial data.
4.  **Build Backend Endpoints:** Implement the `/login` endpoint and the authentication/authorization middleware.
5.  **Refactor Backend Routes:** Apply the new middleware to all existing protected routes.
6.  **Build Frontend:** Create the `Login` page, `AuthContext`, and `ProtectedRoute` component.
7.  **Refactor Frontend:** Wrap all necessary routes in `ProtectedRoute` and implement role-based UI changes.