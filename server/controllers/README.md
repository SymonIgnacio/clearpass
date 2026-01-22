# Controllers Directory

This directory contains all business logic controllers following the MVC pattern.

## Controllers Overview

### Core Controllers (2024 Refactoring)

#### residentController.js

- **Purpose**: Resident CRUD operations and management
- **Methods**: 9 admin methods (getAll, getById, create, update, archive, bulkImport, generateQR, checkDuplicate, getHouseholdMembers)
- **Database**: Uses `req.app.locals.db`
- **Features**: Pagination, search, filtering, bulk import from Excel, QR generation

#### householdController.js

- **Purpose**: Household management operations
- **Methods**: 5 methods (getAll, getById, create, update, delete)
- **Features**: Pagination, sitio filtering, member count tracking

#### userController.js

- **Purpose**: User account management
- **Methods**: 7 methods (getAll, getById, create, update, toggleStatus, resetPassword, delete)
- **Features**: Password hashing with bcrypt, role-based access

#### adminController.js

- **Purpose**: Administrative reports and analytics
- **Methods**: 10 report methods (6 summary, 4 detailed)
- **Features**: System-wide statistics, user analytics, blotter reports, certificate tracking

#### blotterController.js

- **Purpose**: Incident/case management
- **Methods**: 4 methods (getAll, create, update, delete)
- **Features**: Case tracking, status workflow, participant management

#### certificateController.js

- **Purpose**: Certificate operations
- **Methods**: 1 method (getAll with role-based filtering)
- **Features**: Role-based data access

### Legacy Controllers (Pre-2024)

#### captainController.js

- **Purpose**: Executive dashboard for Captain role
- **Features**: Population analytics, growth trends, heatmaps
- **Status**: Active, contains critical business logic

#### clerkController.js

- **Purpose**: Certificate issuance with ClearPass validation
- **Features**: Barangay clearance generation, ClearPass logic gate, QR codes
- **Status**: Active, core certificate issuance system

#### authController.js

- **Purpose**: Authentication and authorization
- **Features**: JWT token generation, login, role verification

#### documentController.js

- **Purpose**: Document generation and management
- **Features**: PDF generation, template management

#### templateController.js

- **Purpose**: Certificate template management
- **Features**: Template CRUD, customization

## Architecture Pattern

All controllers follow this pattern:

```javascript
exports.methodName = async (req, res) => {
  const db = req.app.locals.db;
  try {
    // Business logic
    res.json({ data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error message' });
  }
};
```

## Database Access

- All controllers use `req.app.locals.db` for database access
- Transactions use `db.getConnection()` pattern
- Parameterized queries prevent SQL injection

## Error Handling

- Try-catch blocks wrap all async operations
- Errors logged to console
- Consistent error response format
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 404 (Not Found), 500 (Server Error)

## Testing

- Controllers are isolated and testable
- Mock `req.app.locals.db` for unit tests
- Integration tests verify database operations

## Recent Changes (2024)

- Extracted 36 methods from monolithic index.js
- Created 6 new controllers with clean separation of concerns
- Standardized error handling patterns
- Implemented consistent pagination
- Added comprehensive input validation
