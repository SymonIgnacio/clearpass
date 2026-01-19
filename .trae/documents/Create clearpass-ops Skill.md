I will create a new skill named `clearpass-ops` that encapsulates the specific operational knowledge used in this session.

### **Plan for Skill Creation**
1.  **Create Directory**: `c:\xampp\htdocs\clearpass\.trae\skills\clearpass-ops\`
2.  **Create Skill File**: `c:\xampp\htdocs\clearpass\.trae\skills\clearpass-ops\SKILL.md`
3.  **Define Content**:
    *   **Name**: `clearpass-ops`
    *   **Description**: "Operational guide for ClearPass: Database access, health checks, and progress tracking. Invoke when checking system status or debugging DB issues."
    *   **Details**:
        *   **Database Access**: The exact path to the MySQL executable (`C:\xampp\mysql\bin\mysql.exe`) and the full command to connect.
        *   **Health Check Queries**: The SQL queries used to generate the system status report (counting users, residents, etc.).
        *   **Progress Context**: Reference to `SYSTEM_PROGRESS_CONTEXT.md` for tracking changes.
        *   **Key Directories**: Locations of frontend pages and backend routes.
        *   **Start Commands**: How to start the full stack (`npm run dev:all`).

This skill will serve as a quick-access manual for future sessions to replicate the diagnostic steps we performed today.