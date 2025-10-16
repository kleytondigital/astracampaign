// Configuração centralizada da API
export const getApiBaseUrl = (): string => {
  const url = (window as any).APP_CONFIG?.API_URL || 
               (import.meta as any).env?.VITE_API_URL || 
               'http://localhost:3001/api';
  
  console.log('🔍 API Base URL:', url);
  return url;
};

// Helper para fazer fetch com URL completa e autenticação
export const apiFetch = (endpoint: string, options?: RequestInit): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  
  // Obter token de autenticação
  const token = localStorage.getItem('auth_token');
  
  // Preparar headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  
  // Adicionar token se disponível
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('📡 API Request:', url);
  console.log('🔑 Token presente:', !!token);
  
  return fetch(url, {
    ...options,
    headers,
  });
};

