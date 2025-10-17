import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { chatsService } from '../services/chatsService';
import { websocketService } from '../services/websocketService';
import { chatAssignmentsService } from '../services/chatAssignmentsService';
import { Chat, Message, ChatStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { MessageBubble } from '../components/MessageBubble';
import { MediaPreviewModal } from '../components/MediaPreviewModal';
import { MediaCaptionModal } from '../components/MediaCaptionModal';
import { TransferChatModal } from '../components/TransferChatModal';
import { EditContactModal } from '../components/EditContactModal';
import { Image, Video, Mic, Paperclip, Send, MicOff, Square, Users, CheckCircle, XCircle, Edit3, Clock, User } from 'lucide-react';

export default function AtendimentoPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [stats, setStats] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: string } | null>(null);

  // Estados para preview com caption (estilo WhatsApp Web)
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);
  const [pendingMediaType, setPendingMediaType] = useState<
    'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
  >('IMAGE');

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalRecordingTime, setFinalRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef<number>(0); // Ref para ter sempre o valor mais recente

  // Estados para modal de transferência
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [closingChat, setClosingChat] = useState(false);
  
  // Estados para modal de edição de contato
  const [editContactModalOpen, setEditContactModalOpen] = useState(false);

  // WebSocket para receber mensagens em tempo real
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || !user?.tenantId) return;

    console.log('🔌 [Frontend] Conectando ao WebSocket...');

    // Conectar ao WebSocket
    websocketService.connect(token, user.tenantId);

    // Escutar novas mensagens
    websocketService.onNewMessage(user.tenantId, (data) => {
      console.log('📨 [Frontend] Nova mensagem recebida:', data);

      // Atualizar lista de chats
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex((c) => c.id === data.chatId);
        if (chatIndex >= 0) {
          // Chat já existe, atualizar
          const updatedChats = [...prevChats];
          updatedChats[chatIndex] = {
            ...updatedChats[chatIndex],
            lastMessage: data.chat.lastMessage,
            lastMessageAt: data.chat.lastMessageAt,
            unreadCount: data.chat.unreadCount,
          };
          // Mover para o topo
          const [updatedChat] = updatedChats.splice(chatIndex, 1);
          return [updatedChat, ...updatedChats];
        } else {
          // Chat novo, adicionar no topo
          return [data.chat, ...prevChats];
        }
      });

      // Se for o chat selecionado, adicionar mensagem
      // Usar setSelectedChat para acessar o valor atual sem causar re-render
      setSelectedChat((currentChat) => {
        if (currentChat?.id === data.chatId) {
          setMessages((prevMessages) => [...prevMessages, data.message]);

          // Marcar como lido automaticamente se não for mensagem enviada
          if (!data.message.fromMe) {
            setTimeout(() => {
              chatsService.markChatAsRead(data.chatId).catch(console.error);
            }, 1000);

            // Tocar som de notificação
            playNotificationSound();
          }
        } else if (!data.message.fromMe) {
          // Notificação toast se não for o chat ativo
          toast('Nova mensagem de ' + (data.chat.contactName || data.chat.phone), {
            icon: '💬',
            duration: 3000,
          });
        }
        return currentChat; // Retorna o mesmo valor para não causar re-render
      });

      // Atualizar estatísticas
      loadStats();
    });

    // Cleanup
    return () => {
      console.log('🔌 [Frontend] Desconectando WebSocket...');
      websocketService.offNewMessage(user.tenantId!);
      websocketService.disconnect();
    };
  }, [user]);

  // Cleanup para gravação de áudio
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioRecorder && isRecording) {
        audioRecorder.stop();
      }
    };
  }, [audioRecorder, isRecording]); // ✅ Removido selectedChat das dependências para evitar reconexões

  // Auto-refresh removido - WebSocket agora está ativo e funcional
  // As mensagens chegam em tempo real via WebSocket

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatsService.getChats({
        status: statusFilter as ChatStatus,
        search: searchFilter,
        pageSize: 50,
      });
      setChats(response.chats);
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchFilter]);

  const loadMessagesRef = useRef(false); // Ref para controlar se está carregando

  const loadMessages = useCallback(async (chatId: string) => {
    // Evitar chamadas duplicadas usando ref
    if (loadMessagesRef.current) {
      console.log('⏳ Já está carregando mensagens, aguarde...');
      return;
    }

    try {
      loadMessagesRef.current = true;
      setLoadingMessages(true);
      console.log('📥 Carregando mensagens do chat:', chatId);

      const response = await chatsService.getChatById(chatId, {
        messagesPageSize: 100,
      });

      setMessages(response.messages);

      // Atualizar selectedChat com dados frescos do servidor
      setSelectedChat((prev) => {
        // Só atualiza se for o mesmo chat (evita conflitos)
        if (prev?.id === chatId) {
          return response.chat;
        }
        return prev;
      });

      console.log(`✅ Mensagens carregadas: ${response.messages.length} mensagens`);

      // Marcar como lido
      if (response.chat.unreadCount > 0) {
        await chatsService.markChatAsRead(chatId);
        // ⚠️ Removido loadChats() aqui para evitar loop - WebSocket atualizará
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
      loadMessagesRef.current = false;
    }
  }, []); // ✅ Sem dependências - usa ref ao invés de state

  const loadStats = useCallback(async () => {
    try {
      const response = await chatsService.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, []);

  // Handler para selecionar chat (evita re-renders)
  const handleSelectChat = useCallback(
    (chat: Chat) => {
      // Só atualiza se for um chat diferente
      if (selectedChat?.id !== chat.id) {
        setSelectedChat(chat);
      }
    },
    [selectedChat?.id]
  );

  // ============================================================================
  // USE EFFECTS - Colocados DEPOIS dos useCallback para evitar erros de inicialização
  // ============================================================================

  // Carregar chats ao mudar filtros
  useEffect(() => {
    loadChats();
    loadStats();
  }, [statusFilter, loadChats, loadStats]);

  // Carregar mensagens quando selecionar chat (baseado apenas no ID)
  useEffect(() => {
    if (selectedChat?.id) {
      loadMessages(selectedChat.id);
    } else {
      setMessages([]);
    }
  }, [selectedChat?.id, loadMessages]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: monitorar mudanças no recordingTime
  useEffect(() => {
    if (isRecording) {
      console.log('🎬 [UI] recordingTime mudou para:', recordingTime);
    }
  }, [recordingTime, isRecording]);

  // ============================================================================
  // HANDLERS DE AÇÕES
  // ============================================================================

  const handleSyncChats = async () => {
    if (!sessionName.trim()) {
      toast.error('Digite o nome da sessão Evolution para sincronizar');
      return;
    }

    try {
      setSyncing(true);
      const response = await chatsService.syncChatsFromEvolution(sessionName);
      toast.success(response.message);

      // Recarregar chats e stats
      await loadChats();
      await loadStats();
    } catch (error: any) {
      console.error('Erro ao sincronizar chats:', error);
      toast.error(error.message || 'Erro ao sincronizar chats');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    // Determinar tipo de mídia
    let mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
    if (file.type.startsWith('image/')) mediaType = 'IMAGE';
    else if (file.type.startsWith('video/')) mediaType = 'VIDEO';
    else if (file.type.startsWith('audio/')) mediaType = 'AUDIO';

    // Armazenar arquivo pendente e abrir modal de caption
    setPendingFile(file);
    setPendingMediaType(mediaType);
    setCaptionModalOpen(true);

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar mídia com caption (após confirmação no modal)
  const handleSendMediaWithCaption = async (caption: string) => {
    if (!pendingFile || !selectedChat) return;

    try {
      setUploading(true);
      setCaptionModalOpen(false);
      toast.loading('Fazendo upload do arquivo...', { id: 'upload' });

      // Upload do arquivo
      const uploadResponse = await chatsService.uploadMedia(pendingFile);

      if (!uploadResponse.success) {
        throw new Error('Falha no upload do arquivo');
      }

      toast.success('Upload concluído! Enviando...', { id: 'upload' });

      // Enviar mensagem com mídia e caption
      const messageType = uploadResponse.data.mediaType;
      const response = await chatsService.sendMessage(selectedChat.id, {
        body: caption || `Arquivo: ${uploadResponse.data.originalname}`,
        type: messageType,
        mediaUrl: uploadResponse.data.url,
      });

      // Adicionar mensagem à lista
      setMessages((prev) => [...prev, response.message]);
      setMessageText('');
      setPendingFile(null);
      setPendingFileUrl(null);
      toast.success('Mídia enviada com sucesso!', { id: 'upload' });
    } catch (error: any) {
      console.error('Erro ao enviar mídia:', error);
      toast.error(error.message || 'Erro ao enviar mídia', { id: 'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !selectedChat) return;

    try {
      setSending(true);
      const response = await chatsService.sendMessage(selectedChat.id, {
        body: messageText,
        type: 'TEXT',
      });

      // Adicionar mensagem à lista
      setMessages((prev) => [...prev, response.message]);
      setMessageText('');
      toast.success('Mensagem enviada!');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleMediaClick = (url: string, type: string) => {
    setPreviewMedia({ url, type });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Funções de gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setAudioRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Timer de gravação
      recordingIntervalRef.current = setInterval(() => {
        const newTime = recordingTimeRef.current + 1;
        recordingTimeRef.current = newTime;
        setRecordingTime(newTime);
        console.log('⏱️ Timer incrementando:', newTime, '- State será atualizado para:', newTime);
      }, 1000);
      
      console.log('✅ Timer iniciado, interval ID:', recordingIntervalRef.current);

      toast.success('🎤 Gravação iniciada!');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (audioRecorder && isRecording) {
      audioRecorder.stop();
      setIsRecording(false);
      
      // Salvar o tempo final usando o ref (sempre tem o valor mais recente)
      const finalTime = recordingTimeRef.current;
      console.log('🛑 Parando gravação - tempo atual:', finalTime);
      setFinalRecordingTime(finalTime);
      console.log('💾 Tempo final salvo:', finalTime);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      toast.success('✅ Gravação finalizada!');
    }
  };

  const sendRecordedAudio = async () => {
    if (!recordedAudio || !selectedChat) return;

    try {
      setUploading(true);
      toast.loading('Enviando áudio gravado...', { id: 'audio-upload' });

      // Criar arquivo a partir do blob
      // WAHA precisa de audio/ogg com codec opus
      const audioFile = new File([recordedAudio], `audio-${Date.now()}.ogg`, {
        type: 'audio/ogg; codecs=opus',
      });

      const uploadResponse = await chatsService.uploadMedia(audioFile);

      if (!uploadResponse.success) {
        throw new Error('Falha no upload do áudio');
      }

      const response = await chatsService.sendMessage(selectedChat.id, {
        body: `Áudio gravado (${formatRecordingTime(finalRecordingTime)})`,
        type: 'AUDIO',
        mediaUrl: uploadResponse.data.url,
      });

      setMessages((prev) => [...prev, response.message]);
      setRecordedAudio(null);
      setRecordingTime(0);
      setFinalRecordingTime(0);
      recordingTimeRef.current = 0;
      toast.success('Áudio enviado com sucesso!', { id: 'audio-upload' });
    } catch (error: any) {
      console.error('Erro ao enviar áudio gravado:', error);
      toast.error(error.message || 'Erro ao enviar áudio', { id: 'audio-upload' });
    } finally {
      setUploading(false);
    }
  };

  const cancelRecording = () => {
    if (audioRecorder && isRecording) {
      audioRecorder.stop();
    }
    setIsRecording(false);
    setRecordedAudio(null);
    setRecordingTime(0);
    setFinalRecordingTime(0);
    recordingTimeRef.current = 0;

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  // ============================================================================
  // FUNÇÕES DE GERENCIAMENTO DE CHAT
  // ============================================================================

  const handleTransferSuccess = () => {
    toast.success('Chat transferido com sucesso!');
    // Recarregar lista de chats
    loadChats();
    // Recarregar chat selecionado se ainda estiver aberto
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedChat) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja encerrar este atendimento? O chat será marcado como fechado.'
    );

    if (!confirmed) return;

    setClosingChat(true);
    try {
      await chatAssignmentsService.closeChat(selectedChat.id, 'Atendimento encerrado pelo usuário');
      toast.success('Atendimento encerrado com sucesso!');
      
      // Atualizar status local do chat
      setSelectedChat({
        ...selectedChat,
        status: ChatStatus.RESOLVED,
        serviceStatus: 'CLOSED' as any,
      });
      
      // Recarregar lista de chats
      loadChats();
    } catch (error: any) {
      console.error('Erro ao encerrar atendimento:', error);
      toast.error(error.message || 'Erro ao encerrar atendimento');
    } finally {
      setClosingChat(false);
    }
  };

  const handleResolveChat = async () => {
    if (!selectedChat) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja marcar este chat como resolvido?'
    );

    if (!confirmed) return;

    setClosingChat(true);
    try {
      await chatsService.updateChatStatus(selectedChat.id, ChatStatus.RESOLVED);
      toast.success('Chat marcado como resolvido!');
      
      // Atualizar status local do chat
      setSelectedChat({
        ...selectedChat,
        status: ChatStatus.RESOLVED,
      });
      
      // Recarregar lista de chats
      loadChats();
    } catch (error: any) {
      console.error('Erro ao resolver chat:', error);
      toast.error(error.message || 'Erro ao marcar chat como resolvido');
    } finally {
      setClosingChat(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = () => {
    try {
      // Som de notificação simples usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      });
    }
  };

  const getContactName = (chat: Chat) => {
    if (chat.contact) return chat.contact.nome;
    if (chat.lead) return `${chat.lead.firstName} ${chat.lead.lastName}`;
    return chat.phone;
  };

  const getStatusBadge = (status: ChatStatus) => {
    const badges = {
      OPEN: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-gray-100 text-gray-800',
      ARCHIVED: 'bg-gray-100 text-gray-600',
    };

    const labels = {
      OPEN: 'Aberto',
      PENDING: 'Pendente',
      RESOLVED: 'Resolvido',
      ARCHIVED: 'Arquivado',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* COLUNA 1: LISTA DE CONVERSAS */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">💬 Atendimento</h1>

          {/* Sincronizar Chats */}
          {/* <div className="mb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da sessão Evolution"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSyncChats()}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={syncing}
              />
              <button
                onClick={handleSyncChats}
                disabled={syncing || !sessionName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Sincronizar chats da Evolution API"
              >
                {syncing ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sync...
                  </>
                ) : (
                  <>🔄 Sync</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digite o nome da instância e clique para importar chats
            </p>
          </div> */}

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{stats.open}</div>
                <div className="text-xs text-gray-600">Abertos</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{stats.unread}</div>
                <div className="text-xs text-gray-600">Não lidos</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">{stats.today}</div>
                <div className="text-xs text-gray-600">Hoje</div>
              </div>
            </div>
          )}

          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadChats()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="OPEN">Abertos</option>
            <option value="PENDING">Pendentes</option>
            <option value="RESOLVED">Resolvidos</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
        </div>

        {/* Lista de Chats */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {/* Foto de perfil ou avatar */}
                    {chat.profilePicture ? (
                      <img
                        src={chat.profilePicture}
                        alt={getContactName(chat)}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          // Se a imagem falhar ao carregar, mostrar avatar padrão
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold ${
                        chat.profilePicture ? 'hidden' : ''
                      }`}
                    >
                      {getContactName(chat).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {chat.contactName || chat.phone}
                        </h3>
                        {chat.isSyncing && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-blue-600"
                            title="Sincronizando histórico..."
                          >
                            <svg
                              className="animate-spin h-3 w-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{chat.phone}</p>
                      {/* Badge do Departamento e Status */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {chat.department && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                            style={{
                              backgroundColor: `${chat.department.color}20`,
                              color: chat.department.color,
                            }}
                          >
                            <Users className="w-3 h-3" />
                            {chat.department.name}
                          </span>
                        )}
                        
                        {/* Status do Atendimento */}
                        {chat.serviceStatus === 'WAITING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                            <Clock className="w-3 h-3" />
                            Aguardando
                          </span>
                        )}
                        
                        {chat.serviceStatus === 'ACTIVE' && chat.assignedUser && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <User className="w-3 h-3" />
                            {chat.assignedUser.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {chat.lastMessageAt && (
                      <span className="text-xs text-gray-500">
                        {formatDate(chat.lastMessageAt)}
                      </span>
                    )}
                    {chat.unreadCount > 0 && (
                      <div className="mt-1">
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {chat.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage || 'Sem mensagens'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUNA 2: ÁREA DE CHAT */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Foto de perfil ou avatar */}
                  {selectedChat.profilePicture ? (
                    <img
                      src={selectedChat.profilePicture}
                      alt={getContactName(selectedChat)}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      selectedChat.profilePicture ? 'hidden' : ''
                    }`}
                  >
                    {getContactName(selectedChat).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900">
                        {selectedChat.contactName || selectedChat.phone}
                      </h2>
                      {selectedChat.isSyncing && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                          title="Sincronizando histórico completo... Mensagens não estão sendo recebidas no momento"
                        >
                          <svg
                            className="animate-spin h-3 w-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Sincronizando...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">{selectedChat.phone}</p>
                      {/* Badge do Departamento */}
                      {selectedChat.department && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${selectedChat.department.color}20`,
                            color: selectedChat.department.color,
                          }}
                        >
                          <Users className="w-3 h-3" />
                          {selectedChat.department.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botões de Ação */}
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    disabled={closingChat}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Transferir Chat"
                  >
                    <Users className="w-4 h-4" />
                    Transferir
                  </button>
                  
                  <button
                    onClick={handleResolveChat}
                    disabled={closingChat || selectedChat.status === ChatStatus.RESOLVED}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Marcar como Resolvido"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolvido
                  </button>
                  
                  <button
                    onClick={handleCloseChat}
                    disabled={closingChat}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Encerrar Atendimento"
                  >
                    <XCircle className="w-4 h-4" />
                    Encerrar
                  </button>
                  
                  {/* Badge de Status */}
                  <div>{getStatusBadge(selectedChat.status)}</div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm">Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <svg
                    className="w-16 h-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm">Inicie a conversa!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} onMediaClick={handleMediaClick} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Input file oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e)}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                />

                {/* Área de gravação de áudio */}
                {isRecording && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-700 font-medium">
                        Gravando... {formatRecordingTime(recordingTime)}
                        {/* Debug: valor atual: {recordingTime} */}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="Parar gravação"
                      >
                        <Square size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview do áudio gravado */}
                {recordedAudio && !isRecording && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mic size={20} className="text-green-600" />
                      <span className="text-green-700 font-medium">
                        Áudio gravado ({formatRecordingTime(finalRecordingTime)})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Cancelar"
                      >
                        ✕
                      </button>
                      <button
                        type="button"
                        onClick={sendRecordedAudio}
                        disabled={uploading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                      >
                        {uploading ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botões de Mídia - Estilo WhatsApp Web */}
                <div className="flex items-center space-x-1">
                  {/* Botão de Imagem */}
                  <button
                    type="button"
                    onClick={() => {
                      const input = fileInputRef.current;
                      if (input) {
                        input.accept = 'image/*';
                        input.click();
                      }
                    }}
                    disabled={uploading || sending || isRecording}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 hover:text-gray-800"
                    title="Enviar imagem"
                  >
                    <Image size={20} />
                  </button>

                  {/* Botão de Vídeo */}
                  <button
                    type="button"
                    onClick={() => {
                      const input = fileInputRef.current;
                      if (input) {
                        input.accept = 'video/*';
                        input.click();
                      }
                    }}
                    disabled={uploading || sending || isRecording}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 hover:text-gray-800"
                    title="Enviar vídeo"
                  >
                    <Video size={20} />
                  </button>

                  {/* Botão de Áudio - Duas opções */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => {
                        const input = fileInputRef.current;
                        if (input) {
                          input.accept = 'audio/*';
                          input.click();
                        }
                      }}
                      disabled={uploading || sending || isRecording}
                      className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 hover:text-gray-800"
                      title="Enviar arquivo de áudio"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>

                  {/* Botão de Documento */}
                  <button
                    type="button"
                    onClick={() => {
                      const input = fileInputRef.current;
                      if (input) {
                        input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip';
                        input.click();
                      }
                    }}
                    disabled={uploading || sending || isRecording}
                    className="p-3 text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 hover:text-gray-800"
                    title="Enviar documento"
                  >
                    <Paperclip size={20} className="rotate-45" />
                  </button>

                  {/* Botão de Gravação de Áudio */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploading || sending}
                    className={`p-3 rounded-full transition-colors disabled:opacity-50 ${
                      isRecording
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                    title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                </div>

                {/* Campo de texto e botão enviar */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={sending || uploading || isRecording}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim() && !sending && !uploading && !isRecording) {
                          handleSendMessage(e);
                        }
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || uploading || !messageText.trim() || isRecording}
                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Enviar mensagem"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Bem-vindo ao Atendimento!</h2>
            <p className="text-sm">Selecione uma conversa ao lado para começar</p>
          </div>
        )}
      </div>

      {/* COLUNA 3: DETALHES */}
      {selectedChat && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="font-bold text-gray-900 mb-4">Informações</h3>

          {/* Informações do Contato/Lead */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {getContactName(selectedChat).charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="text-center mb-4">
              <h4 className="font-bold text-gray-900">{getContactName(selectedChat)}</h4>
              <p className="text-sm text-gray-500">{selectedChat.phone}</p>
              
              {/* Botão Editar Informações */}
              <button
                onClick={() => setEditContactModalOpen(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Editar Informações
              </button>
            </div>

            {selectedChat.contact && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs font-semibold text-blue-900 mb-1">CONTATO</p>
                {selectedChat.contact.email && (
                  <p className="text-sm text-gray-700">📧 {selectedChat.contact.email}</p>
                )}
                {selectedChat.contact.telefone && (
                  <p className="text-sm text-gray-700">📱 {selectedChat.contact.telefone}</p>
                )}
              </div>
            )}

            {selectedChat.lead && (
              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <p className="text-xs font-semibold text-purple-900 mb-1">LEAD</p>
                <p className="text-sm text-gray-700">
                  {selectedChat.lead.firstName} {selectedChat.lead.lastName}
                </p>
                {selectedChat.lead.email && (
                  <p className="text-sm text-gray-700">📧 {selectedChat.lead.email}</p>
                )}
                {selectedChat.lead.company && (
                  <p className="text-sm text-gray-700">🏢 {selectedChat.lead.company}</p>
                )}
                <p className="text-sm text-gray-700">📊 Score: {selectedChat.lead.score}</p>
                <p className="text-sm text-gray-700">📍 Status: {selectedChat.lead.status}</p>
              </div>
            )}
            
            {!selectedChat.contact && !selectedChat.lead && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-center">
                <p className="text-xs text-gray-600">
                  Nenhum contato ou lead associado
                </p>
                <button
                  onClick={() => setEditContactModalOpen(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Criar agora
                </button>
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className="space-y-2">
            <button
              onClick={() => {
                // TODO: Implementar criação de oportunidade
                toast('Em breve: Criar Oportunidade', { icon: 'ℹ️' });
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              💼 Criar Oportunidade
            </button>

            <button
              onClick={() => {
                // TODO: Implementar agendamento de atividade
                toast('Em breve: Agendar Atividade', { icon: 'ℹ️' });
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              📅 Agendar Atividade
            </button>

            <button
              onClick={async () => {
                try {
                  await chatsService.updateChatStatus(selectedChat.id, ChatStatus.RESOLVED);
                  toast.success('Chat marcado como resolvido');
                  loadChats();
                  setSelectedChat({ ...selectedChat, status: ChatStatus.RESOLVED });
                } catch (error) {
                  toast.error('Erro ao atualizar status');
                }
              }}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              ✅ Marcar como Resolvido
            </button>
          </div>
        </div>
      )}

      {/* Transfer Chat Modal */}
      <TransferChatModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        chatId={selectedChat?.id || ''}
        chatName={selectedChat ? getContactName(selectedChat) : ''}
        onSuccess={handleTransferSuccess}
      />

      {/* Edit Contact Modal */}
      {selectedChat && (
        <EditContactModal
          isOpen={editContactModalOpen}
          onClose={() => setEditContactModalOpen(false)}
          chat={selectedChat}
          onSuccess={() => {
            // Recarregar lista de chats e mensagens
            loadChats();
            if (selectedChat) {
              loadMessages(selectedChat.id);
            }
          }}
        />
      )}

      {/* Modal de Preview de Mídia Recebida */}
      {previewMedia && (
        <MediaPreviewModal
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          mediaUrl={previewMedia.url}
          mediaType={previewMedia.type as 'image' | 'video' | 'audio' | 'document'}
        />
      )}

      {/* Modal de Caption para Envio de Mídia (Estilo WhatsApp Web) */}
      <MediaCaptionModal
        isOpen={captionModalOpen}
        onClose={() => {
          setCaptionModalOpen(false);
          setPendingFile(null);
          setPendingFileUrl(null);
        }}
        onSend={handleSendMediaWithCaption}
        file={pendingFile}
        fileUrl={pendingFileUrl}
        mediaType={pendingMediaType}
      />
    </div>
  );
}
