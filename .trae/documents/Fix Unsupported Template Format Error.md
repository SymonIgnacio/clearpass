The user confirmed that templates are stored in the database. The `seed_templates.cjs` script correctly sets the `file_encoding` to `application/vnd.openxmlformats-officedocument.wordprocessingml.document` for DOCX files.

However, the `_generateFromTemplate` method is throwing "Unsupported template format". This implies that either:
1.  The `template` object retrieved from the database (or fallback) has a missing/incorrect `file_encoding` or `template_name` that doesn't match the strict check.
2.  The fallback logic `_findLocalTemplate` (which is still used if the DB lookup fails or if we are using a local file as a backup) might not be returning an object with the expected structure (specifically missing `file_encoding` or `template_name`).

### Analysis of the Logic
In `documentController.js`:
```javascript
    const isDOCX =
      template.file_encoding ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      template.file_encoding === 'application/msword' ||
      template.template_name.toLowerCase().endsWith('.docx');
```
If `template.template_name` is "Business Closure" (without `.docx` extension) AND `template.file_encoding` is missing or null, `isDOCX` will be false.

The seed script generates names like "Business Closure" (no extension). So `template.template_name.toLowerCase().endsWith('.docx')` will be **false**.
It relies entirely on `template.file_encoding`.

If the database record for "Business Closure" has a null or different `file_encoding`, the check fails.

### Proposed Fix
I will modify `server/controllers/documentController.js`:
1.  **Loosen the DOCX detection**: If `file_encoding` is missing/null, but we have `file_data`, we should assume it's a DOCX if the name doesn't explicitly say `.pdf`. Or better yet, check the file signature (magic bytes) if possible, but for now, we can add a fallback check.
2.  **Debug Logging**: Add logging to print the template properties to confirm what's actually being passed.
3.  **Ensure Fallback Object Structure**: I will check `_findLocalTemplate` to ensure it returns a proper object with `file_encoding` set to the DOCX mime type, just in case the code falls back to local files (which the user said shouldn't happen, but good to be safe).

**Specific Change to `_generateFromTemplate`**:
I will add a check: if `!isPDF` and `!isDOCX`, but `template.file_data` exists, I will try to treat it as DOCX by default (or check if it starts with 'PK' which indicates a zip/docx).

**Step-by-step Plan:**
1.  Modify `_generateFromTemplate` in `server/controllers/documentController.js` to add a more robust check for DOCX (checking for 'PK' header in buffer or defaulting to DOCX if PDF check fails).
2.  Add `console.log` to inspect `template.file_encoding` and `template.template_name` for debugging.
3.  Modify `_findLocalTemplate` (if I can find the rest of it) to ensure it returns `file_encoding` and `template_name` with `.docx` extension or proper mime type.

I will prioritize making `_generateFromTemplate` smarter.