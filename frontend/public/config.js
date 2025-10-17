// Configuração runtime - injetada pelo Docker
window.APP_CONFIG = {
    API_URL: 'https://backendcrm.aoseudispor.com.br/api'
};

// Debug: confirmar que config foi carregado
console.log('✅ config.js carregado!', window.APP_CONFIG);