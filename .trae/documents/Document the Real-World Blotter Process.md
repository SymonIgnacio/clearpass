I will create a documentation file `docs/BLOTTER_WORKFLOW.md` to explain the process and clarify the status definitions.

### **Why you see "Resolved"**
You see "Resolved" because it is a valid status in your **Database Schema**.
*   **Origin**: It was added during the **"Themis Clearpass"** system update (Migration `20250122...`).
*   **Function**: It acts as a generic "Closed" status.
*   **Conflict**: Your current UI prefers the specific legal terms (**Amicably Settled**, **Dismissed**), but since "Resolved" exists in the database, any record with that status will still display it. It effectively serves as an umbrella term for "Case Closed" when a specific legal outcome isn't specified.

### **Documentation Plan**
I will create `docs/BLOTTER_WORKFLOW.md` with:
1.  **Process Map**: Real-world steps (Filing -> Summons -> Mediation -> Action) vs. App steps.
2.  **Status Dictionary**: Defining what each status means and when it is used.
    *   *Resolved*: Generic closed status (Legacy/System).
    *   *Amicably Settled*: Parties agreed to a solution (Katarungang Pambarangay).
    *   *Certificate to File Action Issued*: Mediation failed, ready for court.
    *   *Dismissed*: Case withdrawn/dropped.

This documentation will help align the development team and users on the correct terminology.
