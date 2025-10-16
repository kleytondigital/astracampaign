import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CampaignData {
  id: string;
  campaignName: string;
  date: Date;
  cost: number;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion?: number | null;
  roi?: number | null;
}

interface ReportData {
  summary: {
    totalCost: number;
    totalReach: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCtr: number;
    averageCostPerConversion: number;
    averageRoi: number;
  };
  trends: {
    costTrend: number;
    reachTrend: number;
    impressionsTrend: number;
    clicksTrend: number;
    conversionsTrend: number;
    ctrTrend: number;
    costPerConversionTrend: number;
    roiTrend: number;
  };
  topCampaigns: Array<{
    campaignName: string;
    cost: number;
    conversions: number;
    roi: number;
    ctr: number;
  }>;
  dailyData: Array<{
    date: string;
    cost: number;
    reach: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    costPerConversion: number;
    roi: number;
  }>;
  insights: string[];
}

class ReportCalculationService {
  // ============================================================================
  // GERAR DADOS DO RELATÓRIO
  // ============================================================================
  async generateReportData(
    campaignData: CampaignData[],
    groupBy: string = 'day',
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ReportData> {
    try {
      console.log('📊 Gerando dados do relatório...');

      // Filtrar dados por período se especificado
      let filteredData = campaignData;
      if (dateRange?.startDate || dateRange?.endDate) {
        filteredData = campaignData.filter(data => {
          const dataDate = new Date(data.date);
          if (dateRange.startDate && dataDate < new Date(dateRange.startDate)) return false;
          if (dateRange.endDate && dataDate > new Date(dateRange.endDate)) return false;
          return true;
        });
      }

      if (filteredData.length === 0) {
        return this.getEmptyReportData();
      }

      // Calcular resumo
      const summary = this.calculateSummary(filteredData);

      // Calcular tendências
      const trends = this.calculateTrends(filteredData, groupBy);

      // Top campanhas
      const topCampaigns = this.getTopCampaigns(filteredData);

      // Dados agrupados por período
      const dailyData = this.groupDataByPeriod(filteredData, groupBy);

      // Gerar insights
      const insights = this.generateInsights(summary, trends, topCampaigns);

      return {
        summary,
        trends,
        topCampaigns,
        dailyData,
        insights
      };
    } catch (error) {
      console.error('❌ Erro ao gerar dados do relatório:', error);
      throw error;
    }
  }

  // ============================================================================
  // CALCULAR RESUMO GERAL
  // ============================================================================
  private calculateSummary(data: CampaignData[]) {
    const totalCost = data.reduce((sum, item) => sum + Number(item.cost), 0);
    const totalReach = data.reduce((sum, item) => sum + item.reach, 0);
    const totalImpressions = data.reduce((sum, item) => sum + item.impressions, 0);
    const totalClicks = data.reduce((sum, item) => sum + item.clicks, 0);
    const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);

    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageCostPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;
    const averageRoi = totalCost > 0 ? ((totalConversions * 100) / totalCost) : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalReach,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCtr: Math.round(averageCtr * 100) / 100,
      averageCostPerConversion: Math.round(averageCostPerConversion * 100) / 100,
      averageRoi: Math.round(averageRoi * 100) / 100
    };
  }

  // ============================================================================
  // CALCULAR TENDÊNCIAS
  // ============================================================================
  private calculateTrends(data: CampaignData[], groupBy: string) {
    if (data.length < 2) {
      return {
        costTrend: 0,
        reachTrend: 0,
        impressionsTrend: 0,
        clicksTrend: 0,
        conversionsTrend: 0,
        ctrTrend: 0,
        costPerConversionTrend: 0,
        roiTrend: 0
      };
    }

    // Ordenar por data
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Dividir em dois períodos
    const midPoint = Math.floor(sortedData.length / 2);
    const firstPeriod = sortedData.slice(0, midPoint);
    const secondPeriod = sortedData.slice(midPoint);

    const firstSummary = this.calculateSummary(firstPeriod);
    const secondSummary = this.calculateSummary(secondPeriod);

    return {
      costTrend: this.calculatePercentageChange(firstSummary.totalCost, secondSummary.totalCost),
      reachTrend: this.calculatePercentageChange(firstSummary.totalReach, secondSummary.totalReach),
      impressionsTrend: this.calculatePercentageChange(firstSummary.totalImpressions, secondSummary.totalImpressions),
      clicksTrend: this.calculatePercentageChange(firstSummary.totalClicks, secondSummary.totalClicks),
      conversionsTrend: this.calculatePercentageChange(firstSummary.totalConversions, secondSummary.totalConversions),
      ctrTrend: this.calculatePercentageChange(firstSummary.averageCtr, secondSummary.averageCtr),
      costPerConversionTrend: this.calculatePercentageChange(firstSummary.averageCostPerConversion, secondSummary.averageCostPerConversion),
      roiTrend: this.calculatePercentageChange(firstSummary.averageRoi, secondSummary.averageRoi)
    };
  }

  // ============================================================================
  // CALCULAR MUDANÇA PERCENTUAL
  // ============================================================================
  private calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return Math.round(((newValue - oldValue) / oldValue) * 100 * 100) / 100;
  }

  // ============================================================================
  // OBTER TOP CAMPANHAS
  // ============================================================================
  private getTopCampaigns(data: CampaignData[]) {
    // Agrupar por campanha
    const campaignGroups = data.reduce((groups, item) => {
      if (!groups[item.campaignName]) {
        groups[item.campaignName] = [];
      }
      groups[item.campaignName].push(item);
      return groups;
    }, {} as Record<string, CampaignData[]>);

    // Calcular métricas por campanha
    const campaignMetrics = Object.entries(campaignGroups).map(([campaignName, campaigns]) => {
      const summary = this.calculateSummary(campaigns);
      return {
        campaignName,
        cost: summary.totalCost,
        conversions: summary.totalConversions,
        roi: summary.averageRoi,
        ctr: summary.averageCtr
      };
    });

    // Ordenar por ROI (maior primeiro)
    return campaignMetrics.sort((a, b) => b.roi - a.roi).slice(0, 10);
  }

  // ============================================================================
  // AGRUPAR DADOS POR PERÍODO
  // ============================================================================
  private groupDataByPeriod(data: CampaignData[], groupBy: string) {
    const groups: Record<string, CampaignData[]> = {};

    data.forEach(item => {
      let key: string;
      const date = new Date(item.date);

      switch (groupBy) {
        case 'week':
          // Obter início da semana (domingo)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    // Calcular métricas para cada grupo
    return Object.entries(groups)
      .map(([date, campaigns]) => {
        const summary = this.calculateSummary(campaigns);
        return {
          date,
          cost: summary.totalCost,
          reach: summary.totalReach,
          impressions: summary.totalImpressions,
          clicks: summary.totalClicks,
          conversions: summary.totalConversions,
          ctr: summary.averageCtr,
          costPerConversion: summary.averageCostPerConversion,
          roi: summary.averageRoi
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // ============================================================================
  // GERAR INSIGHTS AUTOMÁTICOS
  // ============================================================================
  private generateInsights(summary: any, trends: any, topCampaigns: any[]): string[] {
    const insights: string[] = [];

    // Insight sobre ROI
    if (summary.averageRoi > 100) {
      insights.push(`🎯 Excelente ROI de ${summary.averageRoi.toFixed(1)}% - campanhas muito rentáveis!`);
    } else if (summary.averageRoi > 50) {
      insights.push(`✅ Bom ROI de ${summary.averageRoi.toFixed(1)}% - campanhas rentáveis.`);
    } else if (summary.averageRoi < 20) {
      insights.push(`⚠️ ROI baixo de ${summary.averageRoi.toFixed(1)}% - considere otimizar as campanhas.`);
    }

    // Insight sobre tendências
    if (trends.conversionsTrend > 20) {
      insights.push(`📈 Conversões aumentaram ${trends.conversionsTrend.toFixed(1)}% - ótimo crescimento!`);
    } else if (trends.conversionsTrend < -20) {
      insights.push(`📉 Conversões diminuíram ${Math.abs(trends.conversionsTrend).toFixed(1)}% - atenção necessária.`);
    }

    if (trends.costTrend > 30) {
      insights.push(`💰 Custo aumentou ${trends.costTrend.toFixed(1)}% - verifique se o ROI compensa.`);
    } else if (trends.costTrend < -20) {
      insights.push(`💸 Custo diminuiu ${Math.abs(trends.costTrend).toFixed(1)}% - boa otimização!`);
    }

    // Insight sobre CTR
    if (summary.averageCtr > 3) {
      insights.push(`👆 CTR excelente de ${summary.averageCtr.toFixed(2)}% - anúncios muito atrativos!`);
    } else if (summary.averageCtr < 1) {
      insights.push(`👆 CTR baixo de ${summary.averageCtr.toFixed(2)}% - considere melhorar os anúncios.`);
    }

    // Insight sobre top campanhas
    if (topCampaigns.length > 0) {
      const bestCampaign = topCampaigns[0];
      insights.push(`🏆 Melhor campanha: "${bestCampaign.campaignName}" com ROI de ${bestCampaign.roi.toFixed(1)}%`);
    }

    // Insight sobre custo por conversão
    if (summary.averageCostPerConversion > 0) {
      if (summary.averageCostPerConversion < 50) {
        insights.push(`💵 Custo por conversão baixo: R$ ${summary.averageCostPerConversion.toFixed(2)} - muito eficiente!`);
      } else if (summary.averageCostPerConversion > 200) {
        insights.push(`💵 Custo por conversão alto: R$ ${summary.averageCostPerConversion.toFixed(2)} - considere otimizar.`);
      }
    }

    return insights;
  }

  // ============================================================================
  // DADOS VAZIOS PARA RELATÓRIO
  // ============================================================================
  private getEmptyReportData(): ReportData {
    return {
      summary: {
        totalCost: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCtr: 0,
        averageCostPerConversion: 0,
        averageRoi: 0
      },
      trends: {
        costTrend: 0,
        reachTrend: 0,
        impressionsTrend: 0,
        clicksTrend: 0,
        conversionsTrend: 0,
        ctrTrend: 0,
        costPerConversionTrend: 0,
        roiTrend: 0
      },
      topCampaigns: [],
      dailyData: [],
      insights: ['Nenhum dado disponível para o período selecionado.']
    };
  }
}

export const reportCalculationService = new ReportCalculationService();
