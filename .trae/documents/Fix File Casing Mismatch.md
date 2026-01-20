# Fix File Casing Mismatch

I have confirmed that the actual file name on disk is `aiAnalyticsController.js` (camelCase).
However, `adminRoutes.js` is trying to import it as `AIAnalyticsController.js` (PascalCase), which causes a case-sensitivity conflict with `aiRoutes.js`.

## Plan
1.  **Update `server/routes/adminRoutes.js`**:
    *   Change the import line from:
        `const AIAnalyticsController = require('../controllers/AIAnalyticsController');`
    *   To:
        `const AIAnalyticsController = require('../controllers/aiAnalyticsController');`

This will resolve the linter error and ensure consistent file referencing across the project.
