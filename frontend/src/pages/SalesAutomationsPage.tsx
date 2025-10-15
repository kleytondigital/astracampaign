import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SalesAutomationsPage() {
  const [loading, setLoading] = useState(false);
  const [automations, setAutomations] = useState<any[]>([]);

  // Exemplos de automações de vendas pré-definidas
  const automationTemplates = [
    {
      id: 'lead-assignment',
      name: 'Atribuição Automática de Leads',
      description:
        'Atribui novos leads automaticamente aos vendedores com base em critérios como região, fonte, ou score.',
      icon: '🎯',
      trigger: 'Lead criado',
      action: 'Atribuir ao vendedor',
      status: 'active',
    },
    {
      id: 'follow-up-reminder',
      name: 'Lembrete de Follow-up',
      description:
        'Cria automaticamente uma atividade de follow-up após X dias de inatividade em uma oportunidade.',
      icon: '⏰',
      trigger: 'Oportunidade sem atividade há 3 dias',
      action: 'Criar atividade de follow-up',
      status: 'active',
    },
    {
      id: 'lead-score-update',
      name: 'Atualização de Score de Lead',
      description:
        'Atualiza o score do lead automaticamente com base em interações (abertura de email, cliques, respostas).',
      icon: '📊',
      trigger: 'Lead interage com campanha',
      action: 'Aumentar score em +10',
      status: 'inactive',
    },
    {
      id: 'opportunity-stage-move',
      name: 'Movimentação Automática de Estágio',
      description:
        'Move a oportunidade para o próximo estágio automaticamente quando certos critérios são atendidos.',
      icon: '➡️',
      trigger: 'Proposta enviada há 7 dias',
      action: 'Mover para Negociação',
      status: 'inactive',
    },
    {
      id: 'overdue-notification',
      name: 'Notificação de Atividade Atrasada',
      description: 'Envia notificação ao vendedor quando uma atividade está atrasada.',
      icon: '🔔',
      trigger: 'Atividade vencida',
      action: 'Enviar notificação',
      status: 'active',
    },
    {
      id: 'lost-opportunity-survey',
      name: 'Pesquisa de Oportunidade Perdida',
      description:
        'Solicita automaticamente o motivo da perda quando uma oportunidade é marcada como perdida.',
      icon: '📝',
      trigger: 'Oportunidade marcada como perdida',
      action: 'Solicitar motivo da perda',
      status: 'active',
    },
    {
      id: 'auto-convert-qualified-lead',
      name: 'Conversão Automática de Lead Qualificado',
      description:
        'Converte automaticamente leads com score acima de 80 em contatos e cria uma oportunidade.',
      icon: '🚀',
      trigger: 'Lead atinge score 80+',
      action: 'Converter em contato + criar oportunidade',
      status: 'inactive',
    },
    {
      id: 'idle-lead-nurture',
      name: 'Nutrição de Lead Inativo',
      description:
        'Adiciona leads inativos automaticamente a uma campanha de nutrição via WhatsApp ou Email.',
      icon: '🌱',
      trigger: 'Lead sem atividade há 30 dias',
      action: 'Adicionar à campanha de nutrição',
      status: 'inactive',
    },
  ];

  useEffect(() => {
    setAutomations(automationTemplates);
  }, []);

  const handleToggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id
          ? { ...auto, status: auto.status === 'active' ? 'inactive' : 'active' }
          : auto
      )
    );

    const automation = automations.find((a) => a.id === id);
    if (automation) {
      const newStatus = automation.status === 'active' ? 'inativa' : 'ativa';
      toast.success(`Automação "${automation.name}" agora está ${newStatus}.`);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
          Ativa
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
        Inativa
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Automações de Vendas</h1>
        <p className="text-gray-600">
          Configure regras e workflows para automatizar seu processo de vendas
        </p>
      </div>

      {/* Cards de Informação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-sm text-blue-700 font-medium">Automações Disponíveis</p>
          </div>
          <p className="text-3xl font-bold text-blue-900">{automations.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <p className="text-sm text-green-700 font-medium">Automações Ativas</p>
          </div>
          <p className="text-3xl font-bold text-green-900">
            {automations.filter((a) => a.status === 'active').length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <p className="text-sm text-purple-700 font-medium">Taxa de Automação</p>
          </div>
          <p className="text-3xl font-bold text-purple-900">
            {(
              (automations.filter((a) => a.status === 'active').length / automations.length) *
              100
            ).toFixed(0)}
            %
          </p>
        </div>
      </div>

      {/* Lista de Automações */}
      <div className="space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className={`bg-white border rounded-lg p-6 transition-all ${
              automation.status === 'active' ? 'border-green-200 shadow-md' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{automation.icon}</div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                    {getStatusBadge(automation.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{automation.description}</p>

                  {/* Trigger e Action */}
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded font-medium">
                        Gatilho:
                      </span>
                      <span className="text-sm text-gray-700">{automation.trigger}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded font-medium">
                        Ação:
                      </span>
                      <span className="text-sm text-gray-700">{automation.action}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggleAutomation(automation.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  automation.status === 'active' ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    automation.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Ações Adicionais */}
            {automation.status === 'active' && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    ⚙️ Configurar
                  </button>
                  <button className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                    📊 Ver Histórico
                  </button>
                  <button className="px-4 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                    🧪 Testar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Informações de Ajuda */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-blue-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">💡 Dicas para Automações</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Comece com automações simples e vá aumentando a complexidade gradualmente</li>
              <li>
                • Monitore o histórico de execuções para garantir que as regras estão funcionando
                corretamente
              </li>
              <li>• Use a função de "Testar" antes de ativar uma automação em produção</li>
              <li>• Combine múltiplas automações para criar workflows completos de vendas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}



