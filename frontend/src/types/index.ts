export interface Contact {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  observacoes?: string | null;
  categoriaId?: string | null;
  categoria?: Category | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ContactInput {
  nome: string;
  telefone: string;
  email?: string;
  observacoes?: string;
  categoriaId?: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Category {
  id: string;
  nome: string;
  cor: string;
  descricao?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CategoryInput {
  nome: string;
  cor: string;
  descricao?: string;
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  message?: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  ultimoLogin?: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UserInput {
  nome: string;
  email: string;
  senha?: string;
  role: string;
  ativo?: boolean;
}

export interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// CRM TYPES - OPPORTUNITIES AND PIPELINE
// ============================================================================

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  industry?: string | null;
  size?: CompanySize | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: any | null;
  description?: string | null;
  tags: string[];
  customFields?: any | null;
  assignedTo?: string | null;
  assignedUser?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInput {
  name: string;
  industry?: string;
  size?: CompanySize;
  website?: string;
  phone?: string;
  email?: string;
  address?: any;
  description?: string;
  tags?: string[];
  customFields?: any;
  assignedTo?: string;
}

export enum CompanySize {
  STARTUP = 'STARTUP',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

export interface Opportunity {
  id: string;
  tenantId: string;
  contactId?: string | null;
  companyId?: string | null;
  title: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expectedClose?: string | null;
  actualClose?: string | null;
  source?: string | null;
  description?: string | null;
  assignedTo?: string | null;
  tags: string[];
  customFields?: any | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  company?: Company | null;
  assignedUser?: User | null;
  activities?: Activity[];
}

export interface OpportunityInput {
  contactId?: string;
  companyId?: string;
  title: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expectedClose?: string;
  actualClose?: string;
  source?: string;
  description?: string;
  assignedTo?: string;
  tags?: string[];
  customFields?: any;
}

export enum OpportunityStage {
  PROSPECT = 'PROSPECT',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST',
  ON_HOLD = 'ON_HOLD',
}

export interface Activity {
  id: string;
  tenantId: string;
  contactId?: string | null;
  opportunityId?: string | null;
  type: ActivityType;
  subject: string;
  description?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  assignedTo: string;
  priority: Priority;
  status: ActivityStatus;
  metadata?: any | null;
  createdAt: string;
  contact?: Contact | null;
  opportunity?: Opportunity | null;
  assignedUser: User;
}

export interface ActivityInput {
  contactId?: string;
  opportunityId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  dueDate?: string;
  assignedTo: string;
  priority: Priority;
  status?: ActivityStatus;
  metadata?: any;
}

export enum ActivityType {
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  MEETING = 'MEETING',
  TASK = 'TASK',
  WHATSAPP = 'WHATSAPP',
  NOTE = 'NOTE',
  FOLLOW_UP = 'FOLLOW_UP',
  PROPOSAL = 'PROPOSAL',
  DEMO = 'DEMO',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ActivityStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface Lead {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  source: LeadSource;
  status: LeadStatus;
  score: number;
  tags: string[];
  customFields?: any | null;
  assignedTo?: string | null;
  convertedAt?: string | null;
  convertedToContactId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: User | null;
  convertedToContact?: Contact | null;
}

export interface LeadInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  status?: LeadStatus;
  score?: number;
  tags?: string[];
  customFields?: any;
  assignedTo?: string;
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  REFERRAL = 'REFERRAL',
  COLD_CALL = 'COLD_CALL',
  EMAIL_CAMPAIGN = 'EMAIL_CAMPAIGN',
  WHATSAPP_CAMPAIGN = 'WHATSAPP_CAMPAIGN',
  EVENT = 'EVENT',
  ADS = 'ADS',
  OTHER = 'OTHER',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

// ============================================================================
// CRM RESPONSE TYPES
// ============================================================================

export interface OpportunitiesResponse {
  opportunities: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// CHAT & MESSAGES TYPES
// ============================================================================

export interface Chat {
  id: string;
  tenantId: string;
  phone: string;
  contactName?: string | null;
  profilePicture?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  assignedTo?: string | null;
  departmentId?: string | null;
  serviceStatus?: ChatServiceStatus | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  status: ChatStatus;
  sessionId?: string | null;
  isSyncing?: boolean;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  lead?: Lead | null;
  assignedUser?: User | null;
  department?: Department | null;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  active: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  phone: string;
  fromMe: boolean;
  body?: string | null;
  mediaUrl?: string | null;
  type: ChatMessageType;
  timestamp: string;
  ack?: number | null;
  messageId?: string | null;
  quotedMsgId?: string | null;
  metadata?: any | null;
  createdAt: string;
}

export enum ChatStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export enum ChatServiceStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  CLOSED = 'CLOSED',
  PAUSED = 'PAUSED',
}

export enum ChatMessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  STICKER = 'STICKER',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  LINK = 'LINK',
  OTHER = 'OTHER',
}

export interface ChatsResponse {
  success: boolean;
  chats: Chat[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatResponse {
  success: boolean;
  chat: Chat;
  messages: Message[];
  messagesPagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ChatStatsResponse {
  success: boolean;
  stats: {
    total: number;
    open: number;
    pending: number;
    resolved: number;
    unread: number;
    today: number;
  };
}

export interface CRMNotification {
  id: string;
  tenantId: string;
  userId: string;
  type: CRMNotificationType;
  title: string;
  message: string;
  link?: string | null;
  data?: any | null;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export enum CRMNotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  ACTIVITY_DUE = 'ACTIVITY_DUE',
  OPPORTUNITY_UPDATE = 'OPPORTUNITY_UPDATE',
  LEAD_HOT = 'LEAD_HOT',
  ACTIVITY_COMPLETED = 'ACTIVITY_COMPLETED',
  CHAT_ASSIGNED = 'CHAT_ASSIGNED',
  SYSTEM = 'SYSTEM',
  INFO = 'INFO',
}

// ============================================================================
// CRM DASHBOARD TYPES
// ============================================================================

export interface SalesDashboard {
  pipeline: {
    totalValue: number;
    wonValue: number;
    lostValue: number;
    conversionRate: number;
  };
  activities: {
    totalActivities: number;
    completedToday: number;
    overdue: number;
    byType: Record<ActivityType, number>;
  };
  performance: {
    topPerformers: Array<{
      userId: string;
      userName: string;
      dealsWon: number;
      revenue: number;
    }>;
    salesFunnel: Array<{
      stage: OpportunityStage;
      count: number;
      value: number;
      avgDays: number;
    }>;
  };
  trends: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    leadSources: Array<{ source: string; count: number; value: number }>;
  };
}

// ============================================================================
// MÓDULO DE RELATÓRIOS E DASHBOARDS
// ============================================================================

export interface DataSource {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  url: string;
  credentials?: string | null;
  active: boolean;
  lastSync?: string | null;
  syncStatus: 'PENDING' | 'SUCCESS' | 'ERROR' | 'SYNCING';
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
    reports: number;
  };
}

export interface CampaignData {
  id: string;
  dataSourceId: string;
  tenantId: string;
  campaignName: string;
  date: string;
  cost: number;
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  costPerConversion?: number | null;
  roi?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  tenantId: string;
  dataSourceId?: string | null;
  name: string;
  type: 'DASHBOARD' | 'SUMMARY' | 'CUSTOM';
  config: any;
  isPublic: boolean;
  shareToken?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dataSource?: {
    id: string;
    name: string;
    type: string;
  } | null;
  creator?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

export interface ReportData {
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

export interface TestConnectionResult {
  success: boolean;
  columns?: string[];
  sampleData?: any[];
  totalRows?: number;
  error?: string;
}

export interface SyncResult {
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
}
