// Configuração centralizada da API
export const getApiBaseUrl = (): string => {
  const url = (window as any).APP_CONFIG?.API_URL || 
               import.meta.env.VITE_API_URL || 
               'http://localhost:3001/api';
  
  console.log('🔍 API Base URL:', url);
  return url;
};

// Helper para fazer fetch com URL completa
export const apiFetch = (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  console.log('📡 API Request:', url);
  return fetch(url, options);
};

