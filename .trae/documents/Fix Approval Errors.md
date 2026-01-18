I will fix the two issues preventing you from approving the application:

1. **Fix the SQL Error**: I will correct the `INSERT` query in `secretaryRoutes.js` because I accidentally added an extra placeholder `?`, causing the "Column count doesn't match" error.
2. **Fix the "Invalid Sitio" Error**: The application uses "Tabing Ilog", but the system can't find it in the database. I will check the valid Sitio names and ensure "Tabing Ilog" exists or update the data to match a valid one.

**Steps:**

1. Check the `sitios` table to see the correct names.
2. Fix the SQL query in `server/routes/secretaryRoutes.js` to match the correct column count.
3. If needed, insert the missing Sitio or correct the application data.

