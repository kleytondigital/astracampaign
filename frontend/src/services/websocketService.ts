import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(token: string, tenantId?: string) {
    if (this.socket?.connected) {
      console.log('WebSocket já conectado');
      return;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

    console.log('🔌 Conectando ao WebSocket...', { wsUrl, tenantId });

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado!', this.socket?.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }

  // Escutar evento de nova mensagem
  onNewMessage(tenantId: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.error('❌ WebSocket não conectado');
      return;
    }

    // Backend emite 'chat:new-message' para room 'tenant_xxx'
    const eventName = 'chat:new-message';
    console.log('👂 Escutando evento:', eventName, 'para tenant:', tenantId);

    this.socket.on(eventName, (data) => {
      console.log('📨 Nova mensagem recebida via WebSocket:', data);
      callback(data);
    });
  }

  // Remover listener de nova mensagem
  offNewMessage(tenantId: string) {
    if (!this.socket) return;

    const eventName = 'chat:new-message';
    this.socket.off(eventName);
    console.log('🔇 Parou de escutar:', eventName);
  }

  // Emitir evento (se necessário)
  emit(event: string, data: any) {
    if (!this.socket) {
      console.error('❌ WebSocket não conectado');
      return;
    }

    this.socket.emit(event, data);
  }

  // Método genérico para escutar qualquer evento
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.error('❌ WebSocket não conectado');
      return;
    }

    this.socket.on(event, callback);
  }

  // Método genérico para parar de escutar
  off(event: string) {
    if (!this.socket) return;
    this.socket.off(event);
  }
}

export const websocketService = new WebSocketService();
