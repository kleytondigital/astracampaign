import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Tag,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsService } from '../services/opportunitiesService';
import { ChatWidget } from '../components/ChatWidget';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  score: number;
  tags: string[];
  customFields: Record<string, any>;
  convertedAt: string | null;
  convertedToContactId: string | null;
  assignedToUser?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'timeline' | 'history'>('info');
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLead();
    }
  }, [id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadById(id!);
      setLead(data);
    } catch (error: any) {
      console.error('Erro ao carregar lead:', error);
      toast.error('Erro ao carregar lead');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      await leadsService.deleteLead(id!);
      toast.success('Lead excluído com sucesso!');
      navigate('/leads');
    } catch (error: any) {
      toast.error('Erro ao excluir lead');
    }
  };

  const handleConvert = async () => {
    if (!window.confirm('Deseja converter este lead em contato?')) {
      return;
    }

    try {
      await leadsService.convertLead(id!);
      toast.success('Lead convertido em contato com sucesso!');
      loadLead(); // Reload to show updated status
    } catch (error: any) {
      toast.error('Erro ao converter lead');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-purple-100 text-purple-800',
      qualified: 'bg-green-100 text-green-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Novo',
      contacted: 'Contatado',
      qualified: 'Qualificado',
      proposal: 'Proposta',
      negotiation: 'Negociação',
      converted: 'Convertido',
      lost: 'Perdido',
    };
    return labels[status] || status;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      website: 'Website',
      social_media: 'Redes Sociais',
      referral: 'Indicação',
      cold_call: 'Cold Call',
      email_campaign: 'Campanha de Email',
      whatsapp_campaign: 'Campanha WhatsApp',
      event: 'Evento',
      ads: 'Anúncios',
      other: 'Outro',
    };
    return labels[source] || source;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead não encontrado</h2>
          <button onClick={() => navigate('/leads')} className="text-blue-600 hover:text-blue-800">
            Voltar para Leads
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
          onClick={() => navigate('/leads')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Leads
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}
              >
                {getStatusLabel(lead.status)}
              </span>
              <span className={`text-2xl font-bold flex items-center ${getScoreColor(lead.score)}`}>
                <Star className="h-6 w-6 mr-1 fill-current" />
                {lead.score}
              </span>
              <span className="text-gray-600 text-sm">Score do Lead</span>
            </div>
          </div>

          <div className="flex gap-2">
            {lead.status !== 'converted' && !lead.convertedAt && (
              <button
                onClick={handleConvert}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <UserCheck className="h-4 w-4" />
                Converter em Contato
              </button>
            )}
            <button
              onClick={() => navigate(`/leads/editar/${lead.id}`)}
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

      {/* Converted Alert */}
      {lead.convertedAt && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Lead convertido em contato em {new Date(lead.convertedAt).toLocaleDateString('pt-BR')}
              </p>
              {lead.convertedToContactId && (
                <Link
                  to={`/contatos/${lead.convertedToContactId}`}
                  className="text-sm text-green-700 hover:text-green-900 underline"
                >
                  Ver contato criado →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

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
            onClick={() => setActiveTab('timeline')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Timeline
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
            {/* Contact Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes de Contato</h2>
              <div className="space-y-4">
                {lead.email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:text-blue-800">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center">
                    <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{lead.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Lead Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Lead</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Origem</label>
                  <p className="mt-1 text-gray-900">{getSourceLabel(lead.source)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Score</label>
                  <div className="mt-1">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-4">
                        <div
                          className={`h-2 rounded-full ${
                            lead.score >= 80
                              ? 'bg-green-500'
                              : lead.score >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </div>
                  </div>
                </div>

                {lead.tags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {lead.tags.map((tag) => (
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

                {/* Custom Fields */}
                {Object.keys(lead.customFields || {}).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                      Campos Personalizados
                    </label>
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      {Object.entries(lead.customFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="text-gray-900 font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned To */}
            {lead.assignedToUser && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Responsável</h3>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {lead.assignedToUser.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{lead.assignedToUser.nome}</p>
                    <p className="text-sm text-gray-500">{lead.assignedToUser.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Score Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Análise de Score</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Qualidade</span>
                  <span
                    className={`text-sm font-semibold ${
                      lead.score >= 80
                        ? 'text-green-600'
                        : lead.score >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {lead.score >= 80 ? 'Alta' : lead.score >= 50 ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prioridade</span>
                  <span
                    className={`text-sm font-semibold ${
                      lead.score >= 80
                        ? 'text-red-600'
                        : lead.score >= 50
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {lead.score >= 80 ? 'Urgente' : lead.score >= 50 ? 'Normal' : 'Baixa'}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    {lead.score >= 80
                      ? '✅ Lead de alta qualidade! Priorize o contato.'
                      : lead.score >= 50
                        ? '⚠️ Lead com potencial. Continue o acompanhamento.'
                        : '📋 Lead requer mais qualificação.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">Criado em</p>
                    <p className="text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">Última atualização</p>
                    <p className="text-sm text-gray-500">
                      {new Date(lead.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {lead.convertedAt && (
                  <div className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-900">Convertido em</p>
                      <p className="text-sm text-gray-500">
                        {new Date(lead.convertedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Timeline Item */}
            <div className="flex">
              <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-3"></div>
                  <p className="text-sm font-medium text-gray-900">Lead Criado</p>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Lead adicionado ao sistema via {getSourceLabel(lead.source)}
                </p>
              </div>
            </div>

            {lead.convertedAt && (
              <div className="flex">
                <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                  {new Date(lead.convertedAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
                    <p className="text-sm font-medium text-gray-900">Lead Convertido</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Lead convertido com sucesso em contato
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Histórico de alterações será implementado em breve</p>
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {lead && lead.phone && (
        <ChatWidget
          phone={lead.phone}
          contactName={`${lead.firstName} ${lead.lastName}`}
        />
      )}
    </div>
  );
};

export default LeadDetailPage;
