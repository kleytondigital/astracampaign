import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  Building2, 
  BarChart3, 
  MessageSquare, 
  ChartSpline, 
  Megaphone, 
  UserCheck, 
  Lightbulb, 
  TrendingUp, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  PlugZapIcon,
  Wrench,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { UserRole } from '../../utils/permissions';

// Função utilitária para classes CSS
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Interface para itens do menu
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
}

// Interface para seções do menu
interface SidebarSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

// Interface principal do Sidebar
interface SidebarProps {
  className?: string;
}

// Componente para itens individuais
const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon, 
  label, 
  to, 
  badge, 
  isActive, 
  onClick 
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
        isActive
          ? "bg-white text-gray-900 shadow-sm"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </div>
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </Link>
  );
};

// Componente para seções
const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, 
  children, 
  className 
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <h3 className="px-3 text-xs font-semibold text-white/60 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

// Componente principal do Sidebar
export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useGlobalSettings();
  
  const userRole = (user?.role as UserRole) || 'USER';
  const userName = user?.nome || 'Usuário';
  const userEmail = user?.email || 'usuario@exemplo.com';
  const companyName = settings?.companyName || 'B2X CRM';
  const logoUrl = settings?.iconUrl;


  // Itens do menu baseados no role
  const getMenuItems = () => {
    // SUPERADMIN - Acesso total ao sistema
    if (userRole === 'SUPERADMIN') {
      return [
        {
          to: '/superadmin/dashboard',
          icon: <LayoutGrid className="w-5 h-5" />,
          label: 'Dashboard'
        },
        {
          to: '/empresas',
          icon: <Building2 className="w-5 h-5" />,
          label: 'Empresas'
        },
        {
          to: '/usuarios',
          label: 'Usuários',
          icon: <Users className="w-5 h-5" />
        },
        {
          to: '/meta-settings',
          label: 'Meta Ads',
          icon: <ChartSpline className="w-5 h-5" />,
        },
        {
          to: '/configuracoes',
          icon: <Wrench className="w-5 h-5" />,
          label: 'Integrações'
        },
        {
          to: '/super-admin',
          icon: <Settings className="w-5 h-5" />,
          label: 'Configurações'
        },


      ];
    }

    // ADMIN - Gestão completa do tenant
    if (userRole === 'ADMIN') {
      return [
        {
          to: '/admin-dashboard',
          icon: <Home className="w-5 h-5" />,
          label: 'Dashboard'
        },
        {
          to: '/departamentos',
          icon: <Building2 className="w-5 h-5" />,
          label: 'Departamentos'
        },
        {
          to: '/usuarios',
          icon: <Users className="w-5 h-5" />,
          label: 'Usuários'
        },
        {
          to: '/whatsapp',
          icon: <PlugZapIcon className="w-5 h-5" />,
          label: 'Conexões'
        },
        {
          to: '/atendimento',
          icon: <MessageSquare className="w-5 h-5" />,
          label: 'Atendimento'
        },
        {
          to: '/campanhas',
          icon: <Megaphone className="w-5 h-5" />,
          label: 'Campanhas'
        },
        {
          to: '/contatos',
          icon: <UserCheck className="w-5 h-5" />,
          label: 'Contatos'
        },
        {
          to: '/leads',
          icon: <Lightbulb className="w-5 h-5" />,
          label: 'Leads'
        },
        {
          to: '/oportunidades',
          icon: <TrendingUp className="w-5 h-5" />,
          label: 'Oportunidades'
        },
        {
          to: '/empresas',
          icon: <Building2 className="w-5 h-5" />,
          label: 'Empresas'
        },
        {
          to: '/atividades',
          icon: <FileText className="w-5 h-5" />,
          label: 'Atividades'
        },
        {
          to: '/vendas-dashboard',
          icon: <BarChart3 className="w-5 h-5" />,
          label: 'Vendas'
        },
        {
          to: '/automacoes-vendas',
          icon: <Settings className="w-5 h-5" />,
          label: 'Automações'
        },
        {
          to: '/relatorios',
          icon: <FileText className="w-5 h-5" />,
          label: 'Relatórios'
        },
        {
          to: '/configuracoes',
          icon: <Wrench className="w-5 h-5" />,
          label: 'Integrações'
        }
      ];
    }

    // TENANT_ADMIN - Gestão operacional
    if (userRole === 'TENANT_ADMIN') {
      return [
        {
          to: '/admin-dashboard',
          icon: <Home className="w-5 h-5" />,
          label: 'Dashboard'
        },
        {
          to: '/departamentos',
          icon: <Building2 className="w-5 h-5" />,
          label: 'Departamentos'
        },
        {
          to: '/usuarios',
          icon: <Users className="w-5 h-5" />,
          label: 'Usuários'
        },
        {
          to: '/whatsapp',
          icon: <PlugZapIcon className="w-5 h-5" />,
          label: 'Conexões'
        },
        {
          to: '/atendimento',
          icon: <MessageSquare className="w-5 h-5" />,
          label: 'Atendimento'
        },
        {
          to: '/campanhas',
          icon: <Megaphone className="w-5 h-5" />,
          label: 'Campanhas'
        },
        {
          to: '/contatos',
          icon: <UserCheck className="w-5 h-5" />,
          label: 'Contatos'
        },
        {
          to: '/leads',
          icon: <Lightbulb className="w-5 h-5" />,
          label: 'Leads'
        },
        {
          to: '/oportunidades',
          icon: <TrendingUp className="w-5 h-5" />,
          label: 'Oportunidades'
        },
        {
          to: '/atividades',
          icon: <FileText className="w-5 h-5" />,
          label: 'Atividades'
        },
        {
          to: '/relatorios',
          icon: <FileText className="w-5 h-5" />,
          label: 'Relatórios'
        }
      ];
    }

    // USER - Operação básica
    return [
      {
        to: '/atendimento',
        icon: <MessageSquare className="w-5 h-5" />,
        label: 'Atendimento'
      },
      {
        to: '/contatos',
        icon: <UserCheck className="w-5 h-5" />,
        label: 'Contatos'
      },
      {
        to: '/leads',
        icon: <Lightbulb className="w-5 h-5" />,
        label: 'Leads'
      },
      {
        to: '/oportunidades',
        icon: <TrendingUp className="w-5 h-5" />,
        label: 'Oportunidades'
      },
      {
        to: '/atividades',
        icon: <FileText className="w-5 h-5" />,
        label: 'Atividades'
      }
    ];
  };

  const menuItems = getMenuItems();

  return (
      <div
        className={cn(
          "flex flex-col min-h-screen h-auto transition-all duration-300",
          isCollapsed ? "w-18" : "w-64",
          className
        )}
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >

  
      {/* Header com Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="w-6 h-6 object-contain"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate text-white">{companyName}</span>
              <span className="text-xs text-white/60 truncate">
                {userRole === 'SUPERADMIN' ? 'Super Admin' : 
                 userRole === 'ADMIN' ? 'Admin' : 
                 userRole === 'TENANT_ADMIN' ? 'Tenant Admin' : 'Usuário'}
              </span>
            </div>
          )}
        </div>
        
        {/* Botão de toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SidebarSection>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              isActive={location.pathname === item.to}
            />
          ))}
        </SidebarSection>
      </div>



      {/* Footer com usuário e logout */}
      <div className="border-t border-white/10 p-4">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{userName}</p>
                <p className="text-xs text-white/60 truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
