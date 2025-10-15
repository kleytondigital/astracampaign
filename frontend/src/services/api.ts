import { Contact, ContactInput, ContactsResponse, Category, CategoryInput, CategoriesResponse, ImportResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));

      // Detectar erro de quota e adicionar flag para tratamento especial
      if (error.upgradeRequired || (error.message && error.message.includes('Limite'))) {
        const quotaError = new Error(error.message || error.error || 'Limite atingido');
        (quotaError as any).isQuotaError = true;
        (quotaError as any).upgradeRequired = true;
        throw quotaError;
      }

      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json();
  }

  // Métodos HTTP padrão para compatibilidade com axios-like API
  async get<T>(endpoint: string, config?: { params?: any }): Promise<{ data: T }> {
    let url = endpoint;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const data = await this.request<T>(url);
    return { data };
  }

  async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: result };
  }

  async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: result };
  }

  async patch<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: result };
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    const result = await this.request<T>(endpoint, {
      method: 'DELETE',
    });
    return { data: result };
  }

  async getContacts(params?: {
    search?: string;
    tag?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ContactsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.set('search', params.search);
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = `/contatos${queryString ? `?${queryString}` : ''}`;

    return this.request<ContactsResponse>(endpoint);
  }

  async getContact(id: string): Promise<Contact> {
    return this.request<Contact>(`/contatos/${id}`);
  }

  async createContact(data: ContactInput): Promise<Contact> {
    return this.request<Contact>('/contatos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string, data: ContactInput): Promise<Contact> {
    return this.request<Contact>(`/contatos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string): Promise<void> {
    await this.request<void>(`/contatos/${id}`, {
      method: 'DELETE',
    });
  }

  // Category methods
  async getCategories(params?: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<CategoriesResponse> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = `/categorias${queryString ? `?${queryString}` : ''}`;

    return this.request<CategoriesResponse>(endpoint);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categorias/all');
  }

  async getCategory(id: string): Promise<Category> {
    return this.request<Category>(`/categorias/${id}`);
  }

  async createCategory(data: CategoryInput): Promise<Category> {
    return this.request<Category>('/categorias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: CategoryInput): Promise<Category> {
    return this.request<Category>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<void>(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }

  // CSV Import methods
  async importCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('csv', file);

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/csv/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async downloadCSVTemplate(): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/csv/template`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.blob();
  }
}

export const apiService = new ApiService();
export const api = apiService;