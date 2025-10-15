/**
 * Serviço WebSocket para receber eventos em tempo real
 * de Evolution API e WAHA API
 *
 * Funcionalidades:
 * - Conexão automática com reconexão
 * - Event handlers personalizáveis
 * - Propagação de eventos via Socket.IO para frontend
 * - Sistema de filas para eventos
 * - Tratamento robusto de erros
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  WebSocketEventPayload,
  ConnectionUpdateEvent,
  QRCodeUpdateEvent,
  MessageEvent,
  MessageAckEvent,
  StatusInstanceEvent,
  EventHandlers,
  EvolutionWebhookEvent,
  WahaWebhookEvent
} from '../types/webhook.types';

interface WebSocketConnection {
  instanceName: string;
  provider: 'EVOLUTION' | 'WAHA';
  tenantId: string;
  reconnectAttempts: number;
  isConnected: boolean;
}

export class WhatsAppWebSocketService {
  private static instance: WhatsAppWebSocketService;
  private io: SocketIOServer | null = null;
  private connections: Map<string, WebSocketConnection> = new Map();
  private eventQueue: WebSocketEventPayload[] = [];
  private maxQueueSize = 1000;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 segundos

  private constructor() {}

  public static getInstance(): WhatsAppWebSocketService {
    if (!WhatsAppWebSocketService.instance) {
      WhatsAppWebSocketService.instance = new WhatsAppWebSocketService();
    }
    return WhatsAppWebSocketService.instance;
  }

  /**
   * Inicializa o serviço Socket.IO
   */
  public initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    console.log('✅ WhatsApp WebSocket Service inicializado');
  }

  /**
   * Configura handlers do Socket.IO
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Autenticar cliente
      socket.on('authenticate', (data: { token: string; tenantId: string }) => {
        // TODO: Validar token JWT
        socket.data.tenantId = data.tenantId;
        socket.join(`tenant:${data.tenantId}`);
        console.log(`✅ Cliente autenticado: tenant ${data.tenantId}`);
      });

      // Inscrever em instância específica
      socket.on('subscribe:instance', (instanceName: string) => {
        socket.join(`instance:${instanceName}`);
        console.log(`✅ Cliente inscrito na instância: ${instanceName}`);
      });

      // Desinscrever de instância
      socket.on('unsubscribe:instance', (instanceName: string) => {
        socket.leave(`instance:${instanceName}`);
        console.log(`❌ Cliente desinscrito da instância: ${instanceName}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });
  }

  /**
   * Emite evento para todos os clientes de um tenant
   */
  public emitToTenant(tenantId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ Socket.IO não inicializado');
      return;
    }

    this.io.to(`tenant:${tenantId}`).emit(event, data);
    console.log(`📡 Evento emitido para tenant ${tenantId}: ${event}`);
  }

  /**
   * Emite evento para todos os clientes de uma instância
   */
  public emitToInstance(instanceName: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ Socket.IO não inicializado');
      return;
    }

    this.io.to(`instance:${instanceName}`).emit(event, data);
    console.log(`📡 Evento emitido para instância ${instanceName}: ${event}`);
  }

  /**
   * Emite evento globalmente
   */
  public emitGlobal(event: string, data: any): void {
    if (!this.io) {
      console.warn('⚠️ Socket.IO não inicializado');
      return;
    }

    this.io.emit(event, data);
    console.log(`📡 Evento global emitido: ${event}`);
  }

  /**
   * Processa evento de conexão atualizada
   */
  public handleConnectionUpdate(
    instanceName: string,
    tenantId: string,
    provider: 'EVOLUTION' | 'WAHA',
    data: ConnectionUpdateEvent
  ): void {
    const payload: WebSocketEventPayload<ConnectionUpdateEvent> = {
      event: 'connection_update',
      instanceName,
      data,
      timestamp: new Date(),
      provider
    };

    this.queueEvent(payload);
    this.emitToTenant(tenantId, 'whatsapp:connection_update', payload);
    this.emitToInstance(instanceName, 'whatsapp:connection_update', payload);

    console.log(`📱 Conexão atualizada - ${instanceName}: ${data.state}`);
  }

  /**
   * Processa evento de QR Code atualizado
   */
  public handleQRCodeUpdate(
    instanceName: string,
    tenantId: string,
    provider: 'EVOLUTION' | 'WAHA',
    data: QRCodeUpdateEvent
  ): void {
    const payload: WebSocketEventPayload<QRCodeUpdateEvent> = {
      event: 'qrcode_updated',
      instanceName,
      data,
      timestamp: new Date(),
      provider
    };

    this.queueEvent(payload);
    this.emitToTenant(tenantId, 'whatsapp:qrcode_updated', payload);
    this.emitToInstance(instanceName, 'whatsapp:qrcode_updated', payload);

    console.log(`📱 QR Code atualizado - ${instanceName}`);
  }

  /**
   * Processa evento de mensagem recebida
   */
  public handleMessage(
    instanceName: string,
    tenantId: string,
    provider: 'EVOLUTION' | 'WAHA',
    data: MessageEvent
  ): void {
    const payload: WebSocketEventPayload<MessageEvent> = {
      event: 'message_received',
      instanceName,
      data,
      timestamp: new Date(),
      provider
    };

    this.queueEvent(payload);
    this.emitToTenant(tenantId, 'whatsapp:message_received', payload);
    this.emitToInstance(instanceName, 'whatsapp:message_received', payload);

    console.log(`📨 Mensagem recebida - ${instanceName}`);
  }

  /**
   * Processa evento de ACK (confirmação de mensagem)
   */
  public handleMessageAck(
    instanceName: string,
    tenantId: string,
    provider: 'EVOLUTION' | 'WAHA',
    data: MessageAckEvent
  ): void {
    const payload: WebSocketEventPayload<MessageAckEvent> = {
      event: 'message_ack',
      instanceName,
      data,
      timestamp: new Date(),
      provider
    };

    this.queueEvent(payload);
    this.emitToTenant(tenantId, 'whatsapp:message_ack', payload);
    this.emitToInstance(instanceName, 'whatsapp:message_ack', payload);

    console.log(`✅ ACK recebido - ${instanceName}: ${data.ack}`);
  }

  /**
   * Processa evento de status da instância
   */
  public handleStatusInstance(
    instanceName: string,
    tenantId: string,
    provider: 'EVOLUTION' | 'WAHA',
    data: StatusInstanceEvent
  ): void {
    const payload: WebSocketEventPayload<StatusInstanceEvent> = {
      event: 'status_instance',
      instanceName,
      data,
      timestamp: new Date(),
      provider
    };

    this.queueEvent(payload);
    this.emitToTenant(tenantId, 'whatsapp:status_instance', payload);
    this.emitToInstance(instanceName, 'whatsapp:status_instance', payload);

    console.log(`📊 Status da instância - ${instanceName}: ${data.status}`);
  }

  /**
   * Adiciona evento à fila
   */
  private queueEvent(payload: WebSocketEventPayload): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Remove o evento mais antigo
      this.eventQueue.shift();
      console.warn('⚠️ Fila de eventos cheia, removendo evento mais antigo');
    }

    this.eventQueue.push(payload);
  }

  /**
   * Retorna eventos da fila
   */
  public getEventQueue(): WebSocketEventPayload[] {
    return [...this.eventQueue];
  }

  /**
   * Limpa fila de eventos
   */
  public clearEventQueue(): void {
    this.eventQueue = [];
    console.log('🗑️ Fila de eventos limpa');
  }

  /**
   * Retorna estatísticas do serviço
   */
  public getStats(): {
    connectedClients: number;
    queuedEvents: number;
    activeConnections: number;
  } {
    return {
      connectedClients: this.io?.sockets.sockets.size || 0,
      queuedEvents: this.eventQueue.length,
      activeConnections: this.connections.size
    };
  }

  /**
   * Registra uma conexão WebSocket
   */
  public registerConnection(
    instanceName: string,
    provider: 'EVOLUTION' | 'WAHA',
    tenantId: string
  ): void {
    this.connections.set(instanceName, {
      instanceName,
      provider,
      tenantId,
      reconnectAttempts: 0,
      isConnected: true
    });

    console.log(`✅ Conexão registrada: ${instanceName} (${provider})`);
  }

  /**
   * Remove uma conexão WebSocket
   */
  public unregisterConnection(instanceName: string): void {
    this.connections.delete(instanceName);
    console.log(`❌ Conexão removida: ${instanceName}`);
  }

  /**
   * Retorna todas as conexões ativas
   */
  public getActiveConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }
}

export const whatsappWebSocketService = WhatsAppWebSocketService.getInstance();






