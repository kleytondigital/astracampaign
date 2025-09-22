import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WhatsAppSessionData {
  name: string;
  status: 'WORKING' | 'SCAN_QR_CODE' | 'STOPPED' | 'FAILED';
  config?: any;
  me?: {
    id: string;
    pushName: string;
    lid?: string;
    jid?: string;
  };
  qr?: string;
  qrExpiresAt?: Date;
  assignedWorker?: string;
}

export class WhatsAppSessionService {
  static async getAllSessions() {
    const sessions = await prisma.whatsAppSession.findMany({
      orderBy: { atualizadoEm: 'desc' }
    });

    return sessions.map(session => ({
      name: session.name,
      status: session.status,
      config: session.config ? JSON.parse(session.config) : {},
      me: session.meId ? {
        id: session.meId,
        pushName: session.mePushName || '',
        lid: session.meLid,
        jid: session.meJid
      } : undefined,
      qr: session.qr,
      qrExpiresAt: session.qrExpiresAt,
      assignedWorker: session.assignedWorker
    }));
  }

  static async getSession(name: string) {
    const session = await prisma.whatsAppSession.findUnique({
      where: { name }
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    return {
      name: session.name,
      status: session.status,
      config: session.config ? JSON.parse(session.config) : {},
      me: session.meId ? {
        id: session.meId,
        pushName: session.mePushName || '',
        lid: session.meLid,
        jid: session.meJid
      } : undefined,
      qr: session.qr,
      qrExpiresAt: session.qrExpiresAt,
      assignedWorker: session.assignedWorker
    };
  }

  static async createOrUpdateSession(data: WhatsAppSessionData) {
    const sessionData = {
      name: data.name,
      status: data.status,
      config: data.config ? JSON.stringify(data.config) : null,
      meId: data.me?.id || null,
      mePushName: data.me?.pushName || null,
      meLid: data.me?.lid || null,
      meJid: data.me?.jid || null,
      qr: data.qr || null,
      qrExpiresAt: data.qrExpiresAt || null,
      assignedWorker: data.assignedWorker || null
    };

    const session = await prisma.whatsAppSession.upsert({
      where: { name: data.name },
      update: {
        ...sessionData,
        atualizadoEm: new Date()
      },
      create: {
        ...sessionData,
        criadoEm: new Date(),
        atualizadoEm: new Date()
      }
    });

    return session;
  }

  static async deleteSession(name: string) {
    await prisma.whatsAppSession.delete({
      where: { name }
    });
  }

  static async updateSessionStatus(name: string, status: string, additionalData?: Partial<WhatsAppSessionData>) {
    const updateData: any = {
      status,
      atualizadoEm: new Date()
    };

    if (additionalData?.me) {
      updateData.meId = additionalData.me.id;
      updateData.mePushName = additionalData.me.pushName;
      updateData.meLid = additionalData.me.lid;
      updateData.meJid = additionalData.me.jid;
    }

    if (additionalData?.qr !== undefined) {
      updateData.qr = additionalData.qr;
    }

    if (additionalData?.qrExpiresAt !== undefined) {
      updateData.qrExpiresAt = additionalData.qrExpiresAt;
    }

    if (additionalData?.assignedWorker !== undefined) {
      updateData.assignedWorker = additionalData.assignedWorker;
    }

    await prisma.whatsAppSession.update({
      where: { name },
      data: updateData
    });
  }
}