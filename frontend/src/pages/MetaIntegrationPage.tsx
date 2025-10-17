import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { metaService } from '../services/metaService';
import { 
  MetaConnectionStatus, 
  MetaAdAccountFromAPI, 
  MetaLinkAccountRequest 
} from '../types/meta';
import { toast } from 'react-hot-toast';
import { 
  Link, 
  Unlink, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  Trash2
} from 'lucide-react';

const MetaIntegrationPage: React.FC = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const [connectionStatus, setConnectionStatus] = useState<MetaConnectionStatus | null>(null);
  const [accounts, setAccounts] = useState<MetaAdAccountFromAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (currentTenant?.id) {
      loadConnectionStatus();
    }
  }, [currentTenant]);

  const loadConnectionStatus = async () => {
    if (!currentTenant?.id) return;
    
    try {
      setLoading(true);
      const status = await metaService.getConnectionStatus(currentTenant.id);
      setConnectionStatus(status);
      
      if (status.connected) {
        loadAccounts();
      }
    } catch (error) {
      console.error('Erro ao carregar status da conexão:', error);
      toast.error('Erro ao carregar status da conexão Meta');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (!currentTenant?.id) return;
    
    try {
      setAccountsLoading(true);
      const accountsData = await metaService.listAccounts(currentTenant.id);
      setAccounts(accountsData);
      
      // Marcar contas já vinculadas
      const linkedAccounts = new Set(
        accountsData.filter(acc => acc.isLinked).map(acc => acc.id)
      );
      setSelectedAccounts(linkedAccounts);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas Meta');
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleConnect = async () => {
    // Usar tenant do contexto ou do usuário logado
    const tenantId = currentTenant?.id || user?.tenantId;
    console.log('🔗 Iniciando conexão com Meta Ads...', { 
      currentTenant: currentTenant?.id, 
      userTenant: user?.tenantId,
      finalTenantId: tenantId 
    });
    
    if (!tenantId) {
      console.error('❌ Tenant ID não encontrado');
      toast.error('Erro: Tenant não encontrado. Verifique se você está logado em um tenant válido.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('📡 Chamando startOAuthFlow...');
      const result = await metaService.startOAuthFlow(tenantId);
      console.log('✅ OAuth flow iniciado:', result);
      
      // Redirecionar para OAuth
      console.log('🔄 Redirecionando para:', result.authUrl);
      metaService.redirectToMetaOAuth(result.authUrl);
    } catch (error: any) {
      console.error('❌ Erro ao iniciar OAuth:', error);
      toast.error(error.message || 'Erro ao conectar com Meta');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentTenant?.id) return;
    
    if (!confirm('Tem certeza que deseja desconectar sua conta Meta? Todas as contas vinculadas serão desativadas.')) {
      return;
    }
    
    try {
      setLoading(true);
      await metaService.disconnect(currentTenant.id);
      setConnectionStatus(null);
      setAccounts([]);
      setSelectedAccounts(new Set());
      toast.success('Conta Meta desconectada com sucesso');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast.error(error.message || 'Erro ao desconectar Meta');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const handleLinkAccounts = async () => {
    if (!currentTenant?.id || selectedAccounts.size === 0) {
      toast.error('Selecione pelo menos uma conta para vincular');
      return;
    }
    
    try {
      setLinking(true);
      
      for (const accountId of selectedAccounts) {
        const account = accounts.find(acc => acc.id === accountId);
        if (account && !account.isLinked) {
          const request: MetaLinkAccountRequest = { accountId };
          await metaService.linkAccount(currentTenant.id, request);
        }
      }
      
      toast.success(`${selectedAccounts.size} conta(s) vinculada(s) com sucesso!`);
      loadConnectionStatus(); // Recarregar status
    } catch (error: any) {
      console.error('Erro ao vincular contas:', error);
      toast.error(error.message || 'Erro ao vincular contas');
    } finally {
      setLinking(false);
    }
  };

  const formatCurrency = (currency: string) => {
    const currencyMap: { [key: string]: string } = {
      'USD': '$',
      'BRL': 'R$',
      'EUR': '€',
      'GBP': '£',
    };
    return currencyMap[currency] || currency;
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-yellow-600 bg-yellow-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Ativa';
      case 2: return 'Pausada';
      case 3: return 'Desativada';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Integração Meta Ads</h1>
          </div>
          <p className="text-gray-600">
            Conecte sua conta Meta e vincule suas contas de anúncios para acessar relatórios e métricas em tempo real.
          </p>
        </div>

        {/* Status da Conexão */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Status da Conexão</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : connectionStatus?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">Conectado</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      {connectionStatus.accountsCount} conta(s) vinculada(s)
                    </span>
                  </div>
                  
                  {connectionStatus.expiresAt && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        Expira em: {new Date(connectionStatus.expiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      Última atividade: {connectionStatus.lastUsedAt ? 
                        new Date(connectionStatus.lastUsedAt).toLocaleDateString('pt-BR') : 
                        'Nunca'
                      }
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={loadAccounts}
                    disabled={accountsLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {accountsLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Atualizar Contas
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                  <span className="text-lg font-medium text-gray-900">Não conectado</span>
                </div>
                <p className="text-gray-600 mb-6">
                  Conecte sua conta Meta para acessar suas campanhas e relatórios de anúncios.
                </p>
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Link className="w-5 h-5" />
                      Conectar com Meta Ads
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Contas */}
        {connectionStatus?.connected && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Contas de Anúncios</h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecione as contas que deseja vincular ao seu tenant.
              </p>
            </div>
            
            <div className="p-6">
              {accountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : accounts.length > 0 ? (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        account.isLinked 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.has(account.id)}
                            onChange={() => handleAccountToggle(account.id)}
                            disabled={account.isLinked}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                          />
                          
                          <div>
                            <h3 className="font-medium text-gray-900">{account.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span>ID: {account.id}</span>
                              {account.currency && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  {formatCurrency(account.currency)}
                                </span>
                              )}
                              {account.timezone_name && (
                                <span>{account.timezone_name}</span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(account.account_status)}`}>
                                {getStatusText(account.account_status)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {account.isLinked && (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Vinculada
                            </span>
                          )}
                          
                          {account.business_name && (
                            <span className="text-sm text-gray-500">
                              {account.business_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleLinkAccounts}
                      disabled={linking || selectedAccounts.size === 0}
                      className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {linking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Vinculando...
                        </>
                      ) : (
                        <>
                          <Link className="w-4 h-4" />
                          Vincular Contas Selecionadas ({selectedAccounts.size})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma conta de anúncios encontrada.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        {!connectionStatus?.connected && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Como funciona?</h3>
            <div className="text-blue-800 space-y-2">
              <p>1. Clique em "Conectar com Meta Ads" para autorizar o acesso</p>
              <p>2. Faça login na sua conta Facebook/Meta</p>
              <p>3. Autorize o acesso às suas contas de anúncios</p>
              <p>4. Selecione quais contas deseja vincular ao seu tenant</p>
              <p>5. Acesse relatórios e métricas em tempo real</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaIntegrationPage;
