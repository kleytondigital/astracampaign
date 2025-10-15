import React from 'react';
import { X, Building2, User, Mail, Phone, Calendar, TrendingUp, Tag, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Opportunity } from '../types';

interface OpportunityModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  opportunity,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !opportunity) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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

  const handleViewDetails = () => {
    navigate(`/oportunidades/${opportunity.id}`);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{opportunity.title}</h2>
                <div className="flex items-center gap-4">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {getStageLabel(opportunity.stage)}
                  </span>
                  <span className="text-3xl font-bold">
                    {formatCurrency(opportunity.value)}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Probabilidade */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Probabilidade de Fechamento
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {opportunity.probability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    opportunity.probability >= 75
                      ? 'bg-green-500'
                      : opportunity.probability >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${opportunity.probability}%` }}
                />
              </div>
            </div>

            {/* Descrição */}
            {opportunity.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                <p className="text-gray-600">{opportunity.description}</p>
              </div>
            )}

            {/* Informações da Empresa */}
            {opportunity.company && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-gray-900">{opportunity.company.name}</p>
                    {opportunity.company.industry && (
                      <p className="text-sm text-gray-600">{opportunity.company.industry}</p>
                    )}
                  </div>
                  {opportunity.company.website && (
                    <a
                      href={opportunity.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {opportunity.company.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Informações do Contato */}
            {opportunity.contact && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contato
                </h3>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">{opportunity.contact.nome}</p>
                  {opportunity.contact.email && (
                    <a
                      href={`mailto:${opportunity.contact.email}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      <Mail className="h-3 w-3" />
                      {opportunity.contact.email}
                    </a>
                  )}
                  {opportunity.contact.telefone && (
                    <a
                      href={`tel:${opportunity.contact.telefone}`}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                    >
                      <Phone className="h-3 w-3" />
                      {opportunity.contact.telefone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4" />
                  Data Prevista
                </div>
                <p className="text-gray-900">{formatDate(opportunity.expectedClose)}</p>
              </div>
              {opportunity.actualClose && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4" />
                    Data Real
                  </div>
                  <p className="text-gray-900">{formatDate(opportunity.actualClose)}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {opportunity.tags && opportunity.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {opportunity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-3 py-1 text-sm font-medium bg-purple-100 text-purple-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsável */}
            {opportunity.assignedToUser && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Responsável</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {opportunity.assignedToUser.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {opportunity.assignedToUser.nome}
                    </p>
                    <p className="text-sm text-gray-600">
                      {opportunity.assignedToUser.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Fechar
            </button>
            <button
              onClick={handleViewDetails}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              Ver Detalhes Completos
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

