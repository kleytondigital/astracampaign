@echo off
echo ========================================
echo    ASTRA CAMPAIGN - DESENVOLVIMENTO
echo ========================================

echo [1/6] Iniciando servicos Docker...
docker-compose -f docker-compose.dev.yml up -d

echo [2/6] Aguardando servicos inicializarem...
timeout /t 10 /nobreak >nul

echo [3/6] Verificando se PostgreSQL esta pronto...
:wait_postgres
docker exec astra_postgres_dev pg_isready -U astra_dev -d astra_campaign_dev >nul 2>&1
if %errorlevel% neq 0 (
    echo Aguardando PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto wait_postgres
)
echo PostgreSQL pronto!

echo [4/6] Instalando dependencias do Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo [5/6] Instalando dependencias do Frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend!
    pause
    exit /b 1
)

echo [6/6] Configurando banco de dados...
cd ..\backend
call npm run migrate:prod
if %errorlevel% neq 0 (
    echo ERRO: Falha ao configurar banco de dados!
    pause
    exit /b 1
)

echo.
echo Iniciando Backend...
start "Astra Campaign Backend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend...
start "Astra Campaign Frontend" cmd /k "cd ..\frontend && npm run dev"

echo.
echo ========================================
echo   DESENVOLVIMENTO INICIADO!
echo ========================================
echo.
echo URLs:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   WAHA API: http://localhost:3000
echo   Prisma Studio: npx prisma studio (no backend)
echo.
echo Credenciais de Teste:
echo   Email: admin@empresa-teste.com
echo   Senha: Admin123
echo.
echo Para parar Docker: docker-compose -f docker-compose.dev.yml down
echo.
pause
