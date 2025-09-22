import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsService {
  private static instance: SettingsService;
  private cachedSettings: any = null;

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  async getSettings() {
    try {
      // Buscar configurações do banco
      let settings = await prisma.settings.findFirst();

      // Se não existir, criar configuração padrão
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            wahaHost: '',
            wahaApiKey: '',
            companyName: '',
            pageTitle: '',
            iconUrl: '/api/uploads/default_icon.png',
            faviconUrl: '/api/uploads/default_favicon.png'
          }
        });
      }

      this.cachedSettings = settings;
      return settings;
    } catch (error) {
      console.error('Error getting settings:', error);
      // Retornar configurações padrão se houver erro
      return {
        wahaHost: '',
        wahaApiKey: '',
        companyName: '',
        logoUrl: null,
        faviconUrl: '/api/uploads/default_favicon.png',
        pageTitle: 'Sistema de Gestão de Contatos',
        iconUrl: '/api/uploads/default_icon.png',
        openaiApiKey: null,
        groqApiKey: null
      };
    }
  }

  async updateSettings(data: {
    wahaHost?: string;
    wahaApiKey?: string;
    logoUrl?: string | null;
    companyName?: string;
    faviconUrl?: string | null;
    pageTitle?: string;
    iconUrl?: string | null;
    openaiApiKey?: string | null;
    groqApiKey?: string | null;
  }) {
    try {
      // Buscar configuração existente
      let settings = await prisma.settings.findFirst();

      if (settings) {
        // Atualizar configuração existente
        settings = await prisma.settings.update({
          where: { id: settings.id },
          data: {
            wahaHost: data.wahaHost || settings.wahaHost,
            wahaApiKey: data.wahaApiKey || settings.wahaApiKey,
            logoUrl: data.logoUrl !== undefined ? data.logoUrl : settings.logoUrl,
            companyName: data.companyName || settings.companyName,
            faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl : settings.faviconUrl,
            pageTitle: data.pageTitle || settings.pageTitle,
            iconUrl: data.iconUrl !== undefined ? data.iconUrl : settings.iconUrl,
            openaiApiKey: data.openaiApiKey !== undefined ? data.openaiApiKey : settings.openaiApiKey,
            groqApiKey: data.groqApiKey !== undefined ? data.groqApiKey : settings.groqApiKey
          }
        });
      } else {
        // Criar nova configuração
        settings = await prisma.settings.create({
          data: {
            wahaHost: data.wahaHost || '',
            wahaApiKey: data.wahaApiKey || '',
            logoUrl: data.logoUrl || null,
            companyName: data.companyName || 'Sua Empresa',
            faviconUrl: data.faviconUrl || '/api/uploads/default_favicon.png',
            pageTitle: data.pageTitle || 'Sistema de Gestão de Contatos',
            iconUrl: data.iconUrl || '/api/uploads/default_icon.png',
            openaiApiKey: data.openaiApiKey || null,
            groqApiKey: data.groqApiKey || null
          }
        });
      }

      // Limpar cache
      this.cachedSettings = null;

      return settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Método para obter configurações de forma síncrona (para cache)
  getCachedSettings() {
    return this.cachedSettings;
  }

  // Método para obter configurações WAHA especificamente
  async getWahaConfig() {
    const settings = await this.getSettings();
    return {
      host: settings.wahaHost,
      apiKey: settings.wahaApiKey
    };
  }
}

export const settingsService = SettingsService.getInstance();