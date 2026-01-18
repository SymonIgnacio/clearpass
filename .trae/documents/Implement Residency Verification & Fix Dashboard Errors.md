I have confirmed the mismatch and identified the cause. The "Residency Verification" menu item in the sidebar currently points to `DocumentVerification.jsx`, which is titled "Registration Applications" and fetches from the `resident_applications` table. This confirms your observation that it's showing the "wrong table" (new registration applications instead of proof of residency uploads for existing users/guests).

### **Revised Plan**

#### **Phase 1: Admin/Secretary Side - Correct "Residency Verification"**
1.  **Rename/Retask Existing Page**: The current `DocumentVerification.jsx` handles *new account applications*. I will leave this as is for now but ensure the sidebar distinguishes it if needed, OR if you want "Residency Verification" to *only* be for proof uploads, I will create a new page and point the sidebar there.
    *   **Decision**: Since you said "the only request that i want to see in the residency verification is the uploaded proof of a guest", I will **create a new page** `ResidencyVerification.jsx` that fetches from `resident_documents` (where `uploadVerification` sends files).
2.  **Create `ResidencyVerification.jsx`**:
    *   **Source**: Fetch from `/api/secretary/resident-documents` (which queries `resident_documents` table).
    *   **Columns**: Resident Name, Document Type (Proof of Residency), Date Uploaded, Status, Actions (Verify/Reject).
    *   **Features**: Preview document, Approve (sets status to 'verified'), Reject (sets status to 'rejected' with reason).
3.  **Update Sidebar**:
    *   Update `Sidebar.jsx` to point "Residency Verification" to this NEW page (`/secretary/residency-verification`).
    *   (Optional) If you want to keep the "Registration Applications" page accessible, I can add a separate menu item for it, or hide it if it's "not needed anymore" as you hinted. I will assume for now we just fix the "Residency Verification" link to show what you asked for.

#### **Phase 2: Guest Side - Fix Errors**
4.  **Fix DOM Nesting Error**:
    *   In `ResidentDashboard.jsx`, locate the `Typography` (rendered as `p`) inside `ListItemText` (which renders a `div` or `span` but can contain `p`). The error logs say `<p>` cannot appear as a descendant of `<p>`.
    *   I will verify `Typography` usage inside other `Typography` components or `ListItemText` `secondary` prop and switch them to `component="span"` or `component="div"`.

#### **Phase 3: Database Verification**
5.  **Verify Data Flow**:
    *   Guest uploads via dashboard -> Hits `/api/residents/verification/upload` -> Inserts into `resident_documents`.
    *   Admin views "Residency Verification" -> Hits `/api/secretary/resident-documents` -> Reads from `resident_documents`.
    *   **Alignment**: This ensures the admin sees exactly what the guest uploaded.

**Verification Plan:**
1.  **Guest**: Upload a file.
2.  **Admin**: Go to "Residency Verification". The new page should load (not "Registration Applications").
3.  **Admin**: You should see the file uploaded by the guest in the table.
4.  **Admin**: Verify it.
5.  **Guest**: Dashboard should reflect the verified status.

I will proceed with creating the new `ResidencyVerification.jsx` and updating the sidebar routing.
