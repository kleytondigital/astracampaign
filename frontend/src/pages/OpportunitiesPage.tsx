import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Opportunity,
  OpportunityInput,
  OpportunityStage,
  Company,
  Contact,
  Activity,
  ActivityType,
  Priority,
  ActivityStatus,
} from '../types';
import {
  opportunitiesService,
  companiesService,
  activitiesService,
} from '../services/opportunitiesService';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Pagination } from '../components/Pagination';
import { KanbanBoard } from '../components/KanbanBoard';
import toast from 'react-hot-toast';

const OpportunitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [pipelineStats, setPipelineStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban'); // Padrão: Kanban

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados do formulário
  const [formData, setFormData] = useState<OpportunityInput>({
    title: '',
    value: 0,
    stage: 'PROSPECT',
    probability: 10,
    description: '',
    contactId: undefined,
    companyId: undefined,
    assignedTo: user?.id || '',
    tags: [],
  });

  const [activityFormData, setActivityFormData] = useState({
    type: 'CALL' as ActivityType,
    subject: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    dueDate: '',
    opportunityId: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Aplicar filtro de permissões: USER vê só suas oportunidades
      const oppParams: any = { page: currentPage, pageSize };
      if (user?.role === 'USER') {
        oppParams.assignedTo = user.id;
      }
      // ADMIN e SUPERADMIN veem tudo do tenant

      const [opportunitiesData, companiesData, contactsData, activitiesData, statsData] =
        await Promise.all([
          opportunitiesService.getOpportunities(oppParams),
          companiesService.getCompanies({ pageSize: 100 }),
          apiService.getContacts({ pageSize: 100 }),
          activitiesService.getActivities({ pageSize: 100 }),
          opportunitiesService.getPipelineStats(),
        ]);

      setOpportunities(opportunitiesData.opportunities || []);
      setCompanies(companiesData.companies || companiesData.data || []);
      setContacts(contactsData.contacts || contactsData.data || []);
      setActivities(activitiesData.activities || activitiesData.data || []);
      setPipelineStats(statsData);
      setTotalItems(opportunitiesData.pagination?.total || 0);
      setTotalPages(opportunitiesData.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      // Garantir arrays vazios em caso de erro
      setOpportunities([]);
      setCompanies([]);
      setContacts([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await opportunitiesService.createOpportunity(formData);
      toast.success('Oportunidade criada com sucesso!');
      setShowCreateModal(false);
      setFormData({
        title: '',
        value: 0,
        stage: 'PROSPECT',
        probability: 10,
        description: '',
        contactId: undefined,
        companyId: undefined,
        assignedTo: user?.id || '',
        tags: [],
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error);
      toast.error('Erro ao criar oportunidade');
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activitiesService.createActivity({
        ...activityFormData,
        assignedTo: user?.id || '',
      });
      toast.success('Atividade criada com sucesso!');
      setShowActivityModal(false);
      setActivityFormData({
        type: 'CALL',
        subject: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        opportunityId: '',
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      toast.error('Erro ao criar atividade');
    }
  };

  const handleUpdateOpportunityStage = async (
    opportunityId: string,
    newStage: OpportunityStage
  ) => {
    try {
      await opportunitiesService.updateOpportunity(opportunityId, { stage: newStage });
      toast.success('Estágio atualizado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
      toast.error('Erro ao atualizar estágio');
    }
  };

  const getStageColor = (stage: OpportunityStage) => {
    const colors = {
      PROSPECT: 'bg-gray-100 text-gray-800',
      QUALIFIED: 'bg-blue-100 text-blue-800',
      PROPOSAL: 'bg-yellow-100 text-yellow-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-purple-100 text-purple-800',
    };
    return colors[stage];
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const getActivityTypeIcon = (type: ActivityType) => {
    const icons = {
      CALL: '📞',
      EMAIL: '📧',
      MEETING: '🤝',
      TASK: '📋',
      WHATSAPP: '💬',
      NOTE: '📝',
      FOLLOW_UP: '🔄',
      PROPOSAL: '📄',
      DEMO: '🎯',
    };
    return icons[type];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pipeline de Vendas</h1>
        <p className="text-gray-600">
          Gerencie suas oportunidades e acompanhe o progresso das vendas
        </p>
      </div>

      {/* Estatísticas do Pipeline */}
      {pipelineStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Valor Total do Pipeline</h3>
            <p className="text-2xl font-bold text-gray-900">
              R$ {pipelineStats.pipeline.totalValue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Vendas Ganhas</h3>
            <p className="text-2xl font-bold text-green-600">
              R$ {pipelineStats.pipeline.wonValue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Vendas Perdidas</h3>
            <p className="text-2xl font-bold text-red-600">
              R$ {pipelineStats.pipeline.lostValue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Taxa de Conversão</h3>
            <p className="text-2xl font-bold text-blue-600">
              {pipelineStats.pipeline.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nova Oportunidade
          </button>
          <button
            onClick={() => setShowActivityModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
          + Nova Atividade
        </button>
        </div>

        {/* Toggle de Visualização */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              viewMode === 'kanban'
                ? 'bg-white text-blue-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2z"
              />
            </svg>
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Lista
          </button>
        </div>
      </div>

      {/* Visualização Kanban */}
      {viewMode === 'kanban' && (
        <KanbanBoard
          opportunities={opportunities}
          onStageChange={async (opportunityId, newStage) => {
            await opportunitiesService.updateOpportunity(opportunityId, { stage: newStage });
            loadData(); // Recarregar para atualizar estatísticas
          }}
          loading={loading}
        />
      )}

      {/* Lista de Oportunidades */}
      {viewMode === 'list' && (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Oportunidades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oportunidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa/Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estágio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probabilidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link
                        to={`/oportunidades/${opportunity.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {opportunity.title}
                      </Link>
                      <div className="text-sm text-gray-500">{opportunity.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {opportunity.company && (
                        <div className="text-sm font-medium text-gray-900">
                          {opportunity.company.name}
                        </div>
                      )}
                      {opportunity.contact && (
                        <div className="text-sm text-gray-500">{opportunity.contact.nome}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {opportunity.value.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(opportunity.stage)}`}
                    >
                      {opportunity.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${opportunity.probability}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{opportunity.probability}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <select
                        value={opportunity.stage}
                        onChange={(e) =>
                          handleUpdateOpportunityStage(
                            opportunity.id,
                            e.target.value as OpportunityStage
                          )
                        }
                        className="text-xs border rounded px-2 py-1"
                      >
                        {Object.values(OpportunityStage).map((stage) => (
                          <option key={stage} value={stage}>
                            {stage.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          setSelectedOpportunity(opportunity);
                          setActivityFormData((prev) => ({
                            ...prev,
                            opportunityId: opportunity.id,
                          }));
                          setShowActivityModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        + Atividade
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {!loading && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
      )}

      {/* Lista de Atividades */}
      <div className="bg-white rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Atividades Recentes</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{getActivityTypeIcon(activity.type)}</span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{activity.subject}</h3>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(activity.priority)}`}
                      >
                        {activity.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.opportunity?.title &&
                          `Oportunidade: ${activity.opportunity.title}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {activity.dueDate
                      ? new Date(activity.dueDate).toLocaleDateString('pt-BR')
                      : 'Sem data'}
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : activity.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {activity.status === 'COMPLETED'
                      ? 'Concluída'
                      : activity.status === 'IN_PROGRESS'
                        ? 'Em Andamento'
                        : activity.status === 'CANCELLED'
                          ? 'Cancelada'
                          : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Criar Oportunidade */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Oportunidade</h2>
            <form onSubmit={handleCreateOpportunity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: parseFloat(e.target.value) })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estágio</label>
                  <select
                    value={formData.stage}
                    onChange={(e) =>
                      setFormData({ ...formData, stage: e.target.value as OpportunityStage })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {Object.values(OpportunityStage).map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Probabilidade (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) =>
                      setFormData({ ...formData, probability: parseInt(e.target.value) })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>

                {/* Dropdown de Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Empresa (opcional)
                  </label>
                  <select
                    value={formData.companyId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, companyId: e.target.value || undefined })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies && companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown de Contato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Contato (opcional)
                  </label>
                  <select
                    value={formData.contactId || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactId: e.target.value || undefined })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Selecione um contato...</option>
                    {contacts && contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.nome} {contact.telefone ? `(${contact.telefone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Atividade */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nova Atividade</h2>
            <form onSubmit={handleCreateActivity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={activityFormData.type}
                    onChange={(e) =>
                      setActivityFormData({
                        ...activityFormData,
                        type: e.target.value as ActivityType,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {Object.values(ActivityType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assunto</label>
                  <input
                    type="text"
                    value={activityFormData.subject}
                    onChange={(e) =>
                      setActivityFormData({ ...activityFormData, subject: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={activityFormData.description}
                    onChange={(e) =>
                      setActivityFormData({ ...activityFormData, description: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                  <select
                    value={activityFormData.priority}
                    onChange={(e) =>
                      setActivityFormData({
                        ...activityFormData,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    {Object.values(Priority).map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Vencimento
                  </label>
                  <input
                    type="datetime-local"
                    value={activityFormData.dueDate}
                    onChange={(e) =>
                      setActivityFormData({ ...activityFormData, dueDate: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesPage;
