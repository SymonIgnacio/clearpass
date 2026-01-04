@echo off
REM Quick Test Runner for Windows
echo.
echo ========================================
echo THEMIS BIOPROFILING - QUICK TEST SUITE
echo ========================================
echo.

cd /d "%~dp0server"

echo Running comprehensive system tests...
echo.

call npm test -- --testPathPattern=system-comprehensive.test.js --verbose --colors

echo.
echo ========================================
echo Test execution completed!
echo ========================================
echo.

pause
