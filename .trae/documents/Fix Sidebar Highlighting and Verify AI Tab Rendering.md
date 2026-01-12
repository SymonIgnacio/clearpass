I will fix the UI/navigation issues and ensure the IT Admin (Role 1) has full access to all AI features.

## 1. Fix Sidebar Navigation Highlighting (Sidebar.jsx)
- **Problem:** "Reports" and "AI Insights" are both highlighted because the matching logic is too broad.
- **Fix:** Update `isActive` logic to be strict:
  - "Reports" active ONLY if path is `/reports` AND query string is empty.
  - "AI Insights" active ONLY if path is `/reports?tab=ai`.

## 2. Enable Full Admin Access to AI Pages (App.jsx & Sidebar.jsx)
- **Problem:** The Admin cannot see/access specialized AI pages like "Clerk AI Insights" or "AI Patrol".
- **Fix:**
  - **App.jsx:**
    - Update `/clerk/ai-insights` to allow Role 1 (Admin) in `requiredRoles`.
    - Protect currently open routes (`/ai-dashboard`, `/ai-patrol`, `/ronda-analytics`) with `requiredRoles={[1, 2, 3, 4, 6]}` so only staff (including Admin) can access them.
  - **Sidebar.jsx:**
    - Add new menu items under "Analytics" for these pages so the Admin can actually navigate to them:
      - "Patrol AI" (linked to `/ai-patrol`)
      - "Ronda Analytics" (linked to `/ronda-analytics`)
      - "Clerk Insights" (linked to `/clerk/ai-insights`)
    - Ensure these new items have `roles: [1, ...]` so the Admin sees them.

## 3. Execution Order
1.  Apply Sidebar highlighting fix.
2.  Update App.jsx routing permissions.
3.  Add missing AI pages to the Sidebar menu.
4.  Verify functionality.