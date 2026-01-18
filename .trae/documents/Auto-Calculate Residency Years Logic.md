I have identified the logic gap and prepared a fix.

### **New Feature: Auto-Calculate "Years of Residency"**
Currently, the system relies on manual input for this. I will automate it by pulling the `Date_Arrival` from the resident's profile and calculating the difference from today's date.

**Implementation Plan:**
1.  **Fetch Data**: Update `DocumentController.js` to retrieve `Date_Arrival` from the database.
2.  **Calculate Logic**:
    *   `{residency_years}`: Calculates `(Current Year) - (Arrival Year)`.
    *   `{residency_since}`: Displays the exact date or year of arrival (e.g., "January 15, 2010").
    *   *Fallback*: If the resident has no `Date_Arrival` recorded, it will default to "N/A" (or you can manually edit it in the Word file later).

3.  **Update Guide**: Add these two new auto-calculated variables to `TEMPLATE_VARIABLES.md`.

Shall I proceed with automating the residency calculation?