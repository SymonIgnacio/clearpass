I have analyzed the system and identified the exact requirements for using your static templates. The system already has a built-in "Document Center" for uploading these files, but they must be prepared with specific placeholders to work correctly.

### **1. File Format Requirements**
*   **Word Files (`.docx`):** **Recommended.** Best for text-heavy documents.
    *   *Note:* Legacy `.doc` files must be saved as `.docx` first.
*   **PDF Files (`.pdf`):** Must be **Fillable PDF Forms (AcroForms)**.
    *   *Warning:* Standard "flat" PDFs (scanned images or regular exports) will **not** work because the system cannot identify where to place the text. You must use a PDF Editor (like Adobe Acrobat or free online tools) to draw "Text Fields" onto the document.

### **2. Template Preparation Guide**

#### **For Word (`.docx`)**
You must replace the dynamic parts of your document (like names and dates) with these exact placeholders:
*   **Syntax:** Use curly braces `{ }`.
*   **Example:** "This certifies that **{resident_name}** is a resident of..."

#### **For PDF Forms**
You must name your text fields exactly matching the variable names below.
*   **Example:** Create a text field and name it `resident_name` (case-sensitive).

### **3. Available Variables (Cheat Sheet)**
Use these exact keys in your templates:

| Category | Variable Name | Description |
| :--- | :--- | :--- |
| **Resident** | `{resident_name}` | Full name (First Middle Last) |
| | `{first_name}` | First name only |
| | `{last_name}` | Last name only |
| | `{age}` | Calculated age |
| | `{gender}` | Male / Female |
| | `{civil_status}` | Single, Married, etc. |
| | `{address}` | Full street address |
| **Document** | `{control_number}` | Unique System ID (e.g., DOC-2023-XYZ) |
| | `{date_issued}` | Format: MM/DD/YYYY |
| | `{valid_until}` | Expiration date |
| | `{purpose}` | The reason for request |
| **Officials** | `{captain_name}` | Current Punong Barangay |
| | `{secretary_name}` | Barangay Secretary |

### **4. Recommended System Improvement**
While reviewing the code, I noticed the system might **crash** if a resident has missing data (e.g., no Middle Name) and your template tries to use it.

**I propose applying a "Safety Patch" to the document generator:**
1.  **Graceful Fallback:** If a variable is empty (like `middle_name`), the system will print an empty space instead of crashing.
2.  **Date Formatting:** Ensure dates always appear in a readable format.

**Shall I proceed with applying this safety patch to `DocumentController.js`?**