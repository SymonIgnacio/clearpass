I will implement the auto-login flow and verification modal requirement.

### 1. Backend: Enable Auto-Login on Registration
*   **File**: `server/routes/residentAuthRoutes.js`
*   **Action**: Modify the `/register` endpoint to generate a JWT token upon successful registration (replicating the logic from the `/login` endpoint).
*   **Details**: Return the `token` and `user` object in the JSON response.

### 2. Frontend: Handle Auto-Login
*   **File**: `client/src/pages/ResidentRegister.jsx`
*   **Action**: Update `handleSubmit` to process the successful registration response.
    *   Save the received `token` to `document.cookie`.
    *   Call `refreshUser()` from the `AuthContext` to update the global application state.
    *   Navigate to `/resident/dashboard` with a state flag `{ showVerification: true }`.

### 3. Frontend: Verification Modal
*   **File**: `client/src/pages/ResidentDashboard.jsx`
*   **Action**:
    *   Add a `Dialog` (Modal) component that prompts for "Proof of Residency".
    *   Trigger this modal if the user's `Residency_Status` is "Pending Verification" or if the navigation state flag is present.
    *   Implement the file upload logic using the existing `uploadVerification` utility from `api.js`.
