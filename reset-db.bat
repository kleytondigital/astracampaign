@echo off
echo ========================================
echo    ASTRA CAMPAIGN - RESET BANCO DE DADOS
echo ========================================

echo ATENCAO: Isso vai apagar todos os dados!
set /p confirm="Tem certeza? (s/N): "
if /i not "%confirm%"=="s" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo [1/4] Parando servicos...
taskkill /f /im node.exe >nul 2>&1

echo [2/4] Parando containers Docker...
docker-compose -f docker-compose.dev.yml down

echo [3/4] Removendo volumes (dados do banco)...
docker volume rm astracampaign_postgres_dev_data >nul 2>&1
docker volume rm astracampaign_redis_dev_data >nul 2>&1

echo [4/4] Reiniciando servicos...
docker-compose -f docker-compose.dev.yml up -d

echo Aguardando servicos inicializarem...
timeout /t 10 /nobreak >nul

echo Configurando banco de dados...
cd backend
call npm run migrate:prod

echo.
echo Banco de dados resetado com sucesso!
echo.
pause
