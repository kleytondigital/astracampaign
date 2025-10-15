@echo off
REM ==========================================
REM Script de Build e Push para Easypanel
REM ==========================================

echo.
echo ==========================================
echo  BUILD E PUSH - EASYPANEL
echo ==========================================
echo.

REM Solicitar nome do registry
set /p REGISTRY="Digite o nome do seu registry (ex: seu-usuario): "
echo.

REM Verificar se foi fornecido
if "%REGISTRY%"=="" (
    echo Erro: Nome do registry nao pode estar vazio!
    pause
    exit /b 1
)

REM Solicitar tag (default: latest)
set /p TAG="Digite a tag (pressione Enter para 'latest'): "
if "%TAG%"=="" set TAG=latest
echo.

echo ==========================================
echo  CONFIGURACAO
echo ==========================================
echo Registry: %REGISTRY%
echo Tag: %TAG%
echo.
echo Backend Image: %REGISTRY%/astra-backend:%TAG%
echo Frontend Image: %REGISTRY%/astra-frontend:%TAG%
echo.
pause

REM ==========================================
REM BUILD BACKEND
REM ==========================================
echo.
echo ==========================================
echo  BUILDING BACKEND...
echo ==========================================
cd backend
docker build -t %REGISTRY%/astra-backend:%TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro no build do backend!
    cd ..
    pause
    exit /b 1
)

cd ..
echo Backend build concluido!

REM ==========================================
REM BUILD FRONTEND
REM ==========================================
echo.
echo ==========================================
echo  BUILDING FRONTEND...
echo ==========================================
cd frontend
docker build -t %REGISTRY%/astra-frontend:%TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro no build do frontend!
    cd ..
    pause
    exit /b 1
)

cd ..
echo Frontend build concluido!

REM ==========================================
REM PUSH IMAGES
REM ==========================================
echo.
echo ==========================================
echo  FAZENDO LOGIN NO DOCKER REGISTRY
echo ==========================================
echo.
docker login

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro no login do Docker!
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  PUSHING BACKEND...
echo ==========================================
docker push %REGISTRY%/astra-backend:%TAG%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro no push do backend!
    pause
    exit /b 1
)

echo Backend push concluido!

echo.
echo ==========================================
echo  PUSHING FRONTEND...
echo ==========================================
docker push %REGISTRY%/astra-frontend:%TAG%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Erro no push do frontend!
    pause
    exit /b 1
)

echo Frontend push concluido!

REM ==========================================
REM SUCESSO
REM ==========================================
echo.
echo ==========================================
echo  SUCESSO!
echo ==========================================
echo.
echo Imagens disponiveis:
echo - %REGISTRY%/astra-backend:%TAG%
echo - %REGISTRY%/astra-frontend:%TAG%
echo.
echo Agora voce pode usar essas imagens no Easypanel!
echo.
pause



