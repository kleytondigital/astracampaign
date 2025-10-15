@echo off
echo ========================================
echo    ASTRA CAMPAIGN - CONFIGURAR AMBIENTE
echo ========================================

echo Criando arquivo .env para desenvolvimento...

cd backend

echo # ======================================== > .env
echo # ASTRA CAMPAIGN - DESENVOLVIMENTO LOCAL >> .env
echo # ======================================== >> .env
echo. >> .env
echo # Banco de Dados >> .env
echo DATABASE_URL="postgresql://astra_dev:dev123@localhost:5432/astra_campaign_dev?schema=public" >> .env
echo REDIS_URL="redis://localhost:6379" >> .env
echo REDIS_PREFIX="astra_dev" >> .env
echo. >> .env
echo # Servidor >> .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # Autenticacao >> .env
echo JWT_SECRET="dev-jwt-secret-key-for-local-development-only-muito-seguro-123456789" >> .env
echo JWT_EXPIRES_IN="24h" >> .env
echo. >> .env
echo # Configuracoes WAHA >> .env
echo DEFAULT_WAHA_HOST="http://localhost:3000" >> .env
echo DEFAULT_WAHA_API_KEY="dev-waha-key" >> .env
echo DEFAULT_EVOLUTION_HOST="" >> .env
echo DEFAULT_EVOLUTION_API_KEY="" >> .env
echo. >> .env
echo # Configuracoes da empresa >> .env
echo DEFAULT_COMPANY_NAME="Astra Campaign CRM Dev" >> .env
echo DEFAULT_PAGE_TITLE="Sistema de CRM - Desenvolvimento" >> .env
echo. >> .env
echo # CORS >> .env
echo ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,https://localhost:3000,http://localhost:3001" >> .env
echo. >> .env
echo # IA (opcional) >> .env
echo OPENAI_API_KEY="" >> .env
echo GROQ_API_KEY="" >> .env
echo. >> .env
echo # Upload >> .env
echo UPLOAD_DIR="/tmp/uploads" >> .env
echo MAX_FILE_SIZE="50mb" >> .env

echo Arquivo .env criado com sucesso!
echo.
pause
