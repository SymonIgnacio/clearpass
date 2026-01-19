I will enhance the "My Documents" page to include a details modal and remove the dedicated Notes column.

### **Requirements**
1.  **Clickable Rows**: Make the document rows (or a specific action) clickable to show details.
2.  **Remove Notes Column**: The "Notes" column should be removed from the main table view.
3.  **Details Modal**: Add a modal that displays full details (including the notes) when an item is clicked.
4.  **Action Button**: Add a specific "View Details" action button instead of just clicking the row (as requested: "just add a action button for viewing the details").

### **Implementation Plan**
1.  **Modify `client/src/pages/ResidentDocuments.jsx`**:
    *   **State**: Add `selectedDocument` state to track which document is being viewed.
    *   **Table Structure**:
        *   Remove the `<TableCell>Notes</TableCell>` header.
        *   Remove the `<TableCell>{doc.verification_notes...}</TableCell>` body cell.
        *   Add an "Actions" column header.
        *   Add an "Actions" body cell containing a `Button` or `IconButton` (e.g., with `VisibilityIcon`) to trigger the modal.
    *   **Modal Component**:
        *   Import `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Grid`, `Typography` from MUI.
        *   Create a `Dialog` that opens when `selectedDocument` is not null.
        *   Display all document fields: Type, File Name, Upload Date, Status (using the existing `getStatusChip`), and **Verification Notes** (prominently displayed).
        *   Add a "Close" button in `DialogActions`.

This will clean up the table interface while providing easy access to full details, especially the rejection reasons/notes.