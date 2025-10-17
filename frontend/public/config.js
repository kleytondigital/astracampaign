// Configuração runtime - injetada pelo Docker
window.APP_CONFIG = {
    API_URL: 'https://n8n-back-crm.h3ag2x.easypanel.host/api'
};

// Debug: confirmar que config foi carregado
console.log('✅ config.js carregado!', window.APP_CONFIG);