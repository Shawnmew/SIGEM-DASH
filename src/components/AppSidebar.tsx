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
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
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
  const { signOut, user } = useAuth();

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "w-[60px]" : "w-60"}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-2.5 py-5 border-b border-sidebar-border ${collapsed ? "px-3 justify-center" : "px-4"}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg crisis-gradient flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight leading-none">SIGEC</h1>
              <p className="text-[10px] text-sidebar-muted leading-none mt-0.5">Gestão de Crises</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {!collapsed && user && (
            <p className="text-[10px] text-sidebar-muted px-2.5 py-1 truncate">
              {user.email}
            </p>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
          <button
            className="hidden lg:flex items-center justify-center w-full py-1.5 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
