import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';

interface Settings {
  id: string;
  wahaHost: string;
  wahaApiKey: string;
  logoUrl?: string;
  companyName?: string;
  faviconUrl?: string;
  pageTitle?: string;
  iconUrl?: string;
  openaiApiKey?: string;
  groqApiKey?: string;
}

const settingsSchema = z.object({
  wahaHost: z.string().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: 'Host deve ser uma URL válida ou vazio'
  }),
  wahaApiKey: z.string().refine((val) => !val || val.length >= 10, {
    message: 'API Key deve ter pelo menos 10 caracteres ou estar vazia'
  }),
  companyName: z.string().refine((val) => !val || (val.length >= 1 && val.length <= 100), {
    message: 'Nome da empresa deve ter entre 1 e 100 caracteres ou estar vazio'
  }),
  pageTitle: z.string().refine((val) => !val || (val.length >= 1 && val.length <= 100), {
    message: 'Título da página deve ter entre 1 e 100 caracteres ou estar vazio'
  }),
  openaiApiKey: z.string().optional(),
  groqApiKey: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Logo states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Favicon states
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Icon states
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Helper para fazer requisições autenticadas
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Helper para uploads (sem Content-Type automatico)
  const authenticatedUpload = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    onErrors: (errors) => {
      console.log('🔴 Erros de validação:', errors);
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await authenticatedFetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setValue('wahaHost', data.wahaHost);
        setValue('wahaApiKey', data.wahaApiKey);
        setValue('companyName', data.companyName || '');
        setValue('pageTitle', data.pageTitle || '');
        setValue('openaiApiKey', data.openaiApiKey || '');
        setValue('groqApiKey', data.groqApiKey || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    console.log('🚀 onSubmit chamado com dados:', data);
    try {
      console.log('📡 Enviando requisição para /api/settings');
      const response = await authenticatedFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      console.log('📨 Resposta recebida:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Dados salvos com sucesso:', responseData);
        toast.success('Configurações salvas com sucesso');
        loadSettings();
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        console.error('❌ Detalhes dos erros:', errorData.errors);
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorData.errors.forEach((err: any, index: number) => {
            console.error(`❌ Erro ${index + 1}:`, err);
          });
        }
        toast.error(errorData.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('💥 Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  // Logo handlers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await authenticatedUpload('/api/settings/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Logo carregada com sucesso');
        loadSettings();
        setLogoFile(null);
        setLogoPreview('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao carregar logo');
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error);
      toast.error('Erro ao carregar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = async () => {
    try {
      const response = await authenticatedFetch('/api/settings/logo', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Logo removida com sucesso');
        loadSettings();
      } else {
        toast.error('Erro ao remover logo');
      }
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    }
  };

  // Favicon handlers
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaviconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFavicon = async () => {
    if (!faviconFile) return;

    setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('favicon', faviconFile);

      const response = await authenticatedUpload('/api/settings/favicon', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Favicon carregado com sucesso');
        loadSettings();
        setFaviconFile(null);
        setFaviconPreview('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao carregar favicon');
      }
    } catch (error) {
      console.error('Erro ao carregar favicon:', error);
      toast.error('Erro ao carregar favicon');
    } finally {
      setUploadingFavicon(false);
    }
  };

  const removeFavicon = async () => {
    try {
      const response = await authenticatedFetch('/api/settings/favicon', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Favicon removido com sucesso');
        loadSettings();
      } else {
        toast.error('Erro ao remover favicon');
      }
    } catch (error) {
      console.error('Erro ao remover favicon:', error);
      toast.error('Erro ao remover favicon');
    }
  };

  // Icon handlers
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setIconPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadIcon = async () => {
    if (!iconFile) return;

    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('icon', iconFile);

      const response = await authenticatedUpload('/api/settings/icon', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Ícone carregado com sucesso');
        loadSettings();
        setIconFile(null);
        setIconPreview('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao carregar ícone');
      }
    } catch (error) {
      console.error('Erro ao carregar ícone:', error);
      toast.error('Erro ao carregar ícone');
    } finally {
      setUploadingIcon(false);
    }
  };

  const removeIcon = async () => {
    try {
      const response = await authenticatedFetch('/api/settings/icon', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Ícone removido com sucesso');
        loadSettings();
      } else {
        toast.error('Erro ao remover ícone');
      }
    } catch (error) {
      console.error('Erro ao remover ícone:', error);
      toast.error('Erro ao remover ícone');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando configurações...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Configurações"
        subtitle="Configure as definições do sistema"
      />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Configurações Gerais
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'appearance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎨 Aparência
              </button>
              <button
                onClick={() => setActiveTab('integrations')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'integrations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔗 Integrações
              </button>
            </nav>
          </div>

          <div className="space-y-6">
            {/* Aba: Configurações Gerais */}
            {activeTab === 'general' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🏢 Informações da Empresa
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Empresa *
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        {...register('companyName')}
                        placeholder="Nome da sua empresa"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.companyName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="pageTitle" className="block text-sm font-medium text-gray-700 mb-1">
                        Título da Página *
                      </label>
                      <input
                        id="pageTitle"
                        type="text"
                        {...register('pageTitle')}
                        placeholder="Ex: Astra Online - Gestão de Contatos"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.pageTitle && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.pageTitle.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Título que aparecerá na aba do navegador
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Informações'}
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* Aba: Aparência */}
            {activeTab === 'appearance' && (
              <>
                {/* Logo da Empresa */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🎨 Logo da Empresa
                  </h2>

                  {/* Logo Atual */}
                  {settings?.logoUrl && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Logo Atual:</p>
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.logoUrl}
                          alt="Logo atual"
                          className="w-20 h-20 object-contain border border-gray-200 rounded-lg"
                        />
                        <button
                          onClick={removeLogo}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Nova Logo */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Logo
                      </label>
                      <input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceitos: JPEG, PNG, GIF, WebP (max 5MB)
                      </p>
                    </div>

                    {/* Preview */}
                    {logoPreview && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="flex items-center space-x-4">
                          <img
                            src={logoPreview}
                            alt="Preview"
                            className="w-20 h-20 object-contain border border-gray-200 rounded-lg"
                          />
                          <button
                            onClick={uploadLogo}
                            disabled={uploadingLogo}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {uploadingLogo ? 'Carregando...' : 'Carregar Logo'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ícone Geral */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🏷️ Ícone Geral
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Ícone usado na página de login e no menu interno do sistema
                  </p>

                  {/* Ícone Atual */}
                  {settings?.iconUrl && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Ícone Atual:</p>
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.iconUrl}
                          alt="Ícone atual"
                          className="w-12 h-12 object-contain border border-gray-200 rounded"
                        />
                        <button
                          onClick={removeIcon}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Novo Ícone */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                        Novo Ícone
                      </label>
                      <input
                        id="icon"
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recomendado: PNG, 64x64px ou similar (max 5MB)
                      </p>
                    </div>

                    {/* Preview */}
                    {iconPreview && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="flex items-center space-x-4">
                          <img
                            src={iconPreview}
                            alt="Preview"
                            className="w-12 h-12 object-contain border border-gray-200 rounded"
                          />
                          <button
                            onClick={uploadIcon}
                            disabled={uploadingIcon}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {uploadingIcon ? 'Carregando...' : 'Carregar Ícone'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Favicon da Plataforma */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🌐 Favicon da Plataforma
                  </h2>

                  {/* Favicon Atual */}
                  {settings?.faviconUrl && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Favicon Atual:</p>
                      <div className="flex items-center space-x-4">
                        <img
                          src={settings.faviconUrl}
                          alt="Favicon atual"
                          className="w-8 h-8 object-contain border border-gray-200 rounded"
                        />
                        <button
                          onClick={removeFavicon}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upload Novo Favicon */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="favicon" className="block text-sm font-medium text-gray-700 mb-1">
                        Novo Favicon
                      </label>
                      <input
                        id="favicon"
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceitos: PNG, ICO (recomendado 32x32px ou 16x16px)
                      </p>
                    </div>

                    {/* Preview */}
                    {faviconPreview && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="flex items-center space-x-4">
                          <img
                            src={faviconPreview}
                            alt="Preview"
                            className="w-8 h-8 object-contain border border-gray-200 rounded"
                          />
                          <button
                            onClick={uploadFavicon}
                            disabled={uploadingFavicon}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            {uploadingFavicon ? 'Carregando...' : 'Carregar Favicon'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Aba: Integrações */}
            {activeTab === 'integrations' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🔗 Configurações WAHA
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit, (errors) => console.log('🔴 Erros no submit WAHA:', errors))} className="space-y-4">
                    <div>
                      <label htmlFor="wahaHost" className="block text-sm font-medium text-gray-700 mb-1">
                        Host WAHA *
                      </label>
                      <input
                        id="wahaHost"
                        type="url"
                        {...register('wahaHost')}
                        placeholder="https://waha.exemplo.com.br"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.wahaHost && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.wahaHost.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="wahaApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                        API Key WAHA *
                      </label>
                      <input
                        id="wahaApiKey"
                        type="password"
                        {...register('wahaApiKey')}
                        placeholder="sua-api-key-aqui"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.wahaApiKey && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.wahaApiKey.message}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações WAHA'}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    🤖 Configurações OpenAI
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="openaiApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                        API Key OpenAI
                      </label>
                      <input
                        id="openaiApiKey"
                        type="password"
                        {...register('openaiApiKey')}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.openaiApiKey && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.openaiApiKey.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Chave API para integração com ChatGPT nas campanhas
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações OpenAI'}
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900">
                    ⚡ Configurações Groq
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="groqApiKey" className="block text-sm font-medium text-gray-700 mb-1">
                        API Key Groq
                      </label>
                      <input
                        id="groqApiKey"
                        type="password"
                        {...register('groqApiKey')}
                        placeholder="gsk_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.groqApiKey && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.groqApiKey.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Chave API para integração com Groq AI nas campanhas (modelos rápidos e eficientes)
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Configurações Groq'}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}