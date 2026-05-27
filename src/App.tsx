import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DeliveryZonesPage } from "./pages/DeliveryZonesPage";

export type AdminPage = "dashboard" | "products" | "categories" | "zones" | "settings";

export function App() {
  const [page, setPage] = useState<AdminPage>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardPage onNavigate={setPage} />;
      case "products":    return <ProductsPage />;
      case "categories":  return <CategoriesPage />;
      case "zones":       return <DeliveryZonesPage />;
      case "settings":    return <SettingsPage />;
    }
  };

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout currentPage={page} onNavigate={setPage}>
          {renderPage()}
        </Layout>
      </ProtectedRoute>
    </AuthProvider>
  );
}
