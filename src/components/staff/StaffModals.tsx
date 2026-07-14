import { FormEvent } from 'react';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

interface RefData {
  id: number;
  slug?: string;
  name: string;
}

interface StaffForm {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  roleId: string;
  departmentId: string;
  companyId: string;
}

interface CredsModalState {
  login: string;
  password: string;
  name: string;
}

interface StaffModalsProps {
  showAdd: boolean;
  onCloseAdd: () => void;
  form: StaffForm;
  onFormChange: (form: StaffForm) => void;
  onAddSubmit: (e: FormEvent) => void;
  submitting: boolean;
  companies: RefData[];
  departments: RefData[];
  roles: RefData[];
  credsModal: CredsModalState | null;
  onCloseCreds: () => void;
}

const StaffModals = ({
  showAdd, onCloseAdd, form, onFormChange, onAddSubmit, submitting,
  companies, departments, roles, credsModal, onCloseCreds,
}: StaffModalsProps) => {
  return (
    <>
      {/* ── Добавить сотрудника modal ── */}
      <Modal
        open={showAdd}
        onClose={onCloseAdd}
        title="Добавить сотрудника"
        subtitle="Новый член команды"
        icon="UserCog"
        size="md"
      >
        <form onSubmit={onAddSubmit} className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Фамилия *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input
                  value={form.lastName}
                  onChange={(e) => onFormChange({ ...form, lastName: e.target.value })}
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
                  onChange={(e) => onFormChange({ ...form, firstName: e.target.value })}
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
                onChange={(e) => onFormChange({ ...form, middleName: e.target.value })}
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
                  onChange={(e) => onFormChange({ ...form, email: e.target.value })}
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
                  onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
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
                  onClick={() => onFormChange({ ...form, companyId: String(c.id) })}
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
                  onClick={() => onFormChange({ ...form, departmentId: String(d.id) })}
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
                  onClick={() => onFormChange({ ...form, roleId: String(r.id) })}
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
              onClick={onCloseAdd}
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
        onClose={onCloseCreds}
        title="Учётные данные созданы"
        subtitle={credsModal?.name}
        icon="KeyRound"
        size="sm"
        footer={
          <button
            onClick={onCloseCreds}
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
    </>
  );
};

export default StaffModals;
export type { StaffForm, CredsModalState };
