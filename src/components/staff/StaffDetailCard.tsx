import Icon from '@/components/ui/icon';
import type { EmployeeRow } from '@/components/staff/StaffList';

const statusRu: Record<string, string> = { active: 'Активен', vacation: 'В отпуске', fired: 'Уволен' };
const statusBg: Record<string, string> = {
  active: 'bg-status-ok/15 text-status-ok',
  vacation: 'bg-status-warn/15 text-status-warn',
  fired: 'bg-status-crit/15 text-status-crit',
};

const initialsOf = (first: string, last: string) => ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();

interface StaffDetailCardProps {
  selS: EmployeeRow;
  canManage: boolean;
  isSelf: boolean;
  onResetPassword: () => void;
  onToggleStatus: (target: EmployeeRow, newStatus: string) => void;
}

const StaffDetailCard = ({ selS, canManage, isSelf, onResetPassword, onToggleStatus }: StaffDetailCardProps) => {
  return (
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

      {canManage && !isSelf && (
        <div className="flex flex-col gap-2">
          <button
            onClick={onResetPassword}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors"
          >
            <Icon name="KeyRound" size={15} className="text-gold" /> Сбросить пароль
          </button>
          {selS.status !== 'fired' ? (
            <button
              onClick={() => onToggleStatus(selS, 'fired')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-crit/10 border border-status-crit/25 text-status-crit text-sm hover:bg-status-crit/15 transition-colors"
            >
              <Icon name="UserX" size={15} /> Уволить
            </button>
          ) : (
            <button
              onClick={() => onToggleStatus(selS, 'active')}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-ok/10 border border-status-ok/25 text-status-ok text-sm hover:bg-status-ok/15 transition-colors"
            >
              <Icon name="UserCheck" size={15} /> Восстановить
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffDetailCard;
