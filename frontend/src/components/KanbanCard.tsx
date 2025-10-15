import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Building2, User, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Opportunity } from '../types';

interface KanbanCardProps {
  opportunity: Opportunity;
  index: number;
  onClick: (opportunity: Opportunity) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ opportunity, index, onClick }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(opportunity)}
          className={`bg-white rounded-lg border p-4 mb-3 cursor-pointer transition-all hover:shadow-md ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : 'shadow-sm'
          }`}
        >
          {/* Título */}
          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {opportunity.title}
          </h4>

          {/* Valor */}
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(opportunity.value)}
            </span>
          </div>

          {/* Probabilidade */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Probabilidade
              </span>
              <span className="font-semibold">{opportunity.probability}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
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

          {/* Empresa/Contato */}
          <div className="space-y-1 mb-3">
            {opportunity.company && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{opportunity.company.name}</span>
              </div>
            )}
            {opportunity.contact && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-3 w-3" />
                <span className="truncate">{opportunity.contact.nome}</span>
              </div>
            )}
          </div>

          {/* Data de Fechamento */}
          {opportunity.expectedClose && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(opportunity.expectedClose)}</span>
            </div>
          )}

          {/* Tags */}
          {opportunity.tags && opportunity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {opportunity.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded"
                >
                  {tag}
                </span>
              ))}
              {opportunity.tags.length > 2 && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  +{opportunity.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

