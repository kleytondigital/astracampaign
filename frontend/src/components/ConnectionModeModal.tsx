import React, { useState, useEffect } from 'react';
import { X, Wifi, Webhook, AlertCircle, Check, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

interface ConnectionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  sessionId: string;
}

interface ConnectionState {
  webhookEnabled: boolean;
  websocketEnabled: boolean;
  webhookConfig?: {
    url: string;
    webhook_base64: boolean;
    webhook_by_events: boolean;
    events: string[];
  };
}

export const ConnectionModeModal: React.FC<ConnectionModeModalProps> = ({
  isOpen,
  onClose,
  sessionName,
  sessionId,
}) => {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ConnectionState | null>(null);
  const [selectedMode, setSelectedMode] = useState<'webhook' | 'websocket'>('webhook');
  const [webhookBase64, setWebhookBase64] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && sessionName) {
      loadConnectionState();
    }
  }, [isOpen, sessionName]);

  const loadConnectionState = async () => {
    try {
      const response = await fetch(`/api/instance-management/connection-state/${sessionName}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 [Frontend] Estado da conexão carregado:', data);
      console.log('📡 [Frontend] webhookConfig completo:', data.webhookConfig);
      console.log('📡 [Frontend] webhookBase64 recebido:', data.webhookConfig?.webhookBase64);
      console.log('📡 [Frontend] Tipo de webhookBase64:', typeof data.webhookConfig?.webhookBase64);

      setState(data);

      // ✅ Garantir que webhookBase64 seja boolean
      const base64Value = data.webhookConfig?.webhookBase64 === true;
      console.log('📡 [Frontend] webhookBase64 processado:', base64Value);
      console.log('📡 [Frontend] Estado ANTES de setar:', webhookBase64);

      setWebhookBase64(base64Value);

      // Verificar após um pequeno delay se o estado foi atualizado
      setTimeout(() => {
        console.log('📡 [Frontend] Estado DEPOIS de setar:', webhookBase64);
      }, 100);
      setWebhookUrl(data.webhookConfig?.url || `${window.location.origin}/api/webhooks/evolution`);
      setWebhookEvents(
        data.webhookConfig?.events || [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'MESSAGES_UPDATE',
        ]
      );
      setSelectedMode(data.webhookEnabled ? 'webhook' : 'websocket');

      console.log('📡 [Frontend] Estados atualizados:', {
        webhookBase64: base64Value,
        webhookUrl: data.webhookConfig?.url || `${window.location.origin}/api/webhooks/evolution`,
        webhookEvents: data.webhookConfig?.events || [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED',
          'MESSAGES_UPDATE',
        ],
        selectedMode: data.webhookEnabled ? 'webhook' : 'websocket',
      });
    } catch (error) {
      console.error('Erro ao carregar estado da conexão:', error);
      toast.error('Erro ao carregar estado da conexão');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedMode === 'webhook') {
        const payload = {
          url: webhookUrl,
          webhook_base64: webhookBase64,
          webhook_by_events: false,
          events: webhookEvents,
        };

        console.log('💾 [Frontend] Estado atual dos eventos:', webhookEvents);
        console.log('💾 [Frontend] Enviando configuração de webhook:', payload);
        console.log(
          '💾 [Frontend] URL completa da requisição:',
          `/api/instance-management/enable-webhook/${sessionName}`
        );
        console.log('💾 [Frontend] Headers da requisição:', {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        });

        const response = await fetch(`/api/instance-management/enable-webhook/${sessionName}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('💾 [Frontend] Status da resposta:', response.status);
        console.log(
          '💾 [Frontend] Headers da resposta:',
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('💾 [Frontend] Erro na resposta:', errorData);
          throw new Error(errorData.error || 'Erro ao ativar webhook');
        }

        const responseData = await response.json();
        console.log('💾 [Frontend] Resposta do servidor:', responseData);

        // Capturar logs do backend
        if (responseData.debugLogs) {
          setDebugLogs(responseData.debugLogs);
          console.log('💾 [Frontend] Logs do backend:', responseData.debugLogs);
        }

        toast.success('Webhook ativado! WebSocket foi desativado.');
      } else {
        const response = await fetch(`/api/instance-management/enable-websocket/${sessionName}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao ativar websocket');
        }

        toast.success('WebSocket ativado! Webhook foi desativado.');
      }

      await loadConnectionState();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600">
          <div>
            <h2 className="text-xl font-semibold text-white">
              📡 Configurar Recebimento de Mensagens
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              Sessão: <span className="font-medium">{sessionName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como funciona?</p>
              <p>
                Escolha como deseja receber mensagens do WhatsApp. Apenas um modo pode estar ativo
                por vez. Ao selecionar um modo, o outro será desativado automaticamente.
              </p>
            </div>
          </div>

          {/* Estado Atual */}
          {state && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Estado Atual:</p>
                  <p className="text-xs text-gray-600">
                    {state.webhookEnabled ? (
                      <span className="text-green-600 font-medium">🟢 Webhook Ativo</span>
                    ) : state.websocketEnabled ? (
                      <span className="text-purple-600 font-medium">🟣 WebSocket Ativo</span>
                    ) : (
                      <span className="text-red-600 font-medium">🔴 Nenhum Ativo</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seleção de Modo */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Escolha o Modo de Recebimento:</h3>

            {/* Opção Webhook */}
            <label
              className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMode === 'webhook'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="connectionMode"
                  value="webhook"
                  checked={selectedMode === 'webhook'}
                  onChange={(e) => setSelectedMode(e.target.value as 'webhook')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Webhook className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Webhook (Recomendado)</span>
                    {state?.webhookEnabled && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Recebe mensagens via HTTP POST. Ideal para produção, escalável e com suporte a
                    mídias em Base64.
                  </p>

                  {/* Configurações do Webhook */}
                  {selectedMode === 'webhook' && (
                    <div className="mt-3 pl-2 border-l-2 border-blue-300 space-y-4">
                      {/* URL do Webhook */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL do Webhook *
                        </label>
                        <input
                          type="text"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://seu-servidor.com/webhook"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 Use o endpoint do sistema ou integre com N8N, Make, etc.
                        </p>
                      </div>

                      {/* URLs Rápidas */}
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-xs font-medium text-blue-800 mb-2">URLs Rápidas:</p>
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setWebhookUrl(`${window.location.origin}/api/webhooks/evolution`)
                            }
                            className="text-xs text-blue-600 hover:text-blue-700 block"
                          >
                            📌 Sistema (Recomendado)
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebhookUrl('https://webhook.site/unique-url')}
                            className="text-xs text-gray-600 hover:text-gray-700 block"
                          >
                            🔗 Webhook.site (Teste)
                          </button>
                        </div>
                      </div>

                      {/* Eventos */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Eventos para Receber
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setWebhookEvents([])}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Limpar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWebhookEvents([
                                  'MESSAGES_UPSERT',
                                  'MESSAGES_UPDATE',
                                  'CONNECTION_UPDATE',
                                  'QRCODE_UPDATED',
                                ])
                              }
                              className="text-xs text-green-600 hover:text-green-700"
                            >
                              Selecionar Todos
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'MESSAGES_UPSERT', label: 'Novas mensagens' },
                            { value: 'MESSAGES_UPDATE', label: 'Atualizações de status' },
                            { value: 'CONNECTION_UPDATE', label: 'Status da conexão' },
                            { value: 'QRCODE_UPDATED', label: 'QR Code atualizado' },
                          ].map((event) => (
                            <label key={event.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={webhookEvents.includes(event.value)}
                                onChange={(e) => {
                                  let newEvents;
                                  if (e.target.checked) {
                                    newEvents = [...webhookEvents, event.value];
                                  } else {
                                    newEvents = webhookEvents.filter((ev) => ev !== event.value);
                                  }
                                  console.log(
                                    `🔧 [Frontend] Evento ${event.value} ${e.target.checked ? 'adicionado' : 'removido'}:`,
                                    newEvents
                                  );
                                  setWebhookEvents(newEvents);
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-xs">{event.label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {webhookEvents.length} evento(s) selecionado(s):{' '}
                          {webhookEvents.join(', ') || 'Nenhum'}
                        </div>
                      </div>

                      {/* Base64 */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Receber Base64</p>
                          <p className="text-xs text-blue-700">
                            Receber mídias em formato Base64 no webhook
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={webhookBase64}
                            onChange={(e) => setWebhookBase64(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-md text-xs text-blue-800">
                        <p className="font-medium mb-1">✅ Vantagens:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Mídias funcionam perfeitamente</li>
                          <li>Escalável (stateless)</li>
                          <li>URLs públicas geradas automaticamente</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>

            {/* Opção WebSocket */}
            <label
              className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedMode === 'websocket'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  name="connectionMode"
                  value="websocket"
                  checked={selectedMode === 'websocket'}
                  onChange={(e) => setSelectedMode(e.target.value as 'websocket')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wifi className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">WebSocket (Desenvolvimento)</span>
                    {state?.websocketEnabled && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Recebe mensagens em tempo real via conexão persistente. Útil para debug e
                    desenvolvimento.
                  </p>

                  {/* Aviso WebSocket */}
                  {selectedMode === 'websocket' && (
                    <div className="mt-3 pl-2 border-l-2 border-purple-300">
                      <div className="p-3 bg-yellow-50 rounded text-xs text-yellow-800">
                        <p className="font-medium mb-1">⚠️ Limitações:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Requer servidor sempre conectado</li>
                          <li>Menos escalável</li>
                          <li>Mídias sem Base64 (URLs criptografadas)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Resumo da Configuração */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Resumo:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <strong>Modo selecionado:</strong>{' '}
                {selectedMode === 'webhook' ? '🔗 Webhook' : '📡 WebSocket'}
              </p>
              {selectedMode === 'webhook' && (
                <>
                  <p>
                    <strong>URL:</strong> {webhookUrl || 'Não definida'}
                  </p>
                  <p>
                    <strong>Eventos:</strong> {webhookEvents.length} selecionados
                  </p>
                  <p>
                    <strong>Mídias em Base64:</strong> {webhookBase64 ? '✅ Sim' : '❌ Não'}
                  </p>
                </>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Ao salvar, o outro modo será desativado automaticamente.
              </p>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 mb-3">🐛 Debug Panel</h4>
            <div className="space-y-3 text-xs">
              {/* Estado Atual */}
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">Estado Atual:</h5>
                <div className="bg-white p-2 rounded border text-gray-700 font-mono">
                  <div>
                    webhookBase64:{' '}
                    <span className="font-bold text-blue-600">{String(webhookBase64)}</span>
                  </div>
                  <div>
                    webhookUrl: <span className="font-bold text-blue-600">"{webhookUrl}"</span>
                  </div>
                  <div>
                    webhookEvents:{' '}
                    <span className="font-bold text-blue-600">
                      [{webhookEvents.map((e) => `"${e}"`).join(', ')}]
                    </span>
                  </div>
                  <div>
                    selectedMode: <span className="font-bold text-blue-600">"{selectedMode}"</span>
                  </div>
                </div>
              </div>

              {/* Payload que será enviado */}
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">Payload que será enviado:</h5>
                <div className="bg-white p-2 rounded border text-gray-700 font-mono">
                  <pre>
                    {JSON.stringify(
                      {
                        url: webhookUrl,
                        webhook_base64: webhookBase64,
                        webhook_by_events: false,
                        events: webhookEvents,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {/* Estado carregado do servidor */}
              {state && (
                <div>
                  <h5 className="font-medium text-yellow-800 mb-1">
                    Estado carregado do servidor:
                  </h5>
                  <div className="bg-white p-2 rounded border text-gray-700 font-mono">
                    <pre>{JSON.stringify(state, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Logs do backend */}
              {debugLogs.length > 0 && (
                <div>
                  <h5 className="font-medium text-yellow-800 mb-1">Logs do Backend:</h5>
                  <div className="bg-black text-green-400 p-2 rounded border font-mono text-xs max-h-32 overflow-y-auto">
                    {debugLogs.map((log, index) => (
                      <div key={index} className="mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs do console */}
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">Logs do Console:</h5>
                <div className="bg-black text-green-400 p-2 rounded border font-mono text-xs max-h-32 overflow-y-auto">
                  <div>Abra o console do navegador (F12) para ver os logs detalhados</div>
                  <div className="text-gray-400 mt-1">
                    Procure por: 🔧 [Frontend], 🔧 [Backend], 🔧 [Evolution]
                  </div>
                </div>
              </div>

              {/* Botões de Debug */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🧪 [DEBUG] Forçando reload do estado...');
                    loadConnectionState();
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  🔄 Reload Estado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    console.log('🧪 [DEBUG] Testando envio...');
                    handleSave();
                  }}
                  disabled={loading}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                >
                  🧪 Testar Envio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDebugLogs([]);
                    console.log('🧪 [DEBUG] Logs limpos');
                  }}
                  className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  🗑️ Limpar Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || (selectedMode === 'webhook' && !webhookUrl.trim())}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Salvando...' : '💾 Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
};
