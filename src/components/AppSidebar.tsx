// src/components/AppSidebar.tsx
import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Shield,
  Users,
  X,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/authcontext";
import { useTheme } from "@/contexts/ThemeContext";

const adminNavItems = [
  { title: "Painel", icon: LayoutDashboard, path: "/" },
  { title: "Usuários", icon: Shield, path: "/usuarios" },
  { title: "Entidades", icon: FileText, path: "/entidades" },
  { title: "Crises Ativas", icon: AlertTriangle, path: "/crises" },
  { title: "Reportar", icon: Plus, path: "/reportar" },
  { title: "Mapa de Risco", icon: MapPin, path: "/mapa" },
  { title: "Voluntários", icon: Users, path: "/voluntarios" },
  { title: "Relatórios", icon: FileText, path: "/relatorios" },
  { title: "Alertas", icon: Bell, path: "/alertas" },
  { title: "Logs Auditoria", icon: Activity, path: "/logs-auditoria" },
];

const entidadeNavItems = [
  { title: "Painel", icon: LayoutDashboard, path: "/" },
  { title: "Crises Ativas", icon: AlertTriangle, path: "/crises" },
  { title: "Reportar", icon: Plus, path: "/reportar" },
  { title: "Mapa de Risco", icon: MapPin, path: "/mapa" },
  { title: "Voluntários", icon: Users, path: "/voluntarios" },
  { title: "Relatórios", icon: FileText, path: "/relatorios" },
  { title: "Alertas", icon: Bell, path: "/alertas" },
];

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user, isAdmin, isEntidade } = useAuth();
  const { theme, sidebarTheme, toggleTheme } = useTheme();

  const navItems = isAdmin ? adminNavItems : entidadeNavItems;

  // Classes baseadas no tema da sidebar (oposto ao tema principal)
  const isSidebarDark = sidebarTheme === 'dark';
  
  const sidebarBgClass = isSidebarDark 
    ? 'bg-gray-900 text-gray-300' 
    : 'bg-white text-gray-700 border-r border-gray-200';
  
  const sidebarBorderClass = isSidebarDark ? 'border-gray-800' : 'border-gray-200';
  const sidebarLogoBgClass = isSidebarDark 
    ? 'bg-gradient-to-br from-red-500 to-red-600' 
    : 'bg-gradient-to-br from-red-500 to-red-600';
  const sidebarTitleClass = isSidebarDark ? 'text-white' : 'text-gray-800';
  const sidebarSubtitleClass = isSidebarDark ? 'text-gray-500' : 'text-gray-400';
  
  const navLinkActiveClass = isSidebarDark
    ? 'bg-red-600 text-white'
    : 'bg-red-500 text-white';
  
  const navLinkInactiveClass = isSidebarDark
    ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900';
  
  const toggleButtonClass = isSidebarDark
    ? 'text-gray-500 hover:text-gray-300'
    : 'text-gray-400 hover:text-gray-600';
  
  const userEmailClass = isSidebarDark ? 'text-gray-500' : 'text-gray-400';
  const userRoleClass = isSidebarDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <>
      {/* Mobile menu button */}
      <button
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg ${
          isSidebarDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 shadow-md'
        } lg:hidden focus:outline-none focus:ring-2 focus:ring-primary`}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-[60px]" : "w-60"} ${sidebarBgClass} ${sidebarBorderClass}`}
        role="navigation"
        aria-label="Menu principal"
        aria-expanded={!collapsed}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 py-5 border-b ${sidebarBorderClass} ${collapsed ? "px-3 justify-center" : "px-4"}`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${sidebarLogoBgClass} flex items-center justify-center`}>
            <Shield className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          {!collapsed && (
            <div>
              <h1 className={`text-sm font-bold ${sidebarTitleClass}`}>SIGEM</h1>
              <p className={`text-[10px] ${sidebarSubtitleClass}`}>Gestão de Emergências</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" aria-label="Itens do menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  isActive
                    ? navLinkActiveClass
                    : navLinkInactiveClass
                } ${collapsed ? "justify-center" : ""}`
              }
              aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`border-t ${sidebarBorderClass} p-2 space-y-1`}>
          {!collapsed && user && (
            <div className="px-2.5 py-1" aria-label="Informações do usuário">
              <p className={`text-[10px] ${userEmailClass} truncate`}>{user.email}</p>
              <p className={`text-[9px] ${userRoleClass} mt-0.5`}>
                {isAdmin ? 'Administrador' : isEntidade ? 'Entidade Promotora' : 'Usuário'}
              </p>
            </div>
          )}
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary ${navLinkInactiveClass} ${collapsed ? "justify-center" : ""}`}
            aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            ) : (
              <Sun className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}
            {!collapsed && <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={signOut}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors w-full focus:outline-none focus:ring-2 focus:ring-primary ${navLinkInactiveClass} ${collapsed ? "justify-center" : ""}`}
            aria-label="Sair do sistema"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sair</span>}
          </button>
          
          {/* Collapse Button */}
          <button
            className={`hidden lg:flex items-center justify-center w-full py-1.5 ${toggleButtonClass} transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-lg`}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        </div>
      </aside>
    </>
  );
}