@echo off
echo Starting ClassifyStudio...

:: Start Backend
::start "Backend Server" cmd /c "cd /d %~dp0backend && npm run dev"

:: Start Frontend
::start "Frontend Client" cmd /c "cd /d %~dp0frontend && npm run dev"

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
