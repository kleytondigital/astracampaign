import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Download, 
  Share2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  MousePointer,
  Target,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import { reportsService } from '../services/reportsService';
import { Report, ReportData } from '../types';

interface ReportViewerModalProps {
  report: Report;
  data: ReportData;
  onClose: () => void;
}

export function ReportViewerModal({ report, data, onClose }: ReportViewerModalProps) {
  const [reportData, setReportData] = useState<ReportData>(data);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    groupBy: 'day' as 'day' | 'week' | 'month'
  });

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const newData = await reportsService.getReportData(report.id, filters);
      setReportData(newData);
      toast.success('Dados atualizados!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (report.isPublic && report.shareToken) {
      const url = `${window.location.origin}/reports/public/${report.shareToken}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
    } else {
      toast.error('Este relatório não é público');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                {report.name}
              </h2>
              <p className="text-gray-600">
                {report.type} • {report.dataSource?.name || 'Todas as fontes'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              {report.isPublic && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-gray-600" />
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agrupar por
                  </label>
                  <select
                    value={filters.groupBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value as any }))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="day">Dia</option>
                    <option value="week">Semana</option>
                    <option value="month">Mês</option>
                  </select>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>

          {/* Resumo das Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Custo Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(reportData.summary.totalCost)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(reportData.trends.costTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.costTrend)}`}>
                  {formatPercentage(reportData.trends.costTrend)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alcance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(reportData.summary.totalReach)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(reportData.trends.reachTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.reachTrend)}`}>
                  {formatPercentage(reportData.trends.reachTrend)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cliques</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(reportData.summary.totalClicks)}
                  </p>
                </div>
                <MousePointer className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(reportData.trends.clicksTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.clicksTrend)}`}>
                  {formatPercentage(reportData.trends.clicksTrend)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversões</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(reportData.summary.totalConversions)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(reportData.trends.conversionsTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.conversionsTrend)}`}>
                  {formatPercentage(reportData.trends.conversionsTrend)}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">CTR Médio</p>
              <p className="text-xl font-bold text-gray-900">
                {reportData.summary.averageCtr.toFixed(2)}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(reportData.trends.ctrTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.ctrTrend)}`}>
                  {formatPercentage(reportData.trends.ctrTrend)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Custo por Conversão</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(reportData.summary.averageCostPerConversion)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(reportData.trends.costPerConversionTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.costPerConversionTrend)}`}>
                  {formatPercentage(reportData.trends.costPerConversionTrend)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">ROI Médio</p>
              <p className="text-xl font-bold text-gray-900">
                {reportData.summary.averageRoi.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(reportData.trends.roiTrend)}
                <span className={`text-sm ${getTrendColor(reportData.trends.roiTrend)}`}>
                  {formatPercentage(reportData.trends.roiTrend)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Campanhas */}
          {reportData.topCampaigns.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Campanhas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Campanha</th>
                      <th className="text-right py-2">Custo</th>
                      <th className="text-right py-2">Conversões</th>
                      <th className="text-right py-2">ROI</th>
                      <th className="text-right py-2">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topCampaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{campaign.campaignName}</td>
                        <td className="py-2 text-right">{formatCurrency(campaign.cost)}</td>
                        <td className="py-2 text-right">{formatNumber(campaign.conversions)}</td>
                        <td className="py-2 text-right">{campaign.roi.toFixed(1)}%</td>
                        <td className="py-2 text-right">{campaign.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Insights */}
          {reportData.insights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Insights Automáticos</h3>
              <div className="space-y-2">
                {reportData.insights.map((insight, index) => (
                  <p key={index} className="text-blue-800">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico de Dados Diários */}
          {reportData.dailyData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução Temporal</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Data</th>
                      <th className="text-right py-2">Custo</th>
                      <th className="text-right py-2">Alcance</th>
                      <th className="text-right py-2">Cliques</th>
                      <th className="text-right py-2">Conversões</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyData.map((day, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2">{new Date(day.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 text-right">{formatCurrency(day.cost)}</td>
                        <td className="py-2 text-right">{formatNumber(day.reach)}</td>
                        <td className="py-2 text-right">{formatNumber(day.clicks)}</td>
                        <td className="py-2 text-right">{formatNumber(day.conversions)}</td>
                        <td className="py-2 text-right">{day.ctr.toFixed(2)}%</td>
                        <td className="py-2 text-right">{day.roi.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
