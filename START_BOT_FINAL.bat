@echo off
echo Starting Lavka26 Bot with SBP payments...
echo.
echo Checking dependencies...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python first.
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install python-telegram-bot supabase python-dotenv

echo.
echo Starting bot...
python lavka26_admin_sbp.py

pause
