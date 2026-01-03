# Naming Conventions Guide

## Overview
This document standardizes naming conventions across the ClearPass Barangay Management System.

## Database Naming (MySQL)

### Tables
- **Format:** `snake_case` with lowercase
- **Examples:** `residents`, `blotter`, `certificates_log`, `community_programs`

### Columns
- **Format:** `PascalCase` for legacy tables, `snake_case` for new tables
- **Legacy Examples:** `Resident_ID`, `First_Name`, `Last_Name`, `Household_ID`
- **New Examples:** `created_at`, `updated_at`, `is_active`
- **Note:** Maintain consistency within each table

### Primary Keys
- **Format:** `TableName_ID` (legacy) or `id` (new)
- **Examples:** `Resident_ID`, `Household_ID`, `id`

### Foreign Keys
- **Format:** Match referenced table's primary key
- **Examples:** `resident_id`, `household_id`, `sitio_id`

### Indexes
- **Format:** `idx_tablename_columnname`
- **Examples:** `idx_residents_household`, `idx_blotter_status`

## JavaScript/Node.js Naming

### Variables & Functions
- **Format:** `camelCase`
- **Examples:** `residentId`, `getUserData()`, `calculateAge()`

### Constants
- **Format:** `UPPER_SNAKE_CASE`
- **Examples:** `JWT_SECRET`, `DB_HOST`, `MAX_LOGIN_ATTEMPTS`

### Classes
- **Format:** `PascalCase`
- **Examples:** `MigrationManager`, `AppError`, `AuthController`

### Files
- **Format:** `camelCase` for modules, `PascalCase` for classes
- **Examples:** `authMiddleware.js`, `errorHandler.js`, `MigrationManager.js`

## API Routes

### Endpoints
- **Format:** `kebab-case` with lowercase
- **Examples:** `/api/residents`, `/api/blotter`, `/api/certificate-types`

### Query Parameters
- **Format:** `snake_case`
- **Examples:** `?page=1&limit=50&search=john&sitio_id=5`

### Path Parameters
- **Format:** `camelCase` or descriptive names
- **Examples:** `/api/residents/:id`, `/api/blotter/:caseNumber`

## Environment Variables

### Format
- **Format:** `UPPER_SNAKE_CASE`
- **Examples:** `DB_HOST`, `JWT_SECRET`, `NODE_ENV`, `SERVER_PORT`

## React/Frontend Naming

### Components
- **Format:** `PascalCase`
- **Examples:** `ResidentList`, `BlotterForm`, `DashboardCard`

### Props
- **Format:** `camelCase`
- **Examples:** `residentData`, `onSubmit`, `isLoading`

### State Variables
- **Format:** `camelCase`
- **Examples:** `residents`, `isLoading`, `selectedResident`

### Event Handlers
- **Format:** `handle` + `PascalCase`
- **Examples:** `handleSubmit`, `handleDelete`, `handleInputChange`

## File Structure

### Folders
- **Format:** `lowercase` or `kebab-case`
- **Examples:** `middleware/`, `controllers/`, `routes/`, `utils/`

### Route Files
- **Format:** `camelCase` + `Routes.js`
- **Examples:** `adminRoutes.js`, `residentRoutes.js`, `certificateRoutes.js`

### Middleware Files
- **Format:** Descriptive `camelCase`
- **Examples:** `authMiddleware.js`, `errorHandler.js`, `validation.js`

## SQL Queries

### Aliases
- **Format:** Short lowercase letters
- **Examples:** `r` for residents, `h` for households, `s` for sitios

```sql
SELECT r.*, h.Household_Number, s.name as sitio_name
FROM residents r
LEFT JOIN households h ON r.Household_ID = h.Household_ID
LEFT JOIN sitios s ON h.Sitio_ID = s.id
```

## Migration Files

### Format
- **Format:** `###_descriptive_name.sql`
- **Examples:** `001_add_performance_indexes.sql`, `002_create_audit_table.sql`

## Log Files

### Format
- **Format:** `lowercase` + `.log`
- **Examples:** `error.log`, `combined.log`, `audit.log`

## Best Practices

1. **Consistency:** Use the same naming convention throughout a module
2. **Descriptive:** Names should clearly indicate purpose
3. **Avoid Abbreviations:** Use full words unless commonly understood
4. **Boolean Prefixes:** Use `is`, `has`, `can` for boolean variables
   - Examples: `isActive`, `hasPermission`, `canEdit`
5. **Array Plurals:** Use plural names for arrays
   - Examples: `residents`, `certificates`, `blotterRecords`
6. **Avoid Reserved Words:** Don't use SQL or JavaScript reserved keywords

## Migration Strategy

### Legacy to New
When updating legacy code:
1. Keep existing database column names for compatibility
2. Map to camelCase in JavaScript layer
3. Document mapping in API responses

### Example Mapping
```javascript
// Database: Resident_ID, First_Name, Last_Name
// API Response: residentId, firstName, lastName
const mapResident = (dbRow) => ({
  residentId: dbRow.Resident_ID,
  firstName: dbRow.First_Name,
  lastName: dbRow.Last_Name
});
```

## Enforcement

- Use ESLint for JavaScript naming
- Code review checklist includes naming conventions
- Document exceptions with comments
