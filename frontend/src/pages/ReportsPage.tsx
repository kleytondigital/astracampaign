import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  Plus, 
  RefreshCw, 
  Settings, 
  Eye, 
  Share2, 
  Download,
  Trash2,
  Edit,
  ExternalLink,
  Database,
  TrendingUp,
  DollarSign,
  Users,
  MousePointer,
  Target
} from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { dataSourcesService } from '../services/dataSourcesService';
import { Report, DataSource, ReportData } from '../types';
import { CreateDataSourceModal } from '../components/CreateDataSourceModal';
import { CreateReportModal } from '../components/CreateReportModal';
import { ReportViewerModal } from '../components/ReportViewerModal';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showCreateDataSource, setShowCreateDataSource] = useState(false);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, dataSourcesData] = await Promise.all([
        reportsService.getReports(),
        dataSourcesService.getDataSources()
      ]);
      setReports(reportsData);
      setDataSources(dataSourcesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDataSource = async (dataSourceId: string) => {
    try {
      setSyncing(dataSourceId);
      await dataSourcesService.syncDataSource(dataSourceId);
      toast.success('Sincronização concluída com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(null);
    }
  };

  const handleViewReport = async (report: Report) => {
    try {
      setSelectedReport(report);
      const data = await reportsService.getReportData(report.id);
      setReportData(data);
      setShowReportViewer(true);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Tem certeza que deseja deletar este relatório?')) return;

    try {
      await reportsService.deleteReport(reportId);
      toast.success('Relatório deletado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      toast.error('Erro ao deletar relatório');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-100';
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'SYNCING': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'Sincronizado';
      case 'ERROR': return 'Erro';
      case 'SYNCING': return 'Sincronizando...';
      default: return 'Pendente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Relatórios e Dashboards
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie suas fontes de dados e visualize relatórios de campanhas do Meta Ads
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateDataSource(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Database className="w-4 h-4" />
              Nova Fonte
            </button>
            <button
              onClick={() => setShowCreateReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Fontes de Dados */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Fontes de Dados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((source) => (
            <div key={source.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{source.name}</h3>
                  <p className="text-sm text-gray-500">{source.type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(source.syncStatus)}`}>
                  {getStatusText(source.syncStatus)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <p className="truncate">{source.url}</p>
                {source.lastSync && (
                  <p>Última sync: {new Date(source.lastSync).toLocaleString()}</p>
                )}
                {source.errorMessage && (
                  <p className="text-red-600 text-xs mt-1">{source.errorMessage}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {source._count?.campaigns || 0} campanhas • {source._count?.reports || 0} relatórios
                </div>
                <button
                  onClick={() => handleSyncDataSource(source.id)}
                  disabled={syncing === source.id}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing === source.id ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Relatórios */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Relatórios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{report.name}</h3>
                  <p className="text-sm text-gray-500">{report.type}</p>
                  {report.dataSource && (
                    <p className="text-xs text-gray-400 mt-1">
                      Fonte: {report.dataSource.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {report.isPublic && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                      Público
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <p>Criado por: {report.creator?.nome}</p>
                <p>{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewReport(report)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <Eye className="w-3 h-3" />
                  Ver
                </button>
                
                {report.isPublic && report.shareToken && (
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/reports/public/${report.shareToken}`;
                      navigator.clipboard.writeText(url);
                      toast.success('Link copiado para a área de transferência!');
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                  >
                    <Share2 className="w-3 h-3" />
                    Compartilhar
                  </button>
                )}

                <button
                  onClick={() => handleDeleteReport(report.id)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {reports.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório encontrado</h3>
            <p className="text-gray-500 mb-4">Crie seu primeiro relatório para começar a analisar seus dados</p>
            <button
              onClick={() => setShowCreateReport(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Criar Relatório
            </button>
          </div>
        )}
      </div>

      {/* Modais */}
      {showCreateDataSource && (
        <CreateDataSourceModal
          onClose={() => setShowCreateDataSource(false)}
          onSuccess={() => {
            setShowCreateDataSource(false);
            loadData();
          }}
        />
      )}

      {showCreateReport && (
        <CreateReportModal
          dataSources={dataSources}
          onClose={() => setShowCreateReport(false)}
          onSuccess={() => {
            setShowCreateReport(false);
            loadData();
          }}
        />
      )}

      {showReportViewer && selectedReport && reportData && (
        <ReportViewerModal
          report={selectedReport}
          data={reportData}
          onClose={() => {
            setShowReportViewer(false);
            setSelectedReport(null);
            setReportData(null);
          }}
        />
      )}
    </div>
  );
}
