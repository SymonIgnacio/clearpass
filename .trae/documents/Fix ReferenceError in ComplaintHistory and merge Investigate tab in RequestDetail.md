I have identified the issues:
1.  **ReferenceError in ComplaintHistory.jsx**: The component uses `<Divider sx={{ my: 2 }} />` inside the expanded row section (line 545), but `Divider` is missing from the `@mui/material` import list (lines 2-34).
2.  **Remove Investigate Tab**: You want to remove the separate "Investigate" tab in `RequestDetail.jsx` and consolidate its contents into the "Decision" tab (or simply remove it if that was the intent, but consolidation ensures workflow continuity). *Correction based on "remove the investigate tab" request*: I will merge the investigation steps/findings into the "Decision" tab to keep the approval workflow valid, as the system requires investigation completion before approval.

### Plan
1.  **Fix ComplaintHistory.jsx**:
    -   Add `Divider` to the import statement from `@mui/material`.

2.  **Update RequestDetail.jsx**:
    -   Remove the "Investigate" tab (index 2) from the `Tabs` list.
    -   Move the **Investigation Checklist** and **Investigation Findings** sections from `case 2` (Investigate) into `case 3` (Decision).
    -   Update the logic to render this combined content when the "Decision" tab is active.
    -   Renumber the tabs so "Decision" becomes index 2.

This will fix the crash on the resident side and streamline the officer's view by combining investigation and decision-making.