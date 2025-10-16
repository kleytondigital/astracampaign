import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Building2, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../config/api';

interface TenantMetrics {
  overview: {
    totalChats: number;
    activeChats: number;
    closedChats: number;
    waitingChats: number;
    totalMessages: number;
    totalUsers: number;
    totalDepartments: number;
  };
  departmentMetrics: Array<{
    id: string;
    name: string;
    color: string;
    _count: {
      users: number;
      chats: number;
    };
  }>;
  topUsers: Array<{
    id: string;
    nome: string;
    department: {
      name: string;
      color: string;
    } | null;
    _count: {
      sentMessages: number;
    };
  }>;
  dailyMessages: Array<{
    date: string;
    count: number;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  // Verificar permissões
  if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">Você não tem permissão para acessar esta página.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Carregar métricas
  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/metrics/tenant?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const formatPeriod = (period: string) => {
    switch (period) {
      case '1d': return 'Último dia';
      case '7d': return 'Últimos 7 dias';
      case '30d': return 'Últimos 30 dias';
      case '90d': return 'Últimos 90 dias';
      default: return 'Últimos 7 dias';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Erro ao carregar métricas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-600">Visão geral do sistema de atendimento</p>
            </div>
            
            {/* Filtro de Período */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1d">Último dia</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>
          </div>
        </div>

        {/* Cards de Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Chats</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.totalChats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chats Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.activeChats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aguardando</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.waitingChats}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.overview.totalUsers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Métricas por Departamento */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Departamentos</h2>
            </div>
            
            <div className="space-y-4">
              {metrics.departmentMetrics.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: dept.color }}
                    ></div>
                    <span className="font-medium text-gray-900">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {dept._count.users}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {dept._count.chats}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Usuários */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Top Usuários</h2>
            </div>
            
            <div className="space-y-4">
              {metrics.topUsers.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.nome}</p>
                      {user.department && (
                        <p className="text-sm text-gray-600">{user.department.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {user._count.sentMessages} mensagens
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico de Mensagens Diárias */}
        {metrics.dailyMessages.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Mensagens por Dia - {formatPeriod(period)}
              </h2>
            </div>
            
            <div className="space-y-2">
              {metrics.dailyMessages.map((day) => (
                <div key={day.date} className="flex items-center">
                  <div className="w-20 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit' 
                    })}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, (day.count / Math.max(...metrics.dailyMessages.map(d => d.count))) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-sm text-gray-600 text-right">
                    {day.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Resumo do Período</h3>
          <p className="text-blue-800">
            No período de <strong>{formatPeriod(period).toLowerCase()}</strong>, foram processados{' '}
            <strong>{metrics.overview.totalChats}</strong> chats, com{' '}
            <strong>{metrics.overview.activeChats}</strong> ainda ativos e{' '}
            <strong>{metrics.overview.closedChats}</strong> já resolvidos. 
            Total de <strong>{metrics.overview.totalMessages}</strong> mensagens trocadas.
          </p>
        </div>
      </div>
    </div>
  );
}
