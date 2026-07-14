import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import StaffStats from '@/components/staff/StaffStats';
import StaffList, { EmployeeRow } from '@/components/staff/StaffList';
import StaffDetailCard from '@/components/staff/StaffDetailCard';
import StaffModals, { StaffForm, CredsModalState } from '@/components/staff/StaffModals';

interface RefData {
  id: number;
  slug?: string;
  name: string;
}

const emptyForm: StaffForm = { firstName: '', lastName: '', middleName: '', email: '', phone: '', roleId: '', departmentId: '', companyId: '' };

const Staff = () => {
  const { success, error: toastError } = useToast();
  const { hasPermission, employee: me } = useAuth();
  const canManage = hasPermission('staff.edit') || hasPermission('*');

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [departments, setDepartments] = useState<RefData[]>([]);
  const [roles, setRoles] = useState<RefData[]>([]);
  const [companies, setCompanies] = useState<RefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sel, setSel] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [credsModal, setCredsModal] = useState<CredsModalState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ employees: EmployeeRow[]; departments: RefData[]; roles: RefData[]; companies: RefData[] }>('employees');
      setEmployees(data.employees);
      setDepartments(data.departments);
      setRoles(data.roles);
      setCompanies(data.companies);
      if (!sel && data.employees.length > 0) setSel(data.employees[0].id);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить сотрудников');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return e.fullName.toLowerCase().includes(q) || e.roleName.toLowerCase().includes(q) || (e.departmentName || '').toLowerCase().includes(q);
  });

  const selS = employees.find((e) => e.id === sel);

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    vacation: employees.filter((e) => e.status === 'vacation').length,
    fired: employees.filter((e) => e.status === 'fired').length,
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.roleId) {
      toastError('Заполните обязательные поля', 'Имя, фамилия, email и роль');
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<{ employee: EmployeeRow; tempPassword: string; login: string }>('employees', {
        method: 'POST',
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          roleId: Number(form.roleId),
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
          companyId: form.companyId ? Number(form.companyId) : undefined,
        },
      });
      setShowAdd(false);
      setForm(emptyForm);
      success('Сотрудник добавлен', `${data.employee.fullName} — логин ${data.login}`);
      setCredsModal({ login: data.login, password: data.tempPassword, name: data.employee.fullName });
      await load();
      setSel(data.employee.id);
    } catch (err) {
      toastError('Не удалось добавить сотрудника', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selS) return;
    try {
      const data = await api<{ tempPassword: string }>('employees', {
        method: 'POST',
        params: { action: 'reset-password' },
        body: { id: selS.id },
      });
      setCredsModal({ login: selS.login, password: data.tempPassword, name: selS.fullName });
      success('Пароль сброшен', 'Сотрудник должен сменить его при следующем входе');
      await load();
    } catch (err) {
      toastError('Не удалось сбросить пароль', err instanceof ApiError ? err.message : undefined);
    }
  };

  const handleToggleStatus = async (target: EmployeeRow, newStatus: string) => {
    try {
      await api('employees', { method: 'PUT', body: { id: target.id, status: newStatus } });
      success(newStatus === 'fired' ? 'Сотрудник уволен' : 'Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Сотрудники" titleIcon="UserCog" actions={
      canManage && (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Добавить сотрудника</span><span className="sm:hidden">Добавить</span>
        </button>
      )
    }>
      <StaffStats stats={stats} loadError={loadError} onRetry={load} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <StaffList
          filtered={filtered}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          sel={sel}
          onSelect={setSel}
        />

        {selS && (
          <StaffDetailCard
            selS={selS}
            canManage={canManage}
            isSelf={selS.id === me?.id}
            onResetPassword={handleResetPassword}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      <StaffModals
        showAdd={showAdd}
        onCloseAdd={() => { setShowAdd(false); setForm(emptyForm); }}
        form={form}
        onFormChange={setForm}
        onAddSubmit={handleAddSubmit}
        submitting={submitting}
        companies={companies}
        departments={departments}
        roles={roles}
        credsModal={credsModal}
        onCloseCreds={() => setCredsModal(null)}
      />
    </Layout>
  );
};

export default Staff;
