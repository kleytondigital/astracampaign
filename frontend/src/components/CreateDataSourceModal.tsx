import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, Database, Link, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { dataSourcesService } from '../services/dataSourcesService';
import { TestConnectionResult } from '../types';

interface CreateDataSourceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDataSourceModal({ onClose, onSuccess }: CreateDataSourceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'GOOGLE_SHEETS',
    url: '',
    credentials: null as any
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const credentials = e.target.value ? JSON.parse(e.target.value) : null;
      setFormData(prev => ({
        ...prev,
        credentials
      }));
    } catch (error) {
      // Ignorar JSON inválido por enquanto
    }
  };

  const handleTestConnection = async () => {
    if (!formData.url) {
      toast.error('URL é obrigatória');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const result = await dataSourcesService.testConnection({
        url: formData.url,
        credentials: formData.credentials
      });
      
      setTestResult(result);
      
      if (result.success) {
        toast.success('Conexão testada com sucesso!');
      } else {
        toast.error(result.error || 'Falha na conexão');
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast.error('Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url) {
      toast.error('Nome e URL são obrigatórios');
      return;
    }

    try {
      setSaving(true);
      await dataSourcesService.createDataSource(formData);
      toast.success('Fonte de dados criada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar fonte de dados:', error);
      toast.error(error.message || 'Erro ao criar fonte de dados');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Nova Fonte de Dados
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
                Nome Identificador *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Cliente X - Campanhas de Outubro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Fonte
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GOOGLE_SHEETS">Google Sheets</option>
                <option value="GOOGLE_ADS" disabled>Google Ads (Em breve)</option>
                <option value="LINKEDIN_ADS" disabled>LinkedIn Ads (Em breve)</option>
              </select>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL da Planilha *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.url}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testing ? 'Testando...' : 'Testar'}
                </button>
              </div>
            </div>

            {/* Resultado do Teste */}
            {testResult && (
              <div className={`p-4 rounded-lg ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'Conexão bem-sucedida!' : 'Falha na conexão'}
                  </span>
                </div>
                
                {testResult.success && (
                  <div className="text-sm text-green-700">
                    <p>Colunas encontradas: {testResult.columns?.length || 0}</p>
                    <p>Total de linhas: {testResult.totalRows || 0}</p>
                    {testResult.sampleData && testResult.sampleData.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Dados de exemplo:</p>
                        <div className="bg-white p-2 rounded border text-xs overflow-x-auto">
                          <pre>{JSON.stringify(testResult.sampleData[0], null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!testResult.success && (
                  <p className="text-sm text-red-700">{testResult.error}</p>
                )}
              </div>
            )}

            {/* Credenciais (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credenciais (Opcional)
              </label>
              <textarea
                name="credentials"
                onChange={handleCredentialsChange}
                placeholder='{"client_email": "...", "private_key": "..."}'
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cole aqui as credenciais JSON do Google Service Account (opcional)
              </p>
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
                disabled={saving || !formData.name || !formData.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {saving ? 'Criando...' : 'Criar Fonte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
