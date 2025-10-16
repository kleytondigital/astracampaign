import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

interface GoogleSheetsCredentials {
  client_email?: string;
  private_key?: string;
  type?: string;
  project_id?: string;
  private_key_id?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

interface TestConnectionResult {
  success: boolean;
  columns?: string[];
  sampleData?: any[];
  totalRows?: number;
  error?: string;
}

interface SyncResult {
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
}

interface CampaignRow {
  campaignName: string;
  date: string;
  cost: number;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion?: number;
  roi?: number;
}

class GoogleSheetsService {
  private auth: any;

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
  }

  // ============================================================================
  // TESTAR CONEXÃO COM GOOGLE SHEETS
  // ============================================================================
  async testConnection(url: string, credentials?: GoogleSheetsCredentials): Promise<TestConnectionResult> {
    try {
      console.log('🔗 Testando conexão com Google Sheets:', url);

      // Extrair ID da planilha da URL
      const spreadsheetId = this.extractSpreadsheetId(url);
      if (!spreadsheetId) {
        return {
          success: false,
          error: 'URL da planilha inválida'
        };
      }

      // Configurar autenticação
      let auth;
      if (credentials) {
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      } else {
        auth = this.auth;
      }

      const sheets = google.sheets({ version: 'v4', auth });

      // Obter informações da planilha
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId
      });

      const sheet = spreadsheet.data.sheets?.[0];
      if (!sheet) {
        return {
          success: false,
          error: 'Planilha não encontrada'
        };
      }

      // Obter dados da primeira aba
      const range = `${sheet.properties?.title || 'Sheet1'}!A1:Z1000`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return {
          success: false,
          error: 'Planilha vazia'
        };
      }

      // Primeira linha são os cabeçalhos
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Mapear colunas esperadas
      const expectedColumns = [
        'Nome da campanha',
        'Data',
        'Custo',
        'Alcance',
        'Impressões',
        'Cliques',
        'CTR (%)',
        'Conversões',
        'Custo por conversão',
        'ROI'
      ];

      const columnMapping = this.mapColumns(headers, expectedColumns);
      
      // Validar se temos as colunas essenciais
      const essentialColumns = ['campaignName', 'date', 'cost', 'reach', 'impressions', 'clicks', 'ctr', 'conversions'];
      const missingColumns = essentialColumns.filter(col => !columnMapping[col]);
      
      if (missingColumns.length > 0) {
        return {
          success: false,
          error: `Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`
        };
      }

      // Preparar dados de exemplo
      const sampleData = dataRows.slice(0, 5).map(row => {
        const mappedRow: any = {};
        Object.entries(columnMapping).forEach(([key, index]) => {
          if (index !== -1 && row[index]) {
            mappedRow[key] = row[index];
          }
        });
        return mappedRow;
      });

      return {
        success: true,
        columns: headers,
        sampleData,
        totalRows: dataRows.length
      };
    } catch (error) {
      console.error('❌ Erro ao testar conexão com Google Sheets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ============================================================================
  // SINCRONIZAR DADOS DA PLANILHA
  // ============================================================================
  async syncData(url: string, credentials: GoogleSheetsCredentials | null, dataSourceId: string, tenantId: string): Promise<SyncResult> {
    try {
      console.log('🔄 Sincronizando dados do Google Sheets:', url);

      // Extrair ID da planilha
      const spreadsheetId = this.extractSpreadsheetId(url);
      if (!spreadsheetId) {
        throw new Error('URL da planilha inválida');
      }

      // Configurar autenticação
      let auth;
      if (credentials) {
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
      } else {
        auth = this.auth;
      }

      const sheets = google.sheets({ version: 'v4', auth });

      // Obter dados da planilha
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId
      });

      const sheet = spreadsheet.data.sheets?.[0];
      if (!sheet) {
        throw new Error('Planilha não encontrada');
      }

      // Obter todos os dados
      const range = `${sheet.properties?.title || 'Sheet1'}!A:Z`;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });

      const rows = response.data.values || [];
      if (rows.length < 2) {
        throw new Error('Planilha vazia ou sem dados');
      }

      // Mapear colunas
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const columnMapping = this.mapColumns(headers, [
        'Nome da campanha',
        'Data',
        'Custo',
        'Alcance',
        'Impressões',
        'Cliques',
        'CTR (%)',
        'Conversões',
        'Custo por conversão',
        'ROI'
      ]);

      // Processar dados
      let recordsProcessed = 0;
      let recordsCreated = 0;
      let recordsUpdated = 0;

      for (const row of dataRows) {
        try {
          const campaignData = this.parseRow(row, columnMapping);
          if (!campaignData) continue;

          recordsProcessed++;

          // Verificar se já existe
          const existing = await prisma.campaignData.findUnique({
            where: {
              dataSourceId_campaignName_date: {
                dataSourceId,
                campaignName: campaignData.campaignName,
                date: campaignData.date
              }
            }
          });

          if (existing) {
            // Atualizar registro existente
            await prisma.campaignData.update({
              where: { id: existing.id },
              data: {
                cost: campaignData.cost,
                reach: campaignData.reach,
                impressions: campaignData.impressions,
                clicks: campaignData.clicks,
                ctr: campaignData.ctr,
                conversions: campaignData.conversions,
                costPerConversion: campaignData.costPerConversion,
                roi: campaignData.roi
              }
            });
            recordsUpdated++;
          } else {
            // Criar novo registro
            await prisma.campaignData.create({
              data: {
                dataSourceId,
                tenantId,
                campaignName: campaignData.campaignName,
                date: campaignData.date,
                cost: campaignData.cost,
                reach: campaignData.reach,
                impressions: campaignData.impressions,
                clicks: campaignData.clicks,
                ctr: campaignData.ctr,
                conversions: campaignData.conversions,
                costPerConversion: campaignData.costPerConversion,
                roi: campaignData.roi
              }
            });
            recordsCreated++;
          }
        } catch (rowError) {
          console.error('❌ Erro ao processar linha:', rowError);
          continue;
        }
      }

      console.log(`✅ Sincronização concluída: ${recordsProcessed} processados, ${recordsCreated} criados, ${recordsUpdated} atualizados`);

      return {
        recordsProcessed,
        recordsCreated,
        recordsUpdated
      };
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXTRAIR ID DA PLANILHA DA URL
  // ============================================================================
  private extractSpreadsheetId(url: string): string | null {
    try {
      // Suportar diferentes formatos de URL do Google Sheets
      const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao extrair ID da planilha:', error);
      return null;
    }
  }

  // ============================================================================
  // MAPEAR COLUNAS DA PLANILHA
  // ============================================================================
  private mapColumns(headers: string[], expectedColumns: string[]): Record<string, number> {
    const mapping: Record<string, number> = {};

    // Mapear colunas esperadas
    const columnMap: Record<string, string[]> = {
      campaignName: ['Nome da campanha', 'Campanha', 'Nome', 'Campaign Name'],
      date: ['Data', 'Date', 'Dia'],
      cost: ['Custo', 'Cost', 'Gasto', 'Spend'],
      reach: ['Alcance', 'Reach', 'Pessoas alcançadas'],
      impressions: ['Impressões', 'Impressions', 'Impress'],
      clicks: ['Cliques', 'Clicks', 'Cliques únicos'],
      ctr: ['CTR (%)', 'CTR', 'Click-through rate'],
      conversions: ['Conversões', 'Conversions', 'Conversão'],
      costPerConversion: ['Custo por conversão', 'Cost per conversion', 'CPA', 'Custo por aquisição'],
      roi: ['ROI', 'Return on investment', 'Retorno']
    };

    Object.entries(columnMap).forEach(([key, variations]) => {
      const index = headers.findIndex(header => 
        variations.some(variation => 
          header.toLowerCase().includes(variation.toLowerCase())
        )
      );
      mapping[key] = index;
    });

    return mapping;
  }

  // ============================================================================
  // PROCESSAR LINHA DE DADOS
  // ============================================================================
  private parseRow(row: string[], columnMapping: Record<string, number>): CampaignRow | null {
    try {
      const getValue = (key: string): string | undefined => {
        const index = columnMapping[key];
        return index !== -1 ? row[index] : undefined;
      };

      const campaignName = getValue('campaignName');
      const dateStr = getValue('date');
      const costStr = getValue('cost');
      const reachStr = getValue('reach');
      const impressionsStr = getValue('impressions');
      const clicksStr = getValue('clicks');
      const ctrStr = getValue('ctr');
      const conversionsStr = getValue('conversions');
      const costPerConversionStr = getValue('costPerConversion');
      const roiStr = getValue('roi');

      // Validar campos obrigatórios
      if (!campaignName || !dateStr || !costStr || !reachStr || !impressionsStr || !clicksStr || !ctrStr || !conversionsStr) {
        return null;
      }

      // Converter data
      const date = this.parseDate(dateStr);
      if (!date) {
        return null;
      }

      // Converter valores numéricos
      const cost = this.parseNumber(costStr);
      const reach = this.parseNumber(reachStr);
      const impressions = this.parseNumber(impressionsStr);
      const clicks = this.parseNumber(clicksStr);
      const ctr = this.parseNumber(ctrStr);
      const conversions = this.parseNumber(conversionsStr);
      const costPerConversion = costPerConversionStr ? this.parseNumber(costPerConversionStr) : undefined;
      const roi = roiStr ? this.parseNumber(roiStr) : undefined;

      if (cost === null || reach === null || impressions === null || clicks === null || ctr === null || conversions === null) {
        return null;
      }

      return {
        campaignName: campaignName.trim(),
        date: date.toISOString().split('T')[0],
        cost,
        reach,
        impressions,
        clicks,
        ctr,
        conversions,
        costPerConversion: costPerConversion || undefined,
        roi: roi || undefined
      };
    } catch (error) {
      console.error('❌ Erro ao processar linha:', error);
      return null;
    }
  }

  // ============================================================================
  // CONVERTER DATA
  // ============================================================================
  private parseDate(dateStr: string): Date | null {
    try {
      // Tentar diferentes formatos de data
      const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
        /^\d{1,2}\/\d{1,2}\/\d{4}$/ // D/M/YYYY
      ];

      for (const format of formats) {
        if (format.test(dateStr)) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // ============================================================================
  // CONVERTER NÚMERO
  // ============================================================================
  private parseNumber(value: string): number | null {
    try {
      // Remover caracteres não numéricos exceto ponto e vírgula
      const cleaned = value.replace(/[^\d.,]/g, '');
      
      // Substituir vírgula por ponto para decimal
      const normalized = cleaned.replace(',', '.');
      
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num;
    } catch (error) {
      return null;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
