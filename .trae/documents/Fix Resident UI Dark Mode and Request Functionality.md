I will address the gaps identified in the Resident side, covering visual issues, functional bugs, and data misalignment.

### 1. Fix Visual & Functional Issues (UI/UX)
*   **"My Certificates" Dark Mode**:
    *   **File**: `client/src/pages/ResidentCertificates.jsx`
    *   **Fix**: Remove the hardcoded `bgcolor: 'grey.100'` from the table header and replace it with a theme-aware color (`action.hover` or `background.paper`) to ensure it looks correct in dark mode.
*   **"Request Certificate" Broken UI**:
    *   **File**: `client/src/pages/CertificateRequest.jsx`
    *   **Fix 1 (Broken Dropdown)**: Add explicit `labelId` and `id` props to the `Select` and `InputLabel` components to fix the collapsed layout and "S..." glitch. Ensure the container has a minimum height.
    *   **Fix 2 (Dark Mode)**: Replace hardcoded light hex colors (`#f8f9fa`, `#fafafa`) with theme tokens (`background.neutral` or `background.paper`) to prevent glaring white boxes in dark mode.
    *   **Fix 3 (Empty State)**: Add a user-friendly "No templates available" message or "Loading..." state if the templates fail to fetch, preventing a broken empty dropdown.

### 2. Fix Data & Schema Misalignment (Logic)
*   **Resident Profile Sync**:
    *   **File**: `client/src/pages/ResidentProfile.jsx`
    *   **Gap**: The profile form includes a "Mobile Number" field, but the `residents` database table renamed this column to `Email`. This causes the field to be empty or fail to save.
    *   **Fix**: Remove the "Mobile Number" field from the UI and state to align with the current database schema, relying on `Email` as the primary contact method.
*   **Dashboard Profile Completion**:
    *   **File**: `client/src/pages/ResidentDashboard.jsx`
    *   **Gap**: The "Profile Completion" calculation expects a `Mobile_Number` field, causing the percentage to never reach 100%.
    *   **Fix**: Remove `Mobile_Number` from the required fields list in the completion calculation logic.

### 3. Verification
*   I will verify that the "Request Certificate" dropdown renders correctly and is clickable.
*   I will verify that the "My Certificates" table header is legible in dark mode.
*   I will confirm that the Profile page no longer shows the broken "Mobile Number" field.

This plan addresses the reported visual bugs and the underlying data inconsistencies discovered during the gap analysis.