import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TenantSettingsService {
  async getTenantSettings(tenantId: string) {
    try {
      console.log(
        '📋 TenantSettingsService.getTenantSettings - tenantId:',
        tenantId,
        'type:',
        typeof tenantId
      );

      if (!tenantId || tenantId === 'undefined' || tenantId === 'null') {
        console.log('⚠️ TenantID não fornecido (usuário pode ser SUPERADMIN)');
        return null; // SUPERADMIN não precisa de tenant settings
      }

      // Verificar se o tenant existe antes de tentar criar settings
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        console.warn('⚠️ Tenant não encontrado:', tenantId);
        return null; // Retornar null ao invés de lançar erro
      }

      let settings = await prisma.tenantSettings.findUnique({
        where: { tenantId }
      });

      if (!settings) {
        console.log(
          '⚠️ TenantSettings não encontrado, criando novo para tenantId:',
          tenantId
        );
        settings = await prisma.tenantSettings.create({
          data: {
            tenantId,
            openaiApiKey: null,
            groqApiKey: null,
            customBranding: undefined
          }
        });
      }

      return settings;
    } catch (error) {
      console.error(
        '❌ Error getting tenant settings for tenantId:',
        tenantId,
        'error:',
        error
      );
      throw error;
    }
  }

  async updateTenantSettings(
    tenantId: string,
    data: {
      openaiApiKey?: string | null;
      groqApiKey?: string | null;
      customBranding?: any;
    }
  ) {
    try {
      const settings = await prisma.tenantSettings.upsert({
        where: { tenantId },
        update: {
          openaiApiKey:
            data.openaiApiKey !== undefined ? data.openaiApiKey : undefined,
          groqApiKey:
            data.groqApiKey !== undefined ? data.groqApiKey : undefined,
          customBranding:
            data.customBranding !== undefined ? data.customBranding : undefined
        },
        create: {
          tenantId,
          openaiApiKey: data.openaiApiKey || null,
          groqApiKey: data.groqApiKey || null,
          customBranding: data.customBranding || undefined
        }
      });

      return settings;
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      throw error;
    }
  }
}

export const tenantSettingsService = new TenantSettingsService();
