@echo off
title Orbit Workspace Server
color 0A

echo.
echo  ============================================
echo   Orbit Workspace Platform
echo  ============================================
echo.

:: Check if node is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Node.js is not installed or not in PATH.
    echo  Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists; if not, install
if not exist "node_modules\" (
    echo  First run: installing dependencies...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo  ERROR: npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

echo  Starting server...
echo  Open http://localhost:3000 in your browser.
echo  Press Ctrl+C to stop.
echo.

node server.js

pause
