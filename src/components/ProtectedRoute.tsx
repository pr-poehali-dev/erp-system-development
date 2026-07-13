import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ForcePasswordChange from '@/components/ForcePasswordChange';
import Icon from '@/components/ui/icon';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { employee, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Icon name="Loader2" size={32} className="text-gold animate-spin" />
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <Navigate to="/login" replace />;
  }

  if (employee.mustChangePassword) {
    return <ForcePasswordChange />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
