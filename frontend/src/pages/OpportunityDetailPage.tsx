import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  DollarSign,
  Calendar,
  TrendingUp,
  Tag,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { opportunitiesService, activitiesService } from '../services/opportunitiesService';

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedClose: string | null;
  actualClose: string | null;
  source: string | null;
  description: string | null;
  tags: string[];
  contact?: {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
  } | null;
  company?: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
  } | null;
  assignedToUser?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  description: string | null;
  dueDate: string | null;
  completedAt: string | null;
  status: string;
  priority: string;
  assignedToUser?: {
    nome: string;
  } | null;
}

const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'activities' | 'history'>('info');
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOpportunity();
      loadActivities();
    }
  }, [id]);

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesService.getOpportunityById(id!);
      setOpportunity(data);
    } catch (error: any) {
      console.error('Erro ao carregar oportunidade:', error);
      toast.error('Erro ao carregar oportunidade');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await activitiesService.getActivities({ opportunityId: id });
      setActivities(response.activities || response.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar atividades:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      return;
    }

    try {
      await opportunitiesService.deleteOpportunity(id!);
      toast.success('Oportunidade excluída com sucesso!');
      navigate('/oportunidades');
    } catch (error: any) {
      toast.error('Erro ao excluir oportunidade');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECT: 'bg-gray-100 text-gray-800',
      QUALIFIED: 'bg-blue-100 text-blue-800',
      PROPOSAL: 'bg-yellow-100 text-yellow-800',
      NEGOTIATION: 'bg-orange-100 text-orange-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      PROSPECT: 'Prospecção',
      QUALIFIED: 'Qualificação',
      PROPOSAL: 'Proposta',
      NEGOTIATION: 'Negociação',
      CLOSED_WON: 'Ganho',
      CLOSED_LOST: 'Perdido',
    };
    return labels[stage] || stage;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, any> = {
      call: Phone,
      email: Mail,
      meeting: User,
      task: CheckCircle,
    };
    return icons[type] || CheckCircle;
  };

  const getActivityColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'border-yellow-500 bg-yellow-50',
      in_progress: 'border-blue-500 bg-blue-50',
      completed: 'border-green-500 bg-green-50',
      cancelled: 'border-gray-500 bg-gray-50',
    };
    return colors[status] || 'border-gray-500 bg-gray-50';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return badges[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Oportunidade não encontrada
          </h2>
          <button
            onClick={() => navigate('/oportunidades')}
            className="text-blue-600 hover:text-blue-800"
          >
            Voltar para Oportunidades
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/oportunidades')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Oportunidades
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{opportunity.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStageColor(opportunity.stage)}`}
              >
                {getStageLabel(opportunity.stage)}
              </span>
              <span className="text-2xl font-bold text-green-600">
                R$ {opportunity.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="flex items-center text-gray-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {opportunity.probability}% de probabilidade
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/oportunidades/editar/${opportunity.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Atividades ({activities.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Histórico
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Detalhes da Oportunidade
              </h2>
              <div className="space-y-4">
                {opportunity.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="mt-1 text-gray-900">{opportunity.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {opportunity.source && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Origem</label>
                      <p className="mt-1 text-gray-900 capitalize">{opportunity.source}</p>
                    </div>
                  )}

                  {opportunity.expectedClose && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data Prevista de Fechamento
                      </label>
                      <p className="mt-1 text-gray-900">
                        {new Date(opportunity.expectedClose).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {opportunity.actualClose && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Data Real de Fechamento
                      </label>
                      <p className="mt-1 text-gray-900">
                        {new Date(opportunity.actualClose).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {opportunity.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            {opportunity.contact && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Contato
                </h2>
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/contatos/${opportunity.contact.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {opportunity.contact.nome}
                    </Link>
                  </div>
                  {opportunity.contact.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <a href={`mailto:${opportunity.contact.email}`} className="hover:text-blue-600">
                        {opportunity.contact.email}
                      </a>
                    </div>
                  )}
                  {opportunity.contact.telefone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <a href={`tel:${opportunity.contact.telefone}`} className="hover:text-blue-600">
                        {opportunity.contact.telefone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Company Info */}
            {opportunity.company && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Empresa
                </h2>
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/empresas/${opportunity.company.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {opportunity.company.name}
                    </Link>
                  </div>
                  {opportunity.company.industry && (
                    <div className="text-gray-600">
                      <span className="font-medium">Indústria:</span> {opportunity.company.industry}
                    </div>
                  )}
                  {opportunity.company.website && (
                    <div>
                      <a
                        href={opportunity.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {opportunity.company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned To */}
            {opportunity.assignedToUser && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Responsável</h3>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {opportunity.assignedToUser.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {opportunity.assignedToUser.nome}
                    </p>
                    <p className="text-sm text-gray-500">{opportunity.assignedToUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">Criado em</p>
                    <p className="text-sm text-gray-500">
                      {new Date(opportunity.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">Última atualização</p>
                    <p className="text-sm text-gray-500">
                      {new Date(opportunity.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma atividade encontrada</p>
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className={`bg-white rounded-lg border-l-4 p-4 ${getActivityColor(activity.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <Icon className="h-5 w-5 mr-3 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{activity.subject}</h3>
                        {activity.description && (
                          <p className="text-gray-600 mt-1">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {activity.dueDate && (
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {activity.assignedToUser && (
                            <span className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {activity.assignedToUser.nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(activity.priority)}`}
                      >
                        {activity.priority}
                      </span>
                      {activity.completedAt && (
                        <span className="text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Concluída
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Histórico de alterações será implementado em breve
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityDetailPage;
