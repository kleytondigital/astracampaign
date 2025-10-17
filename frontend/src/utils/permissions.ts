// Sistema de permissões por tipo de usuário

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'TENANT_ADMIN' | 'USER';

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage?: boolean; // Para operações administrativas
}

export interface UserPermissions {
  // Gestão
  departments: Permission;
  users: Permission;
  settings: Permission;
  
  // Comunicação
  whatsapp: Permission;
  atendimento: Permission;
  campaigns: Permission;
  
  // CRM
  contacts: Permission;
  leads: Permission;
  opportunities: Permission;
  activities: Permission;
  
  // Vendas
  vendasDashboard: Permission;
  automacoes: Permission;
  metaAds: Permission;
  
  // Relatórios
  reports: Permission;
  
  // SuperAdmin
  empresas: Permission;
  metaSettings: Permission;
}

// Permissões por role
const permissions: Record<UserRole, UserPermissions> = {
  SUPERADMIN: {
    // Gestão - Acesso total
    departments: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    settings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Comunicação - Acesso total
    whatsapp: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    atendimento: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    campaigns: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // CRM - Acesso total
    contacts: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    leads: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    opportunities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    activities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Vendas - Acesso total
    vendasDashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    automacoes: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    metaAds: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Relatórios - Acesso total
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // SuperAdmin - Acesso exclusivo
    empresas: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    metaSettings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
  },

  ADMIN: {
    // Gestão - Acesso total no tenant
    departments: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    settings: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Comunicação - Acesso total
    whatsapp: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    atendimento: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    campaigns: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // CRM - Acesso total
    contacts: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    leads: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    opportunities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    activities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Vendas - Acesso total
    vendasDashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    automacoes: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    metaAds: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Relatórios - Acesso total
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // SuperAdmin - Sem acesso
    empresas: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    metaSettings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
  },

  TENANT_ADMIN: {
    // Gestão - Acesso limitado
    departments: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    settings: { canView: true, canCreate: false, canEdit: true, canDelete: false, canManage: false },
    
    // Comunicação - Acesso total
    whatsapp: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    atendimento: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    campaigns: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // CRM - Acesso total
    contacts: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    leads: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    opportunities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    activities: { canView: true, canCreate: true, canEdit: true, canDelete: true, canManage: true },
    
    // Vendas - Acesso limitado
    vendasDashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    automacoes: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    metaAds: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    
    // Relatórios - Acesso limitado
    reports: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    
    // SuperAdmin - Sem acesso
    empresas: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    metaSettings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
  },

  USER: {
    // Gestão - Apenas visualização
    departments: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    
    // Comunicação - Acesso limitado
    whatsapp: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    atendimento: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    campaigns: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    
    // CRM - Acesso limitado
    contacts: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    leads: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    opportunities: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    activities: { canView: true, canCreate: true, canEdit: true, canDelete: false, canManage: false },
    
    // Vendas - Apenas visualização
    vendasDashboard: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    automacoes: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    metaAds: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    
    // Relatórios - Apenas visualização
    reports: { canView: true, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    
    // SuperAdmin - Sem acesso
    empresas: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
    metaSettings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canManage: false },
  },
};

// Hook para verificar permissões
export function usePermissions(userRole: UserRole) {
  return permissions[userRole] || permissions.USER;
}

// Função utilitária para verificar permissão específica
export function hasPermission(
  userRole: UserRole, 
  resource: keyof UserPermissions, 
  action: keyof Permission
): boolean {
  const userPermissions = permissions[userRole] || permissions.USER;
  return userPermissions[resource][action];
}

// Função para verificar se usuário pode acessar uma rota
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const routePermissions: Record<string, keyof UserPermissions> = {
    '/departamentos': 'departments',
    '/usuarios': 'users',
    '/configuracoes': 'settings',
    '/whatsapp': 'whatsapp',
    '/atendimento': 'atendimento',
    '/campanhas': 'campaigns',
    '/contatos': 'contacts',
    '/leads': 'leads',
    '/oportunidades': 'opportunities',
    '/atividades': 'activities',
    '/vendas-dashboard': 'vendasDashboard',
    '/automacoes-vendas': 'automacoes',
    '/meta-integration': 'metaAds',
    '/relatorios': 'reports',
    '/empresas': 'empresas',
    '/meta-settings': 'metaSettings',
  };

  const resource = routePermissions[route];
  if (!resource) return true; // Rota não mapeada, permitir acesso

  return hasPermission(userRole, resource, 'canView');
}
