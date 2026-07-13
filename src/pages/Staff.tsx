import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';

interface EmployeeRow {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
  login: string;
  mustChangePassword: boolean;
  roleId: number;
  roleSlug: string;
  roleName: string;
  departmentId?: number | null;
  departmentName?: string | null;
  companyId?: number | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  status: string;
  hiredAt?: string | null;
  firedAt?: string | null;
  lastLoginAt?: string | null;
}

interface RefData {
  id: number;
  slug?: string;
  name: string;
}

const statusRu: Record<string, string> = { active: 'Активен', vacation: 'В отпуске', fired: 'Уволен' };
const statusBg: Record<string, string> = {
  active: 'bg-status-ok/15 text-status-ok',
  vacation: 'bg-status-warn/15 text-status-warn',
  fired: 'bg-status-crit/15 text-status-crit',
};

const initialsOf = (first: string, last: string) => ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();

const emptyForm = { firstName: '', lastName: '', middleName: '', email: '', phone: '', roleId: '', departmentId: '', companyId: '' };

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
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [credsModal, setCredsModal] = useState<{ login: string; password: string; name: string } | null>(null);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { l: 'Всего сотрудников', v: stats.total },
          { l: 'Активных', v: stats.active },
          { l: 'В отпуске', v: stats.vacation },
          { l: 'Уволено', v: stats.fired },
        ].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-gold">{k.v}</div>
            <div className="text-[11px] sm:text-[12px] text-muted-foreground mt-1 truncate">{k.l}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-[hsl(4,80%,60%)]/10 border border-[hsl(4,80%,60%)]/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-[hsl(4,80%,80%)]">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-secondary min-w-0">
              <Icon name="Search" size={15} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск сотрудника..."
                className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground min-w-0"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Icon name="Loader2" size={28} className="text-gold animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Сотрудники не найдены</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSel(s.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${sel === s.id ? 'bg-gold/8 border border-gold/30' : 'bg-secondary hover:bg-muted/80 border border-transparent'}`}
                >
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm shrink-0">
                    {initialsOf(s.firstName, s.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground truncate">{s.fullName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.roleName}{s.departmentName ? ` · ${s.departmentName}` : ''}</div>
                  </div>
                  {s.mustChangePassword && (
                    <Icon name="KeyRound" size={14} className="text-status-warn shrink-0" />
                  )}
                  <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 hidden sm:inline-block ${statusBg[s.status] || statusBg.active}`}>
                    {statusRu[s.status] || s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selS && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start xl:sticky xl:top-[85px] min-w-0">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-background font-display font-black text-2xl mb-3">
                {initialsOf(selS.firstName, selS.lastName)}
              </div>
              <h2 className="font-display font-bold text-base text-foreground break-words">{selS.fullName}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{selS.roleName}</p>
              <span className={`text-[11px] px-2 py-1 rounded-md mt-2 ${statusBg[selS.status] || statusBg.active}`}>
                {statusRu[selS.status] || selS.status}
              </span>
              {selS.mustChangePassword && (
                <span className="text-[11px] px-2 py-1 rounded-md mt-1.5 bg-status-warn/15 text-status-warn flex items-center gap-1.5">
                  <Icon name="KeyRound" size={12} /> Ожидает смены пароля
                </span>
              )}
            </div>

            <div className="space-y-3 text-[13px] mb-5">
              {[
                ['Отдел', selS.departmentName || '—', 'Building2'],
                ['Компания', selS.companyName || '—', 'Briefcase'],
                ['Телефон', selS.phone || '—', 'Phone'],
                ['Email', selS.email, 'Mail'],
                ['Логин', selS.login, 'User'],
              ].map(([l, v, ic]) => (
                <div key={l} className="flex items-center gap-3 min-w-0">
                  <Icon name={ic as string} size={15} className="text-gold shrink-0" />
                  <div className="flex-1 flex justify-between gap-2 min-w-0">
                    <span className="text-muted-foreground shrink-0">{l}</span>
                    <span className="text-foreground font-medium truncate text-right">{v}</span>
                  </div>
                </div>
              ))}
            </div>

            {canManage && selS.id !== me?.id && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResetPassword}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors"
                >
                  <Icon name="KeyRound" size={15} className="text-gold" /> Сбросить пароль
                </button>
                {selS.status !== 'fired' ? (
                  <button
                    onClick={() => handleToggleStatus(selS, 'fired')}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-crit/10 border border-status-crit/25 text-status-crit text-sm hover:bg-status-crit/15 transition-colors"
                  >
                    <Icon name="UserX" size={15} /> Уволить
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleStatus(selS, 'active')}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-ok/10 border border-status-ok/25 text-status-ok text-sm hover:bg-status-ok/15 transition-colors"
                  >
                    <Icon name="UserCheck" size={15} /> Восстановить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Добавить сотрудника modal ── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(emptyForm); }}
        title="Добавить сотрудника"
        subtitle="Новый член команды"
        icon="UserCog"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Фамилия *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Иванова"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Имя *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Анна"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Отчество</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="User" size={15} className="text-gold shrink-0" />
              <input
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="Сергеевна"
                className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Email *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Mail" size={15} className="text-gold shrink-0" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ivanova@company.ru"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Телефон</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Phone" size={15} className="text-gold shrink-0" />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+7 (978) 000-00-00"
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Компания</label>
            <div className="flex flex-wrap gap-2">
              {companies.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setForm({ ...form, companyId: String(c.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.companyId === String(c.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Отдел</label>
            <div className="flex flex-wrap gap-2">
              {departments.map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setForm({ ...form, departmentId: String(d.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.departmentId === String(d.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Роль в системе *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setForm({ ...form, roleId: String(r.id) })}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11px] text-center transition-all ${form.roleId === String(r.id) ? 'border-gold/40 bg-gold/8 text-gold' : 'border-border bg-secondary text-muted-foreground hover:border-gold/25'}`}
                >
                  <Icon name="Shield" size={16} />
                  <span className="leading-tight">{r.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-3.5 py-3 rounded-xl bg-gold/8 border border-gold/20 flex items-start gap-2.5">
            <Icon name="Info" size={15} className="text-gold shrink-0 mt-0.5" />
            <span className="text-[12px] text-muted-foreground leading-relaxed">
              Логин и временный пароль будут сгенерированы автоматически. Сотрудник обязан сменить пароль при первом входе.
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
              Добавить сотрудника
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm(emptyForm); }}
              className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Учётные данные modal (показывается один раз) ── */}
      <Modal
        open={!!credsModal}
        onClose={() => setCredsModal(null)}
        title="Учётные данные созданы"
        subtitle={credsModal?.name}
        icon="KeyRound"
        size="sm"
        footer={
          <button
            onClick={() => setCredsModal(null)}
            className="w-full py-3 rounded-xl gold-gradient text-background font-semibold text-sm"
          >
            Понятно, я передал данные сотруднику
          </button>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="px-3.5 py-3 rounded-xl bg-status-warn/10 border border-status-warn/25 flex items-start gap-2.5">
            <Icon name="AlertTriangle" size={15} className="text-status-warn shrink-0 mt-0.5" />
            <span className="text-[12px] text-foreground/90 leading-relaxed">
              Пароль показывается только один раз. Передайте его сотруднику лично — при первом входе будет предложено задать новый пароль.
            </span>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Логин</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border">
              <Icon name="User" size={15} className="text-gold shrink-0" />
              <span className="text-sm text-foreground font-mono flex-1 truncate">{credsModal?.login}</span>
              <button
                type="button"
                onClick={() => credsModal && navigator.clipboard.writeText(credsModal.login)}
                className="shrink-0 text-muted-foreground hover:text-gold transition-colors"
              >
                <Icon name="Copy" size={15} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Временный пароль</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border">
              <Icon name="Lock" size={15} className="text-gold shrink-0" />
              <span className="text-sm text-foreground font-mono flex-1 truncate">{credsModal?.password}</span>
              <button
                type="button"
                onClick={() => credsModal && navigator.clipboard.writeText(credsModal.password)}
                className="shrink-0 text-muted-foreground hover:text-gold transition-colors"
              >
                <Icon name="Copy" size={15} />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Staff;