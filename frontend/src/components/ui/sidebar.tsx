import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  LogOut,
  PlugZapIcon,
  Wrench,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';
import { UserRole } from '../../utils/permissions';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to?: string;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
}

interface SidebarGroupProps {
  title: string;
  icon: React.ReactNode;
  items: SidebarItemProps[];
  isCollapsed: boolean;
}

interface SidebarProps {
  className?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  to,
  badge,
  isActive,
  onClick,
}) => {
  const Item = (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer',
        isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'
      )}
      title={label} // Tooltip para quando colapsado
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
    </div>
  );

  return to ? <Link to={to}>{Item}</Link> : Item;
};

const SidebarGroup: React.FC<SidebarGroupProps> = ({ title, icon, items, isCollapsed }) => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // Fechar submenu quando sidebar colapsar
  useEffect(() => {
    if (isCollapsed) {
      setOpen(false);
    }
  }, [isCollapsed]);

  // Se colapsado, mostrar apenas ícones dos itens principais
  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {items.slice(0, 3).map((item) => (
          <SidebarItem
            key={item.label}
            {...item}
            isActive={location.pathname === item.to}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-white/80 hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
            {icon}
          </div>
          <span>{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="pl-8 space-y-1 transition-all">
          {items.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              isActive={location.pathname === item.to}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem('sidebar-collapsed') === 'true'
  );
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useGlobalSettings();

  // Expandir automaticamente no hover quando colapsado
  const shouldExpand = isHovered && isCollapsed;

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    window.dispatchEvent(new CustomEvent('sidebar-collapse', { detail: { collapsed: newState } }));
  };

  const userRole = (user?.role as UserRole) || 'USER';
  const userName = user?.nome || 'Usuário';
  const userEmail = user?.email || 'usuario@exemplo.com';
  const companyName = settings?.companyName || 'B2X CRM';
  const logoUrl = settings?.iconUrl;

  // Grupos de menu dinâmicos conforme o papel do usuário
  const menuGroups: SidebarGroupProps[] = [];

  if (userRole === 'SUPERADMIN') {
    menuGroups.push(
      {
        title: 'Administração',
        icon: <Settings size={22} />,
        items: [
          { to: '/superadmin/dashboard', icon: <LayoutGrid size={16} />, label: 'Dashboard' },
          { to: '/empresas', icon: <Building2 size={16} />, label: 'Empresas' },
          { to: '/usuarios', icon: <Users size={16} />, label: 'Usuários' },
          { to: '/meta-settings', icon: <ChartSpline size={16} />, label: 'Meta Ads' },
          { to: '/configuracoes', icon: <Wrench size={16} />, label: 'Integrações' },
        ],
      }
    );
  }

  if (['ADMIN', 'TENANT_ADMIN'].includes(userRole)) {
    menuGroups.push(
      {
        title: 'Comercial',
        icon: <TrendingUp size={22} />,
        items: [
          { to: '/leads', icon: <Lightbulb size={16} />, label: 'Leads' },
          { to: '/oportunidades', icon: <TrendingUp size={16} />, label: 'Oportunidades' },
          { to: '/vendas-dashboard', icon: <BarChart3 size={16} />, label: 'Vendas' },
          { to: '/relatorios', icon: <FileText size={16} />, label: 'Relatórios' },
        ],
      },
      {
        title: 'Comunicação',
        icon: <MessageSquare size={22} />,
        items: [
          { to: '/whatsapp', icon: <PlugZapIcon size={16} />, label: 'Conexões' },
          { to: '/atendimento', icon: <MessageSquare size={16} />, label: 'Atendimento' },
          { to: '/campanhas', icon: <Megaphone size={16} />, label: 'Campanhas' },
        ],
      },
      {
        title: 'Gestão',
        icon: <Users size={22} />,
        items: [
          { to: '/departamentos', icon: <Building2 size={16} />, label: 'Departamentos' },
          { to: '/usuarios', icon: <UserCheck size={16} />, label: 'Usuários' },
          { to: '/configuracoes', icon: <Wrench size={16} />, label: 'Integrações' },
        ],
      }
    );
  }

  if (userRole === 'USER') {
    menuGroups.push({
      title: 'Minhas Atividades',
      icon: <FileText size={22} />,
      items: [
        { to: '/atendimento', icon: <MessageSquare size={16} />, label: 'Atendimento' },
        { to: '/contatos', icon: <UserCheck size={16} />, label: 'Contatos' },
        { to: '/leads', icon: <Lightbulb size={16} />, label: 'Leads' },
        { to: '/oportunidades', icon: <TrendingUp size={16} />, label: 'Oportunidades' },
      ],
    });
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 flex flex-col h-screen transition-all duration-300 z-50',
        shouldExpand ? 'w-64' : isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="w-6 h-6 object-contain" />
            ) : (
              <span className="text-white font-bold text-sm">{companyName.charAt(0)}</span>
            )}
          </div>
          {(!isCollapsed || shouldExpand) && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate text-white">{companyName}</span>
              <span className="text-xs text-white/60 truncate">
                {userRole === 'SUPERADMIN'
                  ? 'Super Admin'
                  : userRole === 'ADMIN'
                  ? 'Admin'
                  : userRole === 'TENANT_ADMIN'
                  ? 'Tenant Admin'
                  : 'Usuário'}
              </span>
            </div>
          )}
        </div>

        {(!isCollapsed || shouldExpand) && (
          <button
            onClick={handleToggleCollapse}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Conteúdo do menu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {menuGroups.map((group) => (
          <SidebarGroup 
            key={group.title} 
            {...group} 
            isCollapsed={isCollapsed && !shouldExpand}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {(!isCollapsed || shouldExpand) ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">{userName.charAt(0)}</span>
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
              <span className="text-sm font-medium text-white">{userName.charAt(0)}</span>
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
