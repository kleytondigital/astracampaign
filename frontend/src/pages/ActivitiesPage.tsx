import React, { useState, useEffect } from 'react';
import {
  Activity,
  ActivityInput,
  ActivityType,
  Priority,
  ActivityStatus,
  Opportunity,
  Contact,
} from '../types';
import { activitiesService } from '../services/opportunitiesService';
import { useAuth } from '../contexts/AuthContext';
import { Pagination } from '../components/Pagination';
import toast from 'react-hot-toast';

const ActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activityStats, setActivityStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    assignedTo: '',
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Estados do formulário
  const [formData, setFormData] = useState<ActivityInput>({
    type: 'CALL',
    subject: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    assignedTo: user?.id || '',
    dueDate: '',
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [filters, currentPage, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activitiesData, statsData] = await Promise.all([
        activitiesService.getActivities({
          page: currentPage,
          pageSize,
          ...filters,
        }),
        activitiesService.getActivities({ pageSize: 1 }), // Placeholder para stats
      ]);

      setActivities(activitiesData.activities);
      setTotalItems(activitiesData.pagination?.total || 0);
      setTotalPages(activitiesData.pagination?.totalPages || 0);
      // setActivityStats(statsData); // Implementar quando tiver endpoint de stats
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await activitiesService.createActivity(formData);
      toast.success('Atividade criada com sucesso!');
      setShowCreateModal(false);
      setFormData({
        type: 'CALL',
        subject: '',
        description: '',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedTo: user?.id || '',
        dueDate: '',
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      toast.error('Erro ao criar atividade');
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    try {
      await activitiesService.updateActivity(selectedActivity.id, formData);
      toast.success('Atividade atualizada com sucesso!');
      setShowEditModal(false);
      setSelectedActivity(null);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      toast.error('Erro ao atualizar atividade');
    }
  };

  const handleCompleteActivity = async (activityId: string) => {
    try {
      await activitiesService.completeActivity(activityId);
      toast.success('Atividade marcada como concluída!');
      loadData();
    } catch (error) {
      console.error('Erro ao concluir atividade:', error);
      toast.error('Erro ao concluir atividade');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta atividade?')) {
      return;
    }

    try {
      await activitiesService.deleteActivity(activityId);
      toast.success('Atividade excluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      toast.error('Erro ao excluir atividade');
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormData({
      type: activity.type,
      subject: activity.subject,
      description: activity.description || '',
      priority: activity.priority,
      status: activity.status,
      assignedTo: activity.assignedTo,
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().slice(0, 16) : '',
      contactId: activity.contactId || undefined,
      opportunityId: activity.opportunityId || undefined,
    });
    setShowEditModal(true);
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

  const getStatusColor = (status: ActivityStatus) => {
    const colors = {
      PENDING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status];
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

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return (
      new Date(dueDate) < new Date() && !activities.find((a) => a.dueDate === dueDate)?.completedAt
    );
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Atividades e Timeline</h1>
        <p className="text-gray-600">
          Gerencie suas atividades e acompanhe o progresso das tarefas
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos os tipos</option>
              {Object.values(ActivityType).map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todos os status</option>
              {Object.values(ActivityStatus).map((status) => (
                <option key={status} value={status}>
                  {status === 'PENDING'
                    ? 'Pendente'
                    : status === 'IN_PROGRESS'
                      ? 'Em Andamento'
                      : status === 'COMPLETED'
                        ? 'Concluída'
                        : 'Cancelada'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Todas as prioridades</option>
              {Object.values(Priority).map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', status: '', priority: '', assignedTo: '' })}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Botão de Ação */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nova Atividade
        </button>

        <div className="text-sm text-gray-500">{activities.length} atividade(s) encontrada(s)</div>
      </div>

      {/* Lista de Atividades */}
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`bg-white p-6 rounded-lg shadow border-l-4 ${
              isOverdue(activity.dueDate)
                ? 'border-red-500'
                : activity.status === 'COMPLETED'
                  ? 'border-green-500'
                  : activity.priority === 'URGENT'
                    ? 'border-red-400'
                    : activity.priority === 'HIGH'
                      ? 'border-orange-400'
                      : 'border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <span className="text-3xl">{getActivityTypeIcon(activity.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{activity.subject}</h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(activity.priority)}`}
                    >
                      {activity.priority}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}
                    >
                      {activity.status === 'PENDING'
                        ? 'Pendente'
                        : activity.status === 'IN_PROGRESS'
                          ? 'Em Andamento'
                          : activity.status === 'COMPLETED'
                            ? 'Concluída'
                            : 'Cancelada'}
                    </span>
                  </div>

                  {activity.description && (
                    <p className="text-gray-600 mb-3">{activity.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {activity.contact && (
                      <div className="flex items-center space-x-1">
                        <span>👤</span>
                        <span>{activity.contact.nome}</span>
                      </div>
                    )}

                    {activity.opportunity && (
                      <div className="flex items-center space-x-1">
                        <span>💼</span>
                        <span>{activity.opportunity.title}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <span>👨‍💼</span>
                      <span>{activity.assignedUser.nome}</span>
                    </div>

                    {activity.dueDate && (
                      <div
                        className={`flex items-center space-x-1 ${
                          isOverdue(activity.dueDate) ? 'text-red-600 font-semibold' : ''
                        }`}
                      >
                        <span>📅</span>
                        <span>
                          {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                          {isOverdue(activity.dueDate) && ' (Atrasada)'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center space-x-1">
                      <span>⏰</span>
                      <span>
                        Criada em {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {activity.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleCompleteActivity(activity.id)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    ✓ Concluir
                  </button>
                )}

                <button
                  onClick={() => handleEditActivity(activity)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ✏️ Editar
                </button>

                <button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Nenhuma atividade encontrada</div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Criar primeira atividade
            </button>
          </div>
        )}
      </div>

      {/* Paginação */}
      {!loading && totalItems > 0 && (
        <div className="bg-white rounded-lg shadow mt-6">
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
        </div>
      )}

      {/* Modal Criar Atividade */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Nova Atividade</h2>
            <form onSubmit={handleCreateActivity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ActivityType })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
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
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as Priority })
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
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ActivityStatus })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {Object.values(ActivityStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'PENDING'
                            ? 'Pendente'
                            : status === 'IN_PROGRESS'
                              ? 'Em Andamento'
                              : status === 'COMPLETED'
                                ? 'Concluída'
                                : 'Cancelada'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Vencimento
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
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

      {/* Modal Editar Atividade */}
      {showEditModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Atividade</h2>
            <form onSubmit={handleUpdateActivity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ActivityType })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
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
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as Priority })
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
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ActivityStatus })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {Object.values(ActivityStatus).map((status) => (
                        <option key={status} value={status}>
                          {status === 'PENDING'
                            ? 'Pendente'
                            : status === 'IN_PROGRESS'
                              ? 'Em Andamento'
                              : status === 'COMPLETED'
                                ? 'Concluída'
                                : 'Cancelada'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Data de Vencimento
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Atualizar
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

export default ActivitiesPage;
