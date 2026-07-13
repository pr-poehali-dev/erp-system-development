import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, getToken, setToken, ApiError } from '@/lib/api';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phone?: string | null;
  login: string;
  mustChangePassword: boolean;
  roleId: number;
  roleSlug: string;
  roleName: string;
  permissions: string[];
  departmentId?: number | null;
  departmentName?: string | null;
  companyId?: number | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  status: string;
}

interface AuthContextValue {
  employee: Employee | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<{ employee: Employee }>('auth', { params: { action: 'me' } });
      setEmployee(data.employee);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setToken(null);
      }
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (loginValue: string, password: string) => {
    const data = await api<{ token: string; employee: Employee }>('auth', {
      method: 'POST',
      params: { action: 'login' },
      body: { login: loginValue, password },
    });
    setToken(data.token);
    setEmployee(data.employee);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('auth', { method: 'POST', params: { action: 'logout' } });
    } catch {
      // ignore
    }
    setToken(null);
    setEmployee(null);
  }, []);

  const changePassword = useCallback(async (newPassword: string, currentPassword?: string) => {
    await api('auth', {
      method: 'POST',
      params: { action: 'change-password' },
      body: { newPassword, currentPassword },
    });
    await refresh();
  }, [refresh]);

  const hasPermission = useCallback((perm: string) => {
    if (!employee) return false;
    if (employee.permissions?.includes('*')) return true;
    return employee.permissions?.includes(perm) ?? false;
  }, [employee]);

  return (
    <AuthContext.Provider value={{ employee, loading, login, logout, changePassword, refresh, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
