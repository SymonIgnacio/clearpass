I have identified the issue causing the crash.

### **Root Cause: Syntax Error**
The logs show `TypeError: Failed to fetch dynamically imported module`. This typically happens when there is a syntax error in the file, preventing the browser from parsing it.

Looking at my last edit to `ResidentDashboard.jsx`:
```javascript
// ... inside component ...
                    ) : (
                      <List dense>
 import Visibility from '@mui/icons-material/Visibility';
 
 // ... inside component ...
 
   const openMyDocument = async (docId, fileName, source) => {
```
I accidentally pasted the `import` statement and the helper function definition *inside* the JSX render block of the `ResidentDashboard` component, breaking the file structure.

### **Fix Plan**
1.  **Move Import:** Move `import Visibility from '@mui/icons-material/Visibility';` to the top of the file.
2.  **Move Function:** Move `openMyDocument` function definition to the component body (before `return`), alongside other handler functions.
3.  **Clean JSX:** Ensure the JSX structure is correct and only contains the rendering logic.

I will correct the file structure immediately.