// ============================================================================
// META ADS INTEGRATION TYPES
// ============================================================================

export interface MetaGlobalSettings {
  id?: number;
  appId: string;
  redirectUri: string;
  suggestedRedirectUri?: string; // URL sugerida automaticamente pelo backend
  scopes: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MetaTenantConnection {
  id: number;
  tenantId: string;
  fbUserId?: string;
  tokenType?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  accounts?: MetaAccount[];
}

export interface MetaAccount {
  id: number;
  tenantId: string;
  connectionId: number;
  accountId: string; // act_<ID>
  name: string;
  currency?: string;
  timezone?: string;
  status?: string;
  lastSyncedAt?: string;
  syncStatus: 'PENDING' | 'SUCCESS' | 'ERROR';
  errorMessage?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  campaigns?: MetaCampaign[];
  adSets?: MetaAdSet[];
  ads?: MetaAd[];
  insights?: MetaInsight[];
}

export interface MetaCampaign {
  id: number;
  tenantId: string;
  accountId: number;
  campaignId: string;
  name?: string;
  status?: string;
  objective?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime?: string;
  stopTime?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  adSets?: MetaAdSet[];
  ads?: MetaAd[];
  insights?: MetaInsight[];
}

export interface MetaAdSet {
  id: number;
  tenantId: string;
  accountId: number;
  campaignId: number;
  adSetId: string;
  name?: string;
  status?: string;
  optimizationGoal?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime?: string;
  endTime?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  ads?: MetaAd[];
  insights?: MetaInsight[];
}

export interface MetaAd {
  id: number;
  tenantId: string;
  accountId: number;
  campaignId: number;
  adSetId: number;
  adId: string;
  name?: string;
  status?: string;
  creative?: any;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  insights?: MetaInsight[];
}

export interface MetaInsight {
  id: number;
  tenantId: string;
  accountId: number;
  campaignId?: number;
  adSetId?: number;
  adId?: number;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  cpm: number; // Cost per mille
  cpp: number; // Cost per purchase
  conversions: number;
  conversionRate: number;
  roas: number; // Return on ad spend
  createdAt: string;
  updatedAt: string;
}

export interface MetaLog {
  id: number;
  tenantId: string;
  connectionId: number;
  type: 'TOKEN_CREATED' | 'TOKEN_REFRESHED' | 'SYNC_SUCCESS' | 'SYNC_ERROR' | 'API_RATE_LIMIT';
  message: string;
  details?: any;
  createdAt: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface MetaConnectionStatus {
  connected: boolean;
  connectionId?: number;
  expiresAt?: string;
  lastUsedAt?: string;
  tokenValid: boolean;
  accountsCount: number;
  accounts: MetaAccount[];
  logsCount: number;
  message?: string;
}

export interface MetaAdAccountFromAPI {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business_name?: string;
  isLinked?: boolean;
  status?: 'LINKED' | 'AVAILABLE';
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface MetaGlobalSettingsForm {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scopes: string;
}

export interface MetaLinkAccountRequest {
  accountId: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface MetaDashboardData {
  summary: {
    totalAccounts: number;
    totalCampaigns: number;
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    averageCtr: number;
    averageCpc: number;
    averageRoas: number;
  };
  trends: {
    spendTrend: number;
    impressionsTrend: number;
    clicksTrend: number;
    conversionsTrend: number;
    ctrTrend: number;
    cpcTrend: number;
    roasTrend: number;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    roas: number;
  }>;
  dailyData: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    roas: number;
  }>;
  insights: string[];
}

// ============================================================================
// SYNC TYPES
// ============================================================================

export interface MetaSyncResult {
  accountsProcessed: number;
  campaignsProcessed: number;
  adSetsProcessed: number;
  adsProcessed: number;
  insightsProcessed: number;
  errors: string[];
  duration: number;
}

export interface MetaSyncStatus {
  isRunning: boolean;
  lastSync?: string;
  nextSync?: string;
  progress?: number;
  status?: string;
  error?: string;
}
