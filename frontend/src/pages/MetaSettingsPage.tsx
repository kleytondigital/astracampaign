import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { metaService } from '../services/metaService';
import { MetaGlobalSettings, MetaGlobalSettingsForm } from '../types/meta';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Database,
  Users,
  BarChart3
} from 'lucide-react';

const MetaSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MetaGlobalSettings | null>(null);
  const [formData, setFormData] = useState<MetaGlobalSettingsForm>({
    appId: '',
    appSecret: '',
    redirectUri: '',
    apiVersion: 'v21.0',
    scopes: 'ads_read,ads_management,business_management,pages_show_list'
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'SUPERADMIN') {
      loadSettings();
      loadStats();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await metaService.getGlobalSettings();
      setSettings(data);
      
      if (data) {
        setFormData({
          appId: data.appId,
          appSecret: '', // Não carregar secret por segurança
          redirectUri: data.redirectUri || data.suggestedRedirectUri || '',
          apiVersion: data.apiVersion || 'v21.0',
          scopes: data.scopes
        });
      } else {
        // Se não há configuração, preencher com URL sugerida
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const suggestedUri = backendUrl.replace('/api', '') + '/api/meta/callback';
        setFormData(prev => ({
          ...prev,
          redirectUri: suggestedUri
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações Meta');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await metaService.getGlobalStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.appId || !formData.appSecret) {
      toast.error('App ID e App Secret são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const newSettings = await metaService.setGlobalSettings(formData);
      setSettings(newSettings);
      toast.success('Configurações Meta salvas com sucesso!');
      
      // Atualizar com a URL retornada (caso tenha sido gerada automaticamente)
      if (newSettings.redirectUri) {
        setFormData(prev => ({ 
          ...prev, 
          appSecret: '', // Limpar secret após salvar
          redirectUri: newSettings.redirectUri 
        }));
      } else {
        setFormData(prev => ({ ...prev, appSecret: '' }));
      }
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await metaService.testGlobalConnection();
      toast.success('Conexão testada com sucesso!');
      
      // Abrir URL de teste em nova aba
      if (result.authUrl) {
        window.open(result.authUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      toast.error(error.message || 'Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof MetaGlobalSettingsForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (user?.role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Super Administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações Meta Ads</h1>
          </div>
          <p className="text-gray-600">
            Configure as credenciais globais do App Meta para integração com Facebook Ads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulário de Configuração */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Configurações do App Meta</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configure as credenciais do seu App Meta no Facebook Developers.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={formData.appId}
                    onChange={(e) => handleInputChange('appId', e.target.value)}
                    placeholder="1234567890123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ID do seu App Meta no Facebook Developers.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={formData.appSecret}
                      onChange={(e) => handleInputChange('appSecret', e.target.value)}
                      placeholder="••••••••••••••••••••••••••••••••"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!settings}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Secret do seu App Meta (mantido criptografado no banco).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redirect URI (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.redirectUri}
                    onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                    placeholder="https://seu-dominio.com/api/meta/callback"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 <strong>URL de callback configurada no Facebook Developers.</strong>
                    {' '}Se deixar vazio, será gerada automaticamente: <code className="bg-gray-100 px-1 rounded">{formData.redirectUri || 'aguardando...'}</code>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Configure esta URL no Facebook App Dashboard → Produtos → Facebook Login → Configurações → URIs de redirecionamento OAuth válidos
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versão da Graph API
                  </label>
                  <select
                    value={formData.apiVersion}
                    onChange={(e) => handleInputChange('apiVersion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="v19.0">v19.0</option>
                    <option value="v20.0">v20.0</option>
                    <option value="v21.0">v21.0 (Recomendado)</option>
                    <option value="v22.0">v22.0</option>
                    <option value="v23.0">v23.0</option>
                    <option value="v24.0">v24.0 (Mais recente)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📊 Versão da API do Facebook para fazer requisições. Recomendamos usar v21.0 ou superior.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Versões mais recentes podem ter recursos adicionais, mas certifique-se de que seu App Meta suporta a versão escolhida.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scopes (Permissões)
                  </label>
                  <textarea
                    value={formData.scopes}
                    onChange={(e) => handleInputChange('scopes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Permissões separadas por vírgula (padrão recomendado).
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Salvar Configurações
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !settings}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {testing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        Testar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="space-y-6">
            {/* Status das Configurações */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Status</h3>
              </div>
              <div className="p-6">
                {settings ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">Configurado</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>App ID:</strong> {settings.appId}</p>
                      <p><strong>Redirect URI:</strong> {settings.redirectUri}</p>
                      <p><strong>Ativo:</strong> {settings.active ? 'Sim' : 'Não'}</p>
                      {settings.createdAt && (
                        <p><strong>Criado em:</strong> {new Date(settings.createdAt).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">Não configurado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas de Uso */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Estatísticas</h3>
              </div>
              <div className="p-6">
                {statsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Conexões</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.connectionsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Contas</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.accountsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-600">Campanhas</span>
                      </div>
                      <span className="font-semibold text-gray-900">{stats.campaignsCount}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma estatística disponível</p>
                )}
              </div>
            </div>

            {/* Links Úteis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Links Úteis</h3>
              </div>
              <div className="p-6 space-y-3">
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Facebook Developers
                </a>
                <a
                  href="https://developers.facebook.com/docs/marketing-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Marketing API Docs
                </a>
                <a
                  href="https://developers.facebook.com/docs/marketing-api/authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Guia de Autenticação
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaSettingsPage;
