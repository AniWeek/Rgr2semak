import { Navigate } from "react-router";
import { getUser } from "../api/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  if (user.status === 'BLOCKED') {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
  if (user.status === 'PENDING') {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
            <h2 className="text-foreground text-xl mb-4">Подтверждение email</h2>
            <p className="text-muted-foreground mb-4">Ваш email адрес не подтвержден. Пожалуйста, проверьте вашу почту и введите код подтверждения.</p>
            <button onClick={() => window.location.href = '/login'} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">Перейти к подтверждению</button>
          </div>
        </div>
    );
  }
  return <>{children}</>;
}