import { useState, useEffect } from 'react';
import {
  opportunitiesService,
  leadsService,
  activitiesService,
} from '../services/opportunitiesService';
import toast from 'react-hot-toast';

export default function SalesDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [leadsStats, setLeadsStats] = useState<any>(null);
  const [activityStats, setActivityStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [pipeline, leads, activities] = await Promise.all([
        opportunitiesService.getPipelineStats(),
        leadsService.getLeadsStats(),
        activitiesService.getActivities({ pageSize: 100 }),
      ]);

      setPipelineStats(pipeline);
      setLeadsStats(leads);

      // Calcular estatísticas de atividades
      const now = new Date();
      const activitiesData = Array.isArray(activities.data) ? activities.data : [];
      const pendingActivities = activitiesData.filter((a) => a.status === 'PENDING');
      const overdueActivities = pendingActivities.filter((a) => {
        const dueDate = a.dueDate ? new Date(a.dueDate) : null;
        return dueDate && dueDate < now;
      });
      const completedActivities = activitiesData.filter((a) => a.status === 'COMPLETED');

      setActivityStats({
        total: activitiesData.length,
        pending: pendingActivities.length,
        overdue: overdueActivities.length,
        completed: completedActivities.length,
      });
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error(error.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      LEAD: 'Lead',
      QUALIFIED: 'Qualificado',
      PROPOSAL: 'Proposta',
      NEGOTIATION: 'Negociação',
      CLOSED_WON: 'Ganho',
      CLOSED_LOST: 'Perdido',
    };
    return labels[stage] || stage;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Vendas</h1>
        <p className="text-gray-600">Visão geral das métricas e performance de vendas</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {pipelineStats && (
          <>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Pipeline Total</p>
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(pipelineStats.pipeline?.totalValue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Valor total em oportunidades</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Ganhos</p>
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(pipelineStats.pipeline?.wonValue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Oportunidades fechadas</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Taxa de Conversão</p>
                <svg
                  className="w-8 h-8 text-purple-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {pipelineStats.pipeline?.conversionRate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Taxa de fechamento</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Perdas</p>
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(pipelineStats.pipeline?.lostValue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Oportunidades perdidas</p>
            </div>
          </>
        )}
      </div>

      {/* Segunda Linha de KPIs - Leads */}
      {leadsStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-1">Total de Leads</p>
            <p className="text-3xl font-bold text-blue-900">{leadsStats.totalLeads}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium mb-1">Leads Convertidos</p>
            <p className="text-3xl font-bold text-green-900">{leadsStats.convertedLeads}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 font-medium mb-1">Taxa de Conversão</p>
            <p className="text-3xl font-bold text-purple-900">
              {leadsStats.conversionRate?.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 font-medium mb-1">Score Médio</p>
            <p className="text-3xl font-bold text-yellow-900">
              {leadsStats.averageScore?.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline por Estágio */}
        {pipelineStats && pipelineStats.stageStats && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline por Estágio</h3>
            <div className="space-y-3">
              {pipelineStats.stageStats.map((stat: any) => {
                const total = pipelineStats.pipeline?.totalValue || 1;
                const percentage = ((stat.value / total) * 100).toFixed(1);

                return (
                  <div key={stat.stage}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {getStageLabel(stat.stage)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatCurrency(stat.value)} ({stat.count})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leads por Status */}
        {leadsStats && leadsStats.statusStats && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por Status</h3>
            <div className="space-y-3">
              {leadsStats.statusStats.map((stat: any) => {
                const total = leadsStats.totalLeads || 1;
                const percentage = ((stat.count / total) * 100).toFixed(1);

                const statusColors: Record<string, string> = {
                  NEW: 'bg-blue-600',
                  CONTACTED: 'bg-purple-600',
                  QUALIFIED: 'bg-green-600',
                  PROPOSAL: 'bg-yellow-600',
                  NEGOTIATION: 'bg-orange-600',
                  CONVERTED: 'bg-emerald-600',
                  LOST: 'bg-red-600',
                };

                return (
                  <div key={stat.status}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stat.status}</span>
                      <span className="text-sm text-gray-600">
                        {stat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${statusColors[stat.status] || 'bg-gray-600'} h-2 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por Fonte */}
        {leadsStats && leadsStats.sourceStats && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leads por Fonte</h3>
            <div className="space-y-3">
              {leadsStats.sourceStats.map((stat: any) => {
                const total = leadsStats.totalLeads || 1;
                const percentage = ((stat.count / total) * 100).toFixed(1);

                return (
                  <div key={stat.source}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{stat.source}</span>
                      <span className="text-sm text-gray-600">
                        {stat.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Atividades */}
        {activityStats && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{activityStats.total}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Pendentes</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{activityStats.pending}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Atrasadas</span>
                </div>
                <span className="text-lg font-bold text-red-600">{activityStats.overdue}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Concluídas</span>
                </div>
                <span className="text-lg font-bold text-green-600">{activityStats.completed}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
