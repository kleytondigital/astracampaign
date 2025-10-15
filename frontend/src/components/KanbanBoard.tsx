import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { KanbanColumn } from './KanbanColumn';
import { OpportunityModal } from './OpportunityModal';
import { Opportunity, OpportunityStage } from '../types';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  opportunities: Opportunity[];
  onStageChange: (opportunityId: string, newStage: OpportunityStage) => Promise<void>;
  loading?: boolean;
}

const STAGES = [
  {
    id: 'PROSPECT',
    label: 'Prospecção',
    color: 'bg-gradient-to-br from-gray-500 to-gray-600',
  },
  {
    id: 'QUALIFIED',
    label: 'Qualificação',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    id: 'PROPOSAL',
    label: 'Proposta',
    color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  },
  {
    id: 'NEGOTIATION',
    label: 'Negociação',
    color: 'bg-gradient-to-br from-orange-500 to-orange-600',
  },
  {
    id: 'CLOSED_WON',
    label: 'Ganho',
    color: 'bg-gradient-to-br from-green-500 to-green-600',
  },
  {
    id: 'CLOSED_LOST',
    label: 'Perdido',
    color: 'bg-gradient-to-br from-red-500 to-red-600',
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  opportunities,
  onStageChange,
  loading = false,
}) => {
  const [opportunitiesByStage, setOpportunitiesByStage] = useState<
    Record<string, Opportunity[]>
  >({});
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Organizar oportunidades por estágio
  useEffect(() => {
    console.log('🎯 [Kanban] Total de oportunidades recebidas:', opportunities.length);
    console.log('🎯 [Kanban] Estágios das oportunidades:', opportunities.map(o => o.stage));
    
    const grouped = STAGES.reduce(
      (acc, stage) => {
        acc[stage.id] = opportunities.filter((opp) => opp.stage === stage.id);
        console.log(`🎯 [Kanban] Estágio ${stage.id}:`, acc[stage.id].length);
        return acc;
      },
      {} as Record<string, Opportunity[]>
    );
    setOpportunitiesByStage(grouped);
  }, [opportunities]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não há destino ou se largou no mesmo lugar
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const sourceStage = source.droppableId;
    const destStage = destination.droppableId;

    // Atualização otimista da UI
    const newOpportunitiesByStage = { ...opportunitiesByStage };
    const sourceOpps = Array.from(newOpportunitiesByStage[sourceStage]);
    const destOpps =
      sourceStage === destStage
        ? sourceOpps
        : Array.from(newOpportunitiesByStage[destStage]);

    // Remover da origem
    const [movedOpp] = sourceOpps.splice(source.index, 1);

    // Adicionar no destino
    destOpps.splice(destination.index, 0, {
      ...movedOpp,
      stage: destStage as OpportunityStage,
    });

    // Atualizar estado local
    newOpportunitiesByStage[sourceStage] = sourceOpps;
    newOpportunitiesByStage[destStage] = destOpps;
    setOpportunitiesByStage(newOpportunitiesByStage);

    // Atualizar no backend
    try {
      console.log(`🔄 [Kanban] Atualizando oportunidade ${draggableId} para estágio ${destStage}`);
      await onStageChange(draggableId, destStage as OpportunityStage);
      
      const stageLabel = STAGES.find(s => s.id === destStage)?.label || destStage;
      toast.success(`Oportunidade movida para ${stageLabel}!`);
      console.log(`✅ [Kanban] Oportunidade atualizada com sucesso!`);
    } catch (error: any) {
      console.error('❌ [Kanban] Erro ao atualizar estágio:', error);
      console.error('❌ [Kanban] Detalhes:', error.message);
      console.error('❌ [Kanban] Response:', error.response);
      
      // Reverter mudança em caso de erro
      setOpportunitiesByStage(opportunitiesByStage);
      
      // Extrair mensagem de erro do backend
      const errorMessage = error.response?.message || error.message || 'Erro desconhecido';
      toast.error(`Erro ao atualizar estágio: ${errorMessage}`);
    }
  };

  const handleCardClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedOpportunity(null), 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              opportunities={opportunitiesByStage[stage.id] || []}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </DragDropContext>

      <OpportunityModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

