import { useAuth } from "../context/useAuth";
import { LoginPage } from "../pages/LoginPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
