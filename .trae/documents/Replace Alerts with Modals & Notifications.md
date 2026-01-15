# Replace Browser Alerts with Modals and Notifications

## 1. Unified Notification Service
Extend the existing `NotificationContext` to support global client-side toast notifications (Snackbars), replacing `window.alert()` calls for general messages.

- **Modify `client/src/contexts/NotificationContext.jsx`**:
  - Add `Snackbar` and `Alert` components from Material UI.
  - Implement `notify(message, severity)` function.
  - Expose `notify` via the context.

## 2. specialized Modal Components
Create dedicated modal components to replace specific complex alerts in `Residents.jsx`.

- **Create `client/src/components/QRCodeModal.jsx`**:
  - **Purpose**: Display the generated QR code string/image.
  - **Features**: 
    - Large, clear display of the QR code (text/hash).
    - "Print" button to trigger the print window.
    - "Close" button.
  
- **Create `client/src/components/CredentialsModal.jsx`**:
  - **Purpose**: Display new resident credentials (ID, Email, Temp Password).
  - **Features**:
    - formatted display of sensitive info.
    - "Copy to Clipboard" or clear instruction text.

## 3. Refactor `Residents.jsx`
Update the residents page to use the new components and service.

- **Import**: `useNotifications`, `QRCodeModal`, `CredentialsModal`.
- **State**: Add state for controlling the new modals (`qrModalOpen`, `credentialsModalOpen`, etc.).
- **Replace**:
  - `alert('File size...')` → `notify('File size...', 'warning')`
  - `alert('Resident updated...')` → `notify('Resident updated...', 'success')`
  - `alert(qrCode)` → Open `QRCodeModal`
  - `alert(credentials)` → Open `CredentialsModal`

## 4. System-Wide Cleanup
Scan and replace other `alert()` usages in the client codebase.

- **`client/src/pages/DocumentVerification.jsx`**: Replace alerts with `notify()`.
- **`client/src/pages/AdminReports.jsx`**: Replace PDF generation alerts with `notify()`.
- **`client/src/pages/Blotter.jsx`**: Refactor local Snackbar to use the global `notify()` for consistency (optional but recommended).

## 5. Verification
- Verify QR code modal opens and displays data correctly.
- Verify new resident credentials modal appears.
- Verify validation warnings appear as toast notifications instead of blocking alerts.
