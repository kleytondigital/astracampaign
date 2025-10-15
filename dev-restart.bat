@echo off
echo ========================================
echo    ASTRA CAMPAIGN - RESTART DESENVOLVIMENTO
echo ========================================

echo [1/4] Parando servicos Node.js...
taskkill /f /im node.exe >nul 2>&1

echo [2/4] Aguardando...
timeout /t 2 /nobreak >nul

echo [3/4] Iniciando Backend...
start "Astra Campaign Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [4/4] Iniciando Frontend...
start "Astra Campaign Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   DESENVOLVIMENTO REINICIADO!
echo ========================================
echo.
echo URLs:
echo   Frontend: http://localhost:3006
echo   Backend:  http://localhost:3001
echo   WAHA API: http://localhost:3000
echo.
echo Credenciais de Teste:
echo   Email: admin@empresa-teste.com
echo   Senha: Admin123
echo.
pause

