import Icon from '@/components/ui/icon';

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

const statusRu: Record<string, string> = { active: 'Активен', vacation: 'В отпуске', fired: 'Уволен' };
const statusBg: Record<string, string> = {
  active: 'bg-status-ok/15 text-status-ok',
  vacation: 'bg-status-warn/15 text-status-warn',
  fired: 'bg-status-crit/15 text-status-crit',
};

const initialsOf = (first: string, last: string) => ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();

interface StaffListProps {
  filtered: EmployeeRow[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sel: number | null;
  onSelect: (id: number) => void;
}

const StaffList = ({ filtered, loading, search, onSearchChange, sel, onSelect }: StaffListProps) => {
  return (
    <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 min-w-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-secondary min-w-0">
          <Icon name="Search" size={15} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onSelect(s.id)}
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
  );
};

export default StaffList;
export type { EmployeeRow };
