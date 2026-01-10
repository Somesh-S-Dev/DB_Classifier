@echo off
echo Starting ClassifyStudio...
:: 1. Verify Node module dependencies are installed
echo Checking and installing Node module dependencies...
if exist "backend\node_modules" (
    echo Backend dependencies found, skipping installation...
) else (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if exist "frontend\node_modules" (
    echo Frontend dependencies found, skipping installation...
) else (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: 2. Open two Windows Terminal tabs: one for backend and one for frontend
echo Launching backend and frontend in Windows Terminal...
wt -d "%~dp0backend" cmd /k "npm run dev" ; nt -d "%~dp0frontend" cmd /k "npm run dev"

echo Both processes are starting in same windows.
:: 3. Wait for 5 seconds
echo Waiting 5 seconds for servers to initialize...
timeout /t 5 /nobreak > nul

:: 4. Open the browser to your frontend port
echo Opening browser...
start http://localhost:5173

echo Done. Backend and Frontend are running in the background.
pause
