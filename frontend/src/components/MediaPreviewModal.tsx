import React, { useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
}

export function MediaPreviewModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType,
}: MediaPreviewModalProps) {
  const [zoom, setZoom] = React.useState(100);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = mediaUrl.split('/').pop() || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMedia = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={mediaUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain rounded-lg"
              style={{ transform: `scale(${zoom / 100})` }}
            />
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video src={mediaUrl} controls autoPlay className="max-h-full max-w-full rounded-lg" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Reproduzindo Áudio
              </h3>
              <audio src={mediaUrl} controls autoPlay className="w-full" />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Pré-visualização não disponível
              </h3>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={18} />
                <span>Baixar Arquivo</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
        <div className="flex items-center space-x-4">
          {mediaType === 'image' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(50, zoom - 25));
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut size={20} className="text-white" />
              </button>
              <span className="text-white text-sm">{zoom}%</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(200, zoom + 25));
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn size={20} className="text-white" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Baixar"
          >
            <Download size={20} className="text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {renderMedia()}
      </div>
    </div>
  );
}



