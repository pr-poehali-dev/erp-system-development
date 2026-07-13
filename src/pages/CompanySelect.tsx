import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Icon from '@/components/ui/icon';
import { ThemeToggleButton } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

const KITCHEN_IMG = 'https://cdn.poehali.dev/projects/eef01eb5-7830-4400-a486-64829cb2d730/files/fc53bd98-1f9f-4fc1-b636-7d092eded23a.jpg';
const LUX_IMG = 'https://cdn.poehali.dev/projects/eef01eb5-7830-4400-a486-64829cb2d730/files/d750c304-d8b7-4eb1-8c4b-82a7018f645f.jpg';

const companies = [
  {
    id: 'kontur',
    name: 'КОНТУР+',
    tagline: 'МЕБЕЛЬ НА ПРАКТИКЕ',
    segment: 'СЕГМЕНТ: НИЖЕ СРЕДНЕГО',
    desc: 'Практичные мебельные решения по доступным ценам.',
    logo: 'K+',
    img: KITCHEN_IMG,
    stats: [
      { icon: 'CalendarDays', label: 'Активные заказы', value: '28' },
      { icon: 'UserPlus', label: 'Новые лиды', value: '14' },
      { icon: 'CircleDollarSign', label: 'Сумма заказов в работе', value: '2 135 400 ₽' },
      { icon: 'Clock', label: 'Просроченные задачи', value: '7', crit: true },
      { icon: 'Ruler', label: 'Замеры на сегодня', value: '3' },
    ],
  },
  {
    id: 'territory',
    name: 'ТЕРРИТОРИЯ МЕБЕЛИ',
    tagline: 'ИНДИВИДУАЛЬНЫЕ РЕШЕНИЯ ПРЕМИУМ-КЛАССА',
    segment: 'СЕГМЕНТ: ВЫШЕ СРЕДНЕГО / ПРЕМИУМ',
    desc: 'Индивидуальный подход, премиальные материалы и безупречный сервис.',
    logo: 'ТМ',
    img: LUX_IMG,
    stats: [
      { icon: 'CalendarDays', label: 'Активные заказы', value: '46' },
      { icon: 'UserPlus', label: 'Новые лиды', value: '21' },
      { icon: 'CircleDollarSign', label: 'Сумма заказов в работе', value: '7 842 300 ₽' },
      { icon: 'Clock', label: 'Просроченные задачи', value: '5', crit: true },
      { icon: 'Ruler', label: 'Замеры на сегодня', value: '5' },
    ],
  },
];

const summary = [
  { icon: 'ClipboardList', label: 'Всего активных заказов', value: '74' },
  { icon: 'UserPlus', label: 'Новых лидов', value: '35' },
  { icon: 'CircleDollarSign', label: 'Сумма заказов в работе', value: '9 977 700 ₽' },
  { icon: 'Clock', label: 'Просроченные задачи', value: '12', crit: true },
  { icon: 'Ruler', label: 'Замеры на сегодня', value: '8' },
];

const CompanySelect = () => {
  const navigate = useNavigate();
  const { employee } = useAuth();
  const initials = employee ? (employee.firstName[0] + (employee.lastName[0] || '')).toUpperCase() : '?';
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : 'Гость';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 sm:px-10 py-6 sm:py-7">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground tracking-tight">Выберите компанию</h1>
            <p className="text-sm text-muted-foreground mt-1">Выберите компанию для работы в системе</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button className="hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass-card text-sm font-medium text-foreground hover:border-gold/40 transition-colors">
              <Icon name="LayoutGrid" size={17} />
              Показать обе компании
            </button>
            <ThemeToggleButton />
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full gold-gradient flex items-center justify-center text-[hsl(222_30%_8%)] font-bold shrink-0">{initials}</div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-foreground truncate max-w-[140px]">{fullName}</div>
                <div className="text-xs text-muted-foreground">{employee?.roleName || 'Собственник'}</div>
              </div>
              <Icon name="ChevronDown" size={16} className="text-muted-foreground hidden sm:block" />
            </div>
          </div>
        </header>

        <div className="flex-1 px-5 sm:px-10 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">
            {companies.map((c, idx) => (
              <div
                key={c.id}
                className="relative rounded-3xl overflow-hidden glass-card card-hover animate-fade-in opacity-0 group"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="absolute inset-0">
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/60" />
                </div>

                <div className="relative p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-gold/50 flex items-center justify-center font-display font-black text-xl sm:text-2xl text-gold shrink-0 bg-background/40">
                      {c.logo}
                    </div>
                    <div className="min-w-0">
                      <div className="font-display font-black text-xl sm:text-2xl text-foreground tracking-tight truncate">{c.name}</div>
                      <div className="text-[10px] sm:text-[11px] tracking-widest text-gold/90 font-semibold mt-0.5 truncate">{c.tagline}</div>
                    </div>
                  </div>

                  <div className="inline-block px-4 py-2 rounded-lg bg-gold/12 border border-gold/25 text-xs font-semibold tracking-wide text-gold mb-5">
                    {c.segment}
                  </div>

                  <p className="text-[14px] sm:text-[15px] text-foreground/80 mb-6 max-w-sm leading-relaxed">{c.desc}</p>

                  <div className="h-px bg-gradient-to-r from-gold/40 to-transparent mb-5" />

                  <div className="space-y-3.5 mb-7">
                    {c.stats.map((s) => (
                      <div key={s.label} className="flex items-center justify-between max-w-md gap-3">
                        <span className="flex items-center gap-3 text-sm text-foreground/75 min-w-0">
                          <Icon name={s.icon} size={17} className="text-gold shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </span>
                        <span className={`font-display font-bold shrink-0 ${s.crit ? 'text-status-crit' : 'text-foreground'}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full max-w-md flex items-center justify-center gap-3 py-3.5 sm:py-4 rounded-2xl gold-gradient btn-gold text-[hsl(222_30%_8%)] font-display font-bold text-sm sm:text-base shadow-lg shadow-gold/25 group/btn"
                  >
                    Перейти в {c.name.charAt(0) + c.name.slice(1).toLowerCase()}
                    <Icon name="ArrowRight" size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 sm:mt-7 rounded-3xl glass-card p-6 sm:p-7 animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
            <h3 className="font-display font-bold text-sm sm:text-base tracking-wide text-gold mb-5">Общая информация по компаниям</h3>
            <div className="flex flex-wrap items-end gap-6 sm:gap-8 justify-between">
              {summary.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <Icon name={s.icon} size={18} className="text-gold mt-1 shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className={`font-display font-extrabold text-xl sm:text-2xl ${s.crit ? 'text-status-crit' : 'text-foreground'}`}>{s.value}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-secondary border border-gold/25 hover:border-gold/50 transition-colors"
              >
                <Icon name="BarChart3" size={18} className="text-gold" />
                <span className="text-sm font-medium text-foreground text-left leading-tight">Открыть общий<br />дашборд</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="px-5 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground border-t border-border">
          <span><b className="text-foreground/70">Territory ERP</b> &nbsp;·&nbsp; Система управления мебельным производством</span>
          <span>info@неостандарт.рф &nbsp;·&nbsp; © 2026 Все права защищены</span>
        </footer>
      </main>
    </div>
  );
};

export default CompanySelect;
