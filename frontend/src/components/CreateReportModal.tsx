import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, BarChart3, FileText, Settings } from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { DataSource } from '../types';

interface CreateReportModalProps {
  dataSources: DataSource[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReportModal({ dataSources, onClose, onSuccess }: CreateReportModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'DASHBOARD' as 'DASHBOARD' | 'SUMMARY' | 'CUSTOM',
    dataSourceId: '',
    isPublic: false
  });

  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setSaving(true);
      await reportsService.createReport({
        name: formData.name,
        type: formData.type,
        dataSourceId: formData.dataSourceId || undefined,
        isPublic: formData.isPublic
      });
      toast.success('Relatório criado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar relatório:', error);
      toast.error(error.message || 'Erro ao criar relatório');
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DASHBOARD': return <BarChart3 className="w-4 h-4" />;
      case 'SUMMARY': return <FileText className="w-4 h-4" />;
      case 'CUSTOM': return <Settings className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'DASHBOARD': return 'Dashboard interativo com gráficos e métricas em tempo real';
      case 'SUMMARY': return 'Relatório resumido com insights e análises automáticas';
      case 'CUSTOM': return 'Relatório personalizado com configurações específicas';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Novo Relatório
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Relatório *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Dashboard de Performance - Outubro 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <div className="space-y-2">
                {(['DASHBOARD', 'SUMMARY', 'CUSTOM'] as const).map((type) => (
                  <label key={type} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={formData.type === type}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        <span className="font-medium text-gray-900">{type}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {getTypeDescription(type)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Fonte de Dados */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fonte de Dados
              </label>
              <select
                name="dataSourceId"
                value={formData.dataSourceId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecionar fonte (opcional)</option>
                {dataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Se não selecionar uma fonte, o relatório usará dados de todas as fontes
              </p>
            </div>

            {/* Público */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Relatório Público
                </label>
                <p className="text-xs text-gray-500">
                  Permite compartilhar o relatório via link público
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !formData.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {saving ? 'Criando...' : 'Criar Relatório'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
