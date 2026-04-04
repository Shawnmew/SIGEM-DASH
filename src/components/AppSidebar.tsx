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
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/authcontext";

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

  const navItems = isAdmin ? adminNavItems : entidadeNavItems;

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-gray-900 text-gray-300 flex flex-col transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-[60px]" : "w-60"}`}
      >
        <div className={`flex items-center gap-2.5 py-5 border-b border-gray-800 ${collapsed ? "px-3 justify-center" : "px-4"}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-white">SIGEM</h1>
              <p className="text-[10px] text-gray-500">Gestão de Emergências</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-2 space-y-1">
          {!collapsed && user && (
            <div className="px-2.5 py-1">
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">
                {isAdmin ? 'Administrador' : isEntidade ? 'Entidade Promotora' : 'Usuário'}
              </p>
            </div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
          <button
            className="hidden lg:flex items-center justify-center w-full py-1.5 text-gray-500 hover:text-gray-300 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>
    </>
  );
}