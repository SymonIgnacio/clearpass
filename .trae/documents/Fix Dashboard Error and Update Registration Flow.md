I have identified the causes of the error and the code responsible for the registration flow.

### 1. Fix `ReferenceError: requestsData is not defined` in `ResidentDashboard.jsx`
**Problem:** `requestsData` is declared with `const` inside an `if` block, making it inaccessible when calculating stats outside that block.
**Fix:** 
- Declare `let requestsData = [];` before the `if (user.resident_id)` block.
- Update the assignment inside the block to use the existing variable.

### 2. Change Registration Flow in `ResidentRegister.jsx`
**Problem:** The current implementation automatically logs the user in and redirects to the dashboard after registration.
**Fix:**
- Remove the auto-login logic (the `refreshUser` call and navigation to dashboard).
- Instead, simply redirect the user to `/resident/login` after a successful registration.
- I will modify the success handler to show a success message and then navigate to the login page.

I will apply these changes now.