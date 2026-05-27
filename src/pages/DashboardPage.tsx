import type { AdminPage } from "../App";

interface DashboardPageProps {
  onNavigate: (page: AdminPage) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>

          <p className="page-subtitle">Resumen general del sistema</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <p className="stat-card__label">Estado</p>

          <p className="stat-card__value">Online</p>

          <p className="stat-card__sub">Panel funcionando correctamente</p>
        </div>

        <div className="stat-card">
          <p className="stat-card__label">Sistema</p>

          <p className="stat-card__value">Admin</p>

          <p className="stat-card__sub">Gestión del menú y delivery</p>
        </div>

        <div className="stat-card">
          <p className="stat-card__label">Supabase</p>

          <p className="stat-card__value">Activo</p>

          <p className="stat-card__sub">Base de datos conectada</p>
        </div>
      </div>

      <p className="section-label">
        ACCESOS RÁPIDOS
      </p>

      <div className="quick-actions">
        <button className="quick-action" onClick={() => onNavigate("products")}>
          <span className="quick-action__icon">🍔</span>

          <div>
            <p className="quick-action__title">
              Gestionar productos
            </p>

            <p className="quick-action__subtitle">
              Agregar, editar o dar de baja productos
            </p>
          </div>
        </button>

        <button
          className="quick-action"
          onClick={() => onNavigate("categories")}
        >
          <span className="quick-action__icon">☰</span>

          <div>
            <p className="quick-action__title">
              Gestionar categorías
            </p>

            <p className="quick-action__subtitle">
              Organizar las secciones del menú
            </p>
          </div>
        </button>

        <button className="quick-action" onClick={() => onNavigate("zones")}>
          <span className="quick-action__icon">📍</span>

          <div>
            <p className="quick-action__title">
              Zonas de delivery
            </p>

            <p className="quick-action__subtitle">
              Administrar costos y cobertura
            </p>
          </div>
        </button>

        <button className="quick-action" onClick={() => onNavigate("settings")}>
          <span className="quick-action__icon">⚙</span>

          <div>
            <p className="quick-action__title">
              Configuración del local
            </p>

            <p className="quick-action__subtitle">
              Horarios, delivery y datos del negocio
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
