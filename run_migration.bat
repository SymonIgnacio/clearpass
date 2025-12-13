@echo off
echo 🔄 Running database migrations...
echo =====================================

cd server
npx knex migrate:latest --knexfile server/knexfile.js

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database migrations completed successfully
) else (
    echo ❌ Database migrations failed
    exit /b 1
)

echo 🌱 Running database seeds...
npx knex seed:run --knexfile server/knexfile.js

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database seeds completed successfully
) else (
    echo ❌ Database seeds failed
    exit /b 1
)

echo 🎉 Database setup completed successfully!
echo.
echo 📋 Next steps:
echo    1. Verify your .env file contains ENABLE_MYSQL_AUTH_STAFF=true
echo    2. Staff login credentials (default password: admin123):
echo       - superadmin (Super Admin)
echo       - captain01 (Barangay Captain)
echo       - secretary01 (Barangay Secretary)
echo       - clerk01 (Barangay Clerk)
echo    3. Run: npm start

pause
