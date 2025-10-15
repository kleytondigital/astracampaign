import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface MediaCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (caption: string) => void;
  file: File | null;
  fileUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
}

/**
 * Modal de preview de mídia com campo de caption
 * Estilo WhatsApp Web
 */
export function MediaCaptionModal({
  isOpen,
  onClose,
  onSend,
  file,
  fileUrl,
  mediaType,
}: MediaCaptionModalProps) {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (fileUrl) {
      setPreviewUrl(fileUrl);
    }
  }, [file, fileUrl]);

  const handleSend = () => {
    onSend(caption);
    setCaption('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen || !previewUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Enviar Mídia</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Preview Area */}
        <div
          className="p-6 flex items-center justify-center bg-gray-800"
          style={{ minHeight: '400px', maxHeight: '500px' }}
        >
          {mediaType === 'IMAGE' && (
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded"
            />
          )}

          {mediaType === 'VIDEO' && (
            <video src={previewUrl} controls className="max-w-full max-h-full rounded">
              Seu navegador não suporta vídeos.
            </video>
          )}

          {mediaType === 'AUDIO' && (
            <div className="w-full max-w-md p-6 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{file?.name}</p>
                  <p className="text-gray-400 text-sm">
                    {file && (file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <audio src={previewUrl} controls className="w-full">
                Seu navegador não suporta áudio.
              </audio>
            </div>
          )}

          {mediaType === 'DOCUMENT' && (
            <div className="w-full max-w-md p-6 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium truncate">{file?.name}</p>
                  <p className="text-gray-400 text-sm">
                    {file && (file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Caption Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Adicione uma legenda..."
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">{caption.length}/1000</div>
            </div>
            <button
              onClick={handleSend}
              className="p-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar"
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        {/* File Info */}
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-400">
            📎 {file?.name} • {file && (file.size / 1024).toFixed(2)} KB
          </div>
        </div>
      </div>
    </div>
  );
}



