I will remove the unwanted Sitios ("Hilltop", "New Site", "Old Site", "Riverside") from the system.

**1. Update Data Generation Script**

* Modify `server/scripts/generate_comprehensive_data.js` to remove these names from the `SITIOS` array. This prevents them from being re-added if you run this script in the future.

**2. Clean Up Database**

* Create a temporary script `server/scripts/cleanup_sitios.js` to delete these specific entries from the `sitios` table in your current database.

* Execute this script to immediately remove them from the dropdown.

* Delete the temporary script after execution.

**Verification**

* I will confirm the cleanup script runs successfully.

* You can verify by checking the dropdown again (a refresh might be needed).

