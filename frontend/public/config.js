// Configuração runtime - injetada pelo Docker
window.APP_CONFIG = {
  API_URL: 'VITE_API_URL_PLACEHOLDER/api'
};

// Debug: confirmar que config foi carregado
console.log('✅ config.js carregado!', window.APP_CONFIG);

