import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Phone, Image, FileText, Mic, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatsService } from '../services/chatsService';

interface Message {
  id: string;
  body: string | null;
  type: string;
  fromMe: boolean;
  mediaUrl: string | null;
  createdAt: string;
}

interface ChatWidgetProps {
  phone: string;
  contactName: string;
  sessionId?: string;
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  phone,
  contactName,
  sessionId,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && phone) {
      loadChat();
    }
  }, [isOpen, phone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      setLoading(true);
      // Buscar ou criar chat
      const response = await chatsService.getAll({ phone });
      
      if (response.data && response.data.length > 0) {
        const chat = response.data[0];
        setChatId(chat.id);
        
        // Carregar mensagens
        const chatDetails = await chatsService.getChatById(chat.id, {
          messagesPageSize: 50,
        });
        setMessages(chatDetails.messages || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar chat:', error);
      toast.error('Erro ao carregar histórico de conversas');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId) {
      if (!chatId) {
        toast.error('Chat não inicializado. Aguarde ou recarregue.');
      }
      return;
    }

    try {
      const message = await chatsService.sendMessage(chatId, {
        body: newMessage.trim(),
      });

      setMessages([...messages, message]);
      setNewMessage('');
      toast.success('Mensagem enviada!');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageContent = (message: Message) => {
    if (message.mediaUrl) {
      const mediaType = message.type.toLowerCase();
      
      if (mediaType.includes('image')) {
        return (
          <div>
            <img
              src={message.mediaUrl}
              alt="Imagem"
              className="max-w-xs rounded cursor-pointer hover:opacity-90"
              onClick={() => window.open(message.mediaUrl!, '_blank')}
            />
            {message.body && <p className="mt-2">{message.body}</p>}
          </div>
        );
      }
      
      if (mediaType.includes('audio')) {
        return (
          <div>
            <audio controls className="max-w-xs">
              <source src={message.mediaUrl} type="audio/ogg" />
              Seu navegador não suporta áudio.
            </audio>
            {message.body && <p className="mt-2">{message.body}</p>}
          </div>
        );
      }
      
      if (mediaType.includes('video')) {
        return (
          <div>
            <video controls className="max-w-xs rounded">
              <source src={message.mediaUrl} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
            {message.body && <p className="mt-2">{message.body}</p>}
          </div>
        );
      }
      
      // Documentos
      return (
        <div>
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <FileText className="h-4 w-4" />
            Documento
          </a>
          {message.body && <p className="mt-2">{message.body}</p>}
        </div>
      );
    }

    return <p>{message.body}</p>;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Botão de Chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition-all hover:scale-110"
          title={`Chat com ${contactName}`}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Widget de Chat */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{contactName}</h3>
                <p className="text-xs text-white/80">{phone}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="h-12 w-12 mb-2" />
                <p className="text-sm">Nenhuma mensagem ainda</p>
                <p className="text-xs">Inicie uma conversa!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.fromMe
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {getMessageContent(message)}
                      <div
                        className={`text-xs mt-1 ${
                          message.fromMe ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite uma mensagem..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-green-500"
                disabled={!chatId}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !chatId}
                className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            {!chatId && (
              <p className="text-xs text-red-500 mt-2">
                Aguardando inicialização do chat...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};




