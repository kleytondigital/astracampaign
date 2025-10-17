import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { KanbanCard } from './KanbanCard';
import { Opportunity } from '../types';

interface KanbanColumnProps {
  stage: {
    id: string;
    label: string;
    color: string;
  };
  opportunities: Opportunity[];
  onCardClick: (opportunity: Opportunity) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  opportunities,
  onCardClick,
}) => {
  const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex-shrink-0 w-80">
      {/* Header da Coluna */}
      <div className={`rounded-t-lg p-4 ${stage.color}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white text-lg">{stage.label}</h3>
          <span className="bg-white/20 text-white text-sm font-medium px-2 py-1 rounded">
            {opportunities.length}
          </span>
        </div>
        <div className="text-white/90 text-sm font-medium">
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Lista de Cards */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bg-gray-100 rounded-b-lg p-4 min-h-[500px] max-h-[calc(100vh-300px)] overflow-y-auto transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
            }`}
          >
            {opportunities.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">Nenhuma oportunidade</p>
              </div>
            )}

            {opportunities.map((opportunity, index) => (
              <KanbanCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};





