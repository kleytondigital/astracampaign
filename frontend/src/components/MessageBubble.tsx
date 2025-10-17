import React, { useState } from 'react';
import { Message } from '../types';
import {
  Play,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Check,
  CheckCheck,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onMediaClick?: (url: string, type: string) => void;
}

export function MessageBubble({ message, onMediaClick }: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false);

  const isFromMe = message.fromMe;
  const hasMedia = !!message.mediaUrl;

  // Formatar timestamp
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Renderizar ícone de status de entrega
  const renderDeliveryStatus = () => {
    if (!isFromMe) return null;

    const ackStatus = message.ack || 1;

    if (ackStatus === 1) {
      return <Check size={14} className="text-gray-400" />;
    } else if (ackStatus === 2) {
      return <CheckCheck size={14} className="text-gray-400" />;
    } else if (ackStatus >= 3) {
      return <CheckCheck size={14} className="text-blue-500" />;
    }

    return null;
  };

  // Renderizar mídia de imagem
  const renderImage = () => {
    if (imageError) {
      return (
        <div className="bg-gray-200 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 min-h-[150px]">
          <ImageIcon size={32} className="text-gray-400" />
          <p className="text-xs text-gray-500">Erro ao carregar imagem</p>
          {message.mediaUrl && (
            <a
              href={message.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              Abrir em nova aba
            </a>
          )}
        </div>
      );
    }

    return (
      <div
        className="relative group cursor-pointer"
        onClick={() => onMediaClick?.(message.mediaUrl!, 'image')}
      >
        <img
          src={message.mediaUrl}
          alt="Imagem"
          className="rounded-lg max-w-sm max-h-96 object-cover"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
          <ImageIcon
            size={32}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    );
  };

  // Renderizar mídia de vídeo
  const renderVideo = () => {
    return (
      <div className="relative">
        <video
          src={message.mediaUrl}
          controls
          className="rounded-lg max-w-sm max-h-96"
          preload="metadata"
        />
      </div>
    );
  };

  // Renderizar mídia de áudio
  const renderAudio = () => {
    return (
      <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 min-w-[250px]">
        <Music size={20} className="text-gray-600 dark:text-gray-300" />
        <audio src={message.mediaUrl} controls className="flex-1" />
      </div>
    );
  };

  // Renderizar documento
  const renderDocument = () => {
    const filename = message.body || 'Documento';

    return (
      <a
        href={message.mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[250px]"
      >
        <FileText size={24} className="text-gray-600 dark:text-gray-300" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Clique para baixar</p>
        </div>
        <Download size={18} className="text-gray-600 dark:text-gray-300" />
      </a>
    );
  };

  // Renderizar conteúdo baseado no tipo
  const renderContent = () => {
    if (!hasMedia) {
      return <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>;
    }

    let mediaElement;
    switch (message.type) {
      case 'IMAGE':
        mediaElement = renderImage();
        break;
      case 'VIDEO':
        mediaElement = renderVideo();
        break;
      case 'AUDIO':
      case 'VOICE':
        mediaElement = renderAudio();
        break;
      case 'DOCUMENT':
        mediaElement = renderDocument();
        break;
      default:
        mediaElement = <p className="text-sm">[Mídia não suportada]</p>;
    }

    return (
      <div className="space-y-2">
        {mediaElement}
        {message.body && message.type !== 'DOCUMENT' && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isFromMe
            ? 'bg-blue-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
        }`}
      >
        {renderContent()}
        <div
          className={`flex items-center justify-end space-x-1 mt-1 ${isFromMe ? 'text-white' : 'text-gray-500'}`}
        >
          <span className="text-xs opacity-75">{formatTime(message.timestamp)}</span>
          {renderDeliveryStatus()}
        </div>
      </div>
    </div>
  );
}







