# ❌ AUTH SYSTEM MISALIGNMENT DETECTED

## Critical Issues Found

### 1. Dual Role System Conflict
**Problem:** Users table has BOTH `role` and `role_id` columns with different values

| User | role (THEMIS) | role_id (FK to roles table) | Status |
|------|---------------|----------------------------|---------|
| superadmin | 1 (IT Admin) | 5 | ❌ MISMATCH |
| captain | 5 (Captain) | 2 | ❌ MISMATCH |
| secretary | 6 (Secretary) | 3 | ❌ MISMATCH |
| clerk | 2 (Clerk) | 4 | ❌ MISMATCH |
| officer | 3 (Blotter Officer) | 6 | ❌ MISMATCH |

### 2. Backend Expects `role_id` (Foreign Key)
```javascript
// authController.js line 19
const [users] = await db.execute(`
  SELECT u.*, r.role_name, r.hierarchy_level, r.permissions 
  FROM users u 
  LEFT JOIN roles r ON u.role_id = r.id  // ← Uses role_id
  WHERE u.username = ? AND u.is_active = TRUE`,
  [username]
);
```

### 3. Frontend Expects `role` (THEMIS 1-6)
```javascript
// AuthContext.jsx
setUser(userData.user || userData);  // Expects user.role
```

### 4. Routes Use Mixed Approach
```javascript
// routes.js uses ROLES constants (1-6)
verifyRole([ROLES.ADMIN])  // ROLES.ADMIN = 1
verifyRole([ROLES.CAPTAIN]) // ROLES.CAPTAIN = 5

// But authMiddleware checks role_id from database
```

---

## Root Cause

**Two competing role systems:**
1. **THEMIS CLEARPASS** (column: `role`, values: 1-6)
2. **Legacy Roles Table** (column: `role_id`, FK to `roles.id`, values: 2,3,4,5,6,12)

---

## Solution Options

### Option 1: Use THEMIS System Only (RECOMMENDED)
**Remove `role_id` dependency, use `role` column exclusively**

**Pros:**
- Simpler system
- No foreign key constraints
- Matches your THEMIS documentation
- Frontend already expects this

**Cons:**
- Lose roles table metadata (permissions, descriptions)

### Option 2: Map THEMIS to Roles Table
**Keep both, but sync them properly**

**Mapping:**
```
THEMIS role → roles.id
1 (IT Admin) → 5
2 (Clerk) → 4
3 (Blotter Officer) → 6
4 (Resident) → 12
5 (Captain) → 2
6 (Secretary) → 3
```

**Pros:**
- Keep roles table for permissions
- Maintain referential integrity

**Cons:**
- More complex
- Need to maintain mapping

---

## Recommended Fix (Option 1)

### Step 1: Update authController.js
```javascript
// Change FROM
const [users] = await db.execute(`
  SELECT u.*, r.role_name, r.hierarchy_level, r.permissions 
  FROM users u 
  LEFT JOIN roles r ON u.role_id = r.id 
  WHERE u.username = ? AND u.is_active = TRUE`,
  [username]
);

// TO
const [users] = await db.execute(`
  SELECT u.*, 
    CASE u.role 
      WHEN 1 THEN 'IT Admin'
      WHEN 2 THEN 'Clerk'
      WHEN 3 THEN 'Blotter Officer'
      WHEN 4 THEN 'Resident'
      WHEN 5 THEN 'Captain'
      WHEN 6 THEN 'Secretary'
    END as role_name,
    u.role as hierarchy_level
  FROM users u 
  WHERE u.username = ? AND u.is_active = TRUE`,
  [username]
);
```

### Step 2: Update authMiddleware.js
```javascript
// Change role_id checks to role checks
if (req.user.role && allowedRoles.includes(req.user.role)) {
  return next();
}
```

### Step 3: Remove role_id Foreign Key
```sql
ALTER TABLE users DROP FOREIGN KEY users_ibfk_role_id;
ALTER TABLE users DROP COLUMN role_id;
```

### Step 4: Update JWT Token
```javascript
// authController.js
const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username, 
    role: user.role,  // Use role instead of role_id
    role_name: user.role_name
  },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

---

## Current State Summary

### ❌ What's Broken:
1. Backend queries `role_id` but routes check `role`
2. Users have mismatched `role` and `role_id` values
3. JWT token contains `role_id` but frontend expects `role`
4. verifyRole middleware checks wrong column

### ✅ What Works:
- Database structure exists
- THEMIS role values (1-6) are set correctly in `role` column
- Frontend AuthContext ready for `role` field

---

## Next Steps

**Choose your approach:**
1. **Quick Fix:** I can implement Option 1 (THEMIS only) - removes complexity
2. **Complete Fix:** I can implement Option 2 (mapping) - keeps roles table

**Which do you prefer?**
