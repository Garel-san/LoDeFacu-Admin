import { type ReactNode, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import type { AdminPage } from "../App";

interface NavItem {
  id: AdminPage;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "products", label: "Productos", icon: "🍔" },
  { id: "categories", label: "Categorías", icon: "☰" },
  { id: "zones", label: "Zonas de delivery", icon: "📍" },
  { id: "settings", label: "Configuración", icon: "⚙" },
];

interface LayoutProps {
  children: ReactNode;
  currentPage: AdminPage;
  onNavigate: (page: AdminPage) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLabel =
    NAV_ITEMS.find((item) => item.id === currentPage)?.label ?? "Admin";

  const handleNavigate = (page: AdminPage) => {
    onNavigate(page);
    setSidebarOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <p className="sidebar__title">Admin</p>
          <p className="sidebar__email">{user?.email}</p>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${
                currentPage === item.id ? "nav-item--active" : ""
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <span className="nav-item__icon">{item.icon}</span>

              <span className="nav-item__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="sidebar__signout" onClick={signOut}>
          Cerrar sesión
        </button>
      </aside>

      {/* Main */}
      <div className="admin-content">
        {/* Mobile topbar */}
        <header className="mobile-topbar">
          <button
            className="mobile-topbar__menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <div className="mobile-topbar__content">
            <p className="mobile-topbar__title">{currentLabel}</p>

            <p className="mobile-topbar__email">{user?.email}</p>
          </div>
        </header>

        {/* Main content */}
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
