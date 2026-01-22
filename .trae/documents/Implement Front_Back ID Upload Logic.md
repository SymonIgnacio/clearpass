# Implement Front and Back ID Upload for Beneficiaries

## Problem Analysis
The user requires a UI update to support uploading both Front and Back images for PWD, Senior Citizen, and Solo Parent IDs. The current implementation only allows a single file upload per beneficiary type.

## Implementation Plan

### 1. Frontend Updates (`ResidentProfile.jsx`)
-   **UI Enhancement**: Replace the standard file input with a better UI (using `Button` with `CloudUpload` icon).
-   **State Management**: Update `beneficiaryFiles` state to handle nested objects or distinct keys for front/back (e.g., `Is_PWD_File_Front`, `Is_PWD_File_Back`).
-   **Render Logic**:
    -   For **PWD**, **Senior**, and **Solo Parent**: Show two upload buttons (Front ID, Back ID).
    -   For **4Ps** and **OSY**: Keep single upload (or clarify if they also need two; assuming single based on "ID" context vs "Certification").
-   **Submission**: Update `handleSaveBeneficiaryStatus` to append the new file keys to `FormData`.

### 2. Backend Updates
-   **Routes (`residentProfileRoutes.js`)**:
    -   Update `upload.fields` configuration to accept the new field names:
        -   `Is_PWD_File_Front`, `Is_PWD_File_Back`
        -   `Is_Senior_File_Front`, `Is_Senior_File_Back`
        -   `Is_Solo_Parent_File_Front`, `Is_Solo_Parent_File_Back`
        -   Keep `Is_4Ps_File` and `Is_Out_of_School_Youth_File` as is (single file).

-   **Controller (`residentProfileController.js`)**:
    -   Update `updateBeneficiaryStatus` to check for and process the new file keys.
    -   Save documents with descriptive types:
        -   "PWD ID (Front)", "PWD ID (Back)"
        -   "Senior ID (Front)", "Senior ID (Back)"
        -   "Solo Parent ID (Front)", "Solo Parent ID (Back)"

## Verification
-   **UI Check**: Verify that checking PWD/Senior/Solo Parent shows two upload buttons.
-   **Upload Test**: Upload files for both front and back and submit.
-   **Database Check**: Verify that two records are created in `resident_documents` for the user.
