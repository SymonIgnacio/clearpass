---
name: "clearpass-ops"
description: "Operational guide for ClearPass: Database access, health checks, and progress tracking. Invoke when checking system status or debugging DB issues."
---

# ClearPass Operations Guide

This skill provides the specific operational commands and context for the ClearPass system.

## 1. Database Access (MySQL)

**Executable Path:** `C:\xampp\mysql\bin\mysql.exe`
**Database Name:** `barangay_management`
**User:** `root` (No password)

**Command to Connect:**
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -D barangay_management
```

**Health Check / Status Command:**
Run this command to get a snapshot of Users, Residents, Applications, Documents, and Blotter Cases:
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -D barangay_management -e "SELECT 'Users by Role' as metric, role, COUNT(*) as count FROM users GROUP BY role; SELECT 'Residents by Status' as metric, Residency_Status, COUNT(*) as count FROM residents GROUP BY Residency_Status; SELECT 'Applications by Status' as metric, status, COUNT(*) as count FROM resident_applications GROUP BY status; SELECT 'Total Documents' as metric, 'All', COUNT(*) as count FROM resident_documents UNION SELECT 'Total App Docs', 'All', COUNT(*) FROM application_documents; SELECT 'Blotter Cases' as metric, status, COUNT(*) as count FROM blotter GROUP BY status;"
```

## 2. Project Structure & Key Files

**Root Directory:** `c:\xampp\htdocs\clearpass`

### Backend
- **Routes:** `server/routes/`
  - `secretaryRoutes.js`: Verification & Application Approval logic.
  - `residentAuthRoutes.js`: Resident login & profile endpoints.
  - `adminController.js`: User management & role transitions.
- **Controllers:** `server/controllers/`
  - `authController.js`: JWT issuance, `/me` endpoint, Session management.

### Frontend
- **Pages:** `client/src/pages/`
  - `ResidentDashboard.jsx`: Main resident UI (Status tracking).
  - `admin/ResidencyVerification.jsx`: Document review UI.
  - `DocumentVerification.jsx`: Application review UI.

## 3. Progress Tracking

**Context File:** `SYSTEM_PROGRESS_CONTEXT.md`
- Located in the root directory.
- Contains the latest system status, architecture snapshot, and recent critical fixes.
- **Read this file first** when starting a new session to understand the current state.

## 4. Development Commands

**Start All Services:**
```powershell
npm run dev:all
```
*Starts Frontend (5174), Backend (3002), and AI Service.*

## 5. Common Debugging Steps

**User State Mismatch (Guest vs Resident):**
1. Check `users` table for `role` and `resident_id`.
2. Check `residents` table for `Residency_Status`.
3. Ensure `resident_applications` status is `approved`.
4. If mismatch exists, verify `secretaryRoutes.js` promotion logic or run a fix script.

**Dashboard "Pending" Loop:**
- Check `ResidentDashboard.jsx` logic.
- Ensure `verification_status` in `resident_documents` matches what the frontend expects (`verified` vs `Approved`).
