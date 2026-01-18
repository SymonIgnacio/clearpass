I have confirmed the database schema and aligned the workflow with your requirements.

### Final Plan

**1. Backend Updates (`server/routes/residentAuthRoutes.js`)**

* **Update** **`/register`**:

  * **Action**: Create a record in `resident_applications` (instead of `residents`) with the personal details and status `'pending'`.

  * **Action**: Create a `users` record (Role 13) linked to this email. `resident_id` will be left `NULL` to indicate they are not yet a full resident.

  * **Cookie**: Set the HTTP-only `authToken` cookie immediately so the user is logged in.

* **Update** **`/login`**:

  * **Logic Change**: Allow login for users who exist in the `users` table but do not have a `residents` record yet.

  * **Profile Check**: If `resident_id` is missing, check the `resident_applications` table to return the application status (e.g., "pending").

  * **Cookie**: Set the HTTP-only `authToken` cookie.

**2. Frontend Updates**

* **`client/src/pages/ResidentRegister.jsx`**:

  * Add **Street Address** (Text) and **Sitio** (Dropdown) fields.

  * Submit these details to the updated `/register` endpoint.

  * Remove the manual `document.cookie` code.

* **`client/src/pages/ResidentDashboard.jsx`**:

  * Update the dashboard to handle the "Guest" state (Role 13 with no resident profile).

  * It will check the application status:

    * **Pending**: Prompt the user to "Upload Proof of Residency" (Bill/ID) if they haven't already, or show "Under Review" if they have.

**3. Verification**

* Register a new user -> Confirm successful login.

* Check Database -> User exists, `resident_applications` has data, `residents` is empty.

* Check Dashboard -> Shows "Account Under Review" / "Upload Proof".

* Log out and Log in -> Works successfully.

