import { Link, useLocation } from 'react-router-dom';
import { useGlobalSettings } from '../hooks/useGlobalSettings';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';

// Componente para renderizar item de menu (suporta submenus)
function MenuItem({ item, isExpanded, location }: { item: any; isExpanded: boolean; location: any }) {
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  
  // Se for um item simples
  if (item.type === 'item') {
    return (
      <li>
        <Link
          to={item.path}
          className={`group relative flex items-center gap-3 ${
            isExpanded ? 'justify-start px-3' : 'justify-center'
          } h-12 rounded-xl transition-all duration-200 ${
            location.pathname === item.path
              ? 'bg-white shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          style={
            location.pathname === item.path ? { color: 'var(--astra-dark-blue)' } : undefined
          }
          title={!isExpanded ? item.label : undefined}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">{item.icon}</div>

          {/* Título (visível quando expandido) */}
          {isExpanded && (
            <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {item.label}
            </span>
          )}

          {/* Tooltip aprimorado (apenas quando recolhido) */}
          {!isExpanded && (
            <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-900 text-sm font-medium py-2 px-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[9999] border border-gray-200">
              {item.label}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-white"></div>
            </div>
          )}
        </Link>
      </li>
    );
  }

  // Se for um grupo com submenu
  if (item.type === 'group') {
    const hasActiveChild = item.items?.some((subItem: any) => location.pathname === subItem.path);
    
    return (
      <li>
        <button
          onClick={() => setIsSubmenuOpen(!isSubmenuOpen)}
          className={`group relative flex items-center gap-3 ${
            isExpanded ? 'justify-start px-3' : 'justify-center'
          } h-12 rounded-xl transition-all duration-200 ${
            hasActiveChild
              ? 'bg-white/20 shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title={!isExpanded ? item.label : undefined}
        >
          <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">{item.icon}</div>

          {/* Título (visível quando expandido) */}
          {isExpanded && (
            <>
              <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {item.label}
              </span>
              <svg
                className={`w-4 h-4 ml-auto transition-transform duration-200 ${
                  isSubmenuOpen ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}

          {/* Tooltip aprimorado (apenas quando recolhido) */}
          {!isExpanded && (
            <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 bg-white text-gray-900 text-sm font-medium py-2 px-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[9999] border border-gray-200">
              {item.label}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-white"></div>
            </div>
          )}
        </button>

        {/* Submenu */}
        {isExpanded && isSubmenuOpen && item.items && (
          <ul className="ml-6 mt-2 space-y-1">
            {item.items.map((subItem: any) => (
              <li key={subItem.path}>
                <Link
                  to={subItem.path}
                  className={`group relative flex items-center gap-3 px-3 h-10 rounded-lg transition-all duration-200 text-sm ${
                    location.pathname === subItem.path
                      ? 'bg-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  style={
                    location.pathname === subItem.path ? { color: 'var(--astra-dark-blue)' } : undefined
                  }
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">{subItem.icon}</div>
                  <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {subItem.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return null;
}

export function Navigation() {
  const location = useLocation();
  const { settings } = useGlobalSettings();
  const { user, logout } = useAuth();

  // Estado da sidebar (expandida no hover)
  const [isExpanded, setIsExpanded] = useState(false);

  // Menus específicos para SUPERADMIN
  const superAdminMenuItems = [
    {
      path: '/empresas',
      label: 'Empresas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
    },
    {
      path: '/usuarios',
      label: 'Usuários',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
    },
    {
      path: '/configuracoes',
      label: 'Configurações',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      path: '/super-admin',
      label: 'Super Admin',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
    },
  ];

  // Menu organizado com submenus
  const regularMenuItems = [
    {
      type: 'item',
      path: '/admin-dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      type: 'group',
      label: 'Gestão',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      items: [
        {
          path: '/departamentos',
          label: 'Departamentos',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          ),
        },
        ...(['ADMIN', 'TENANT_ADMIN'].includes(user?.role || '')
          ? [
              {
                path: '/usuarios',
                label: 'Usuários',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                ),
              },
            ]
          : []),
        {
          path: '/configuracoes',
          label: 'Configurações',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      type: 'group',
      label: 'Comunicação',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      items: [
        {
          path: '/whatsapp',
          label: 'Conexões',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          ),
        },
        {
          path: '/atendimento',
          label: 'Atendimento',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          ),
        },
        {
          path: '/campanhas',
          label: 'Campanhas',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      type: 'group',
      label: 'CRM',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      items: [
        {
          path: '/contatos',
          label: 'Contatos',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          ),
        },
        {
          path: '/leads',
          label: 'Leads',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          ),
        },
        {
          path: '/oportunidades',
          label: 'Oportunidades',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          ),
        },
        {
          path: '/atividades',
          label: 'Atividades',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          ),
        },
      ],
    },
    {
      type: 'group',
      label: 'Vendas',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      items: [
        {
          path: '/vendas-dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          ),
        },
        {
          path: '/automacoes-vendas',
          label: 'Automações',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          ),
        },
      ],
    },
    {
      type: 'item',
      path: '/relatorios',
      label: 'Relatórios',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Escolher menu baseado no role
  const menuItems = user?.role === 'SUPERADMIN' ? superAdminMenuItems : regularMenuItems;

  return (
    <nav
      className={`sidebar-navigation shadow-lg flex flex-col h-screen transition-all duration-300 relative ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      style={{ background: 'var(--sidebar-bg)' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header - Logo/Ícone + Título - Fixo */}
      <div className="p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-3 ${!isExpanded && 'justify-center w-full'}`}>
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              {settings?.iconUrl ? (
                <img
                  src={settings.iconUrl}
                  alt={settings?.companyName || 'Sistema'}
                  className="max-h-10 max-w-10 object-contain"
                  onError={(e) => {
                    // Se falhar ao carregar, esconder a imagem e mostrar letra
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              {!settings?.iconUrl && (
                <span className="text-white font-bold text-xl">
                  {settings?.companyName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              )}
            </div>
            {isExpanded && (
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-white font-bold text-sm truncate">
                  {settings?.companyName || 'Astra CRM'}
                </span>
                <span className="text-white/60 text-xs truncate">
                  {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
        <ul className="space-y-2 pb-4">
          {menuItems.map((item, index) => (
            <MenuItem key={item.path || item.label} item={item} isExpanded={isExpanded} location={location} />
          ))}
        </ul>
      </div>

      {/* Footer - Logout - Fixo */}
      <div className="p-4 flex-shrink-0 border-t border-white/10">
        <button
          onClick={logout}
          className={`group relative flex items-center gap-3 ${
            isExpanded ? 'justify-start px-3 w-full' : 'justify-center w-12 mx-auto'
          } h-12 rounded-xl transition-all duration-200 text-white/70 hover:text-white hover:bg-red-500/20`}
          title={!isExpanded ? 'Sair' : undefined}
        >
          <svg
            className="w-6 h-6 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>

          {/* Título (visível quando expandido) */}
          {isExpanded && <span className="font-medium text-sm whitespace-nowrap">Sair</span>}

          {/* Tooltip (apenas quando recolhido) */}
          {!isExpanded && (
            <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 bg-white text-red-600 text-sm font-medium py-2 px-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-[9999] border border-red-200">
              Sair
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-8 border-transparent border-r-white"></div>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}
