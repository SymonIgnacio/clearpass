I have identified the cause of the React error and the missing function issue.

### **Root Causes**
1.  **React Error (`Objects are not valid as a React child`):**
    *   In `DocumentVerification.jsx` and `BeneficiaryValidation.jsx`, the `notify()` function is receiving an error *object* (e.g., `{ message: "...", code: 400 }`) instead of a string. React cannot render objects directly, causing the crash.
2.  **Missing Function in `Settings.jsx`:**
    *   `Settings.jsx` tries to use `addNotification`, but the `NotificationContext` only exports `notify`.

### **Implementation Plan**

#### **1. Fix `DocumentVerification.jsx`**
*   Update all `notify(data.error, ...)` calls to safe string access: `notify(data.error?.message || data.error || 'Error message', 'error')`.

#### **2. Fix `BeneficiaryValidation.jsx`**
*   Apply the same fix for `notify(data.error, ...)` calls.

#### **3. Fix `Residents.jsx`**
*   Ensure error messages passed to `notify` are strictly strings (e.g., handling `error.error` safely).

#### **4. Fix `Settings.jsx`**
*   Replace `addNotification` with `notify`.
*   Refactor usage from object-style `addNotification({ type, message })` to argument-style `notify(message, type)`.

This will resolve the crash immediately and fix the "addNotification is not a function" error.