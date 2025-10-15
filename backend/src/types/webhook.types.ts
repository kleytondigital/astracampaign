/**
 * Tipos TypeScript para Webhook e WebSocket
 * Suporta Evolution API e WAHA API
 */

// ============================================================================
// WEBHOOK CONFIGURATION
// ============================================================================

export interface WebhookConfig {
  url: string;
  enabled?: boolean;
  events?: string[];
  headers?: Record<string, string>;
  webhookByEvents?: boolean; // Evolution específico
  webhookBase64?: boolean; // Evolution específico
  retries?: number; // WAHA específico
  hmac?: string | null; // WAHA específico
}

export interface EvolutionWebhookConfig extends WebhookConfig {
  webhookByEvents: boolean;
  webhookBase64: boolean;
}

export interface WahaWebhookConfig extends WebhookConfig {
  retries: number;
  hmac: string | null;
  customHeaders: Array<{ name: string; value: string }>;
}

// ============================================================================
// WEBHOOK EVENTS (Evolution API)
// ============================================================================

export enum EvolutionWebhookEvent {
  // Connection events
  CONNECTION_UPDATE = 'CONNECTION_UPDATE',
  QRCODE_UPDATED = 'QRCODE_UPDATED',

  // Message events
  MESSAGES_UPSERT = 'MESSAGES_UPSERT',
  MESSAGES_UPDATE = 'MESSAGES_UPDATE',
  MESSAGES_DELETE = 'MESSAGES_DELETE',

  // Contact events
  CONTACTS_UPDATE = 'CONTACTS_UPDATE',
  CONTACTS_UPSERT = 'CONTACTS_UPSERT',

  // Chat events
  CHATS_UPDATE = 'CHATS_UPDATE',
  CHATS_UPSERT = 'CHATS_UPSERT',
  CHATS_DELETE = 'CHATS_DELETE',

  // Group events
  GROUPS_UPDATE = 'GROUPS_UPDATE',
  GROUPS_UPSERT = 'GROUPS_UPSERT',

  // Presence events
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',

  // Call events
  CALL = 'CALL',

  // Status events
  STATUS_INSTANCE = 'STATUS_INSTANCE',

  // Send events
  SEND_MESSAGE = 'SEND_MESSAGE',

  // Labels
  LABELS_EDIT = 'LABELS_EDIT',
  LABELS_ASSOCIATION = 'LABELS_ASSOCIATION'
}

// ============================================================================
// WEBHOOK EVENTS (WAHA API)
// ============================================================================

export enum WahaWebhookEvent {
  MESSAGE = 'message',
  MESSAGE_ACK = 'message.ack',
  MESSAGE_REVOKED = 'message.revoked',
  SESSION_STATUS = 'session.status',
  STATE_CHANGED = 'state.changed',
  GROUP_JOIN = 'group.join',
  GROUP_LEAVE = 'group.leave',
  POLL_VOTE = 'poll.vote',
  POLL_VOTE_FAILED = 'poll.vote.failed'
}

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export interface WebSocketEventPayload<T = any> {
  event: string;
  instanceName: string;
  data: T;
  timestamp: Date;
  provider: 'EVOLUTION' | 'WAHA';
}

// Connection update event
export interface ConnectionUpdateEvent {
  state: 'open' | 'connecting' | 'close';
  legacy?: boolean;
  isOnline?: boolean;
  isNewLogin?: boolean;
  qr?: string;
}

// QR Code update event
export interface QRCodeUpdateEvent {
  qr: string;
  base64?: string;
  pairingCode?: string;
}

// Message event
export interface MessageEvent {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: any;
  messageType: string;
  messageTimestamp: number;
  pushName?: string;
  broadcast?: boolean;
}

// Message ACK event
export interface MessageAckEvent {
  id: string;
  chat: string;
  ack: number; // 0=pending, 1=sent, 2=delivered, 3=read
  timestamp: number;
}

// Status instance event
export interface StatusInstanceEvent {
  instance: string;
  status: 'open' | 'connecting' | 'close';
}

// ============================================================================
// WEBHOOK RESPONSE TYPES
// ============================================================================

export interface WebhookSetResponse {
  success: boolean;
  message: string;
  webhook?: WebhookConfig;
}

export interface WebhookGetResponse {
  success: boolean;
  webhook: WebhookConfig | null;
}

export interface WebhookDeleteResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// WEBSOCKET CLIENT CONFIG
// ============================================================================

export interface WebSocketClientConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  headers?: Record<string, string>;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export type WebSocketEventHandler<T = any> = (
  payload: WebSocketEventPayload<T>
) => void | Promise<void>;

export interface EventHandlers {
  onConnectionUpdate?: WebSocketEventHandler<ConnectionUpdateEvent>;
  onQRCodeUpdate?: WebSocketEventHandler<QRCodeUpdateEvent>;
  onMessage?: WebSocketEventHandler<MessageEvent>;
  onMessageAck?: WebSocketEventHandler<MessageAckEvent>;
  onStatusInstance?: WebSocketEventHandler<StatusInstanceEvent>;
  onError?: (error: Error) => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
}






