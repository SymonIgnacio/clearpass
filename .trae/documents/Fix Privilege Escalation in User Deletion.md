# Overlooked Bug: Privilege Escalation via Deletion

I have identified a critical security vulnerability in the Admin system.

## 1. The Vulnerability: Unchecked User Deletion
- **Location**: `server/controllers/adminController.js`
- **The Issue**: The `deleteUser` and `deleteStaff` functions **do not check role hierarchy**.
    - The `createStaff` and `updateStaff` functions correctly check if the requester has a higher rank than the target.
    - However, `deleteStaff` just deletes the record.
- **The Scenario**: If you have a lower-level admin (e.g., Level 2), they could technically send a request to delete a Super Admin (Level 1), and the system would allow it.
- **Severity**: High. This allows a compromised or malicious lower-level staff account to take down the entire system administration.

## 2. The Fix: Enforce Hierarchy in Deletion
- I will modify `deleteUser` and `deleteStaff` to include the same hierarchy checks found in `updateStaff`.
- Logic:
    1.  Get Requester's Level.
    2.  Get Target User's Role Level.
    3.  If Requester Level >= Target Level, **DENY** the deletion.

## Plan Execution
1.  **File**: `server/controllers/adminController.js`
2.  **Action**: Update `deleteUser` and `deleteStaff` to enforce hierarchy checks.

This ensures that no one can delete a user who outranks them.
