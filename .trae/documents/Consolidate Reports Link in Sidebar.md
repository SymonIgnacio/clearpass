I will remove the redundant "Reports" link from the **Case Management** section in the sidebar.

To ensure the **Blotter Officer** still has access to the reports (since they might lose the link entirely if I just delete this one), I will also update the **Analytics > Reports** link to be visible to them.

### **Plan**
1.  **Update `client/src/components/Sidebar.jsx`**:
    *   **Remove** the "Reports" item from the `caseManagement` children.
    *   **Update** the "Reports" item under `analytics` to include Role `6` (Blotter Officer) in its `roles` array.

This will result in a cleaner sidebar with a single, centralized "Reports" link under Analytics, accessible to Admins, Secretaries, and Officers.
