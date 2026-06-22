import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Icon from '@/components/ui/icon';

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

  return (
    <div className="flex min-h-screen bg-[hsl(40_15%_94%)]">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-10 py-7">
          <div>
            <h1 className="font-display font-black text-3xl text-[hsl(30_8%_12%)]">ВЫБЕРИТЕ КОМПАНИЮ</h1>
            <p className="text-sm text-[hsl(30_6%_45%)] mt-1">Выберите компанию для работы в системе</p>
          </div>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white border border-[hsl(40_15%_85%)] text-sm font-medium text-[hsl(30_8%_20%)] hover:border-gold/40 transition-colors">
              <Icon name="LayoutGrid" size={18} />
              Показать обе компании
            </button>
            <div className="h-8 w-px bg-[hsl(40_15%_82%)]" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full gold-gradient flex items-center justify-center text-background font-bold">А</div>
              <div>
                <div className="text-sm font-semibold text-[hsl(30_8%_15%)]">Александр</div>
                <div className="text-xs text-[hsl(30_6%_45%)]">Собственник</div>
              </div>
              <Icon name="ChevronDown" size={16} className="text-[hsl(30_6%_45%)]" />
            </div>
          </div>
        </header>

        <div className="flex-1 px-10 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {companies.map((c, idx) => (
              <div
                key={c.id}
                className="relative rounded-3xl overflow-hidden bg-[hsl(30_9%_9%)] border border-[hsl(40_20%_30%/0.2)] card-hover animate-fade-in opacity-0 group"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="absolute inset-0">
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[hsl(30_9%_9%)] via-[hsl(30_9%_9%/0.92)] to-transparent" />
                </div>

                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl border-2 border-gold/50 flex items-center justify-center font-display font-black text-2xl text-gold shrink-0">
                      {c.logo}
                    </div>
                    <div>
                      <div className="font-display font-black text-2xl text-foreground tracking-tight">{c.name}</div>
                      <div className="text-[11px] tracking-widest text-gold/80 font-medium mt-0.5">{c.tagline}</div>
                    </div>
                  </div>

                  <div className="inline-block px-4 py-2 rounded-lg bg-gold/10 border border-gold/20 text-xs font-semibold tracking-wide text-gold mb-5">
                    {c.segment}
                  </div>

                  <p className="text-[15px] text-foreground/85 mb-6 max-w-sm leading-relaxed">{c.desc}</p>

                  <div className="h-px bg-gradient-to-r from-gold/30 to-transparent mb-5" />

                  <div className="space-y-3.5 mb-7">
                    {c.stats.map((s) => (
                      <div key={s.label} className="flex items-center justify-between max-w-md">
                        <span className="flex items-center gap-3 text-sm text-foreground/80">
                          <Icon name={s.icon} size={17} className="text-gold/70" />
                          {s.label}
                        </span>
                        <span className={`font-display font-bold ${s.crit ? 'text-status-crit' : 'text-foreground'}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full max-w-md flex items-center justify-center gap-3 py-4 rounded-2xl gold-gradient text-background font-display font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-gold/20 group/btn"
                  >
                    Перейти в {c.name.charAt(0) + c.name.slice(1).toLowerCase()}
                    <Icon name="ArrowRight" size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-3xl bg-[hsl(30_9%_9%)] border border-[hsl(40_20%_30%/0.2)] p-7 animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
            <h3 className="font-display font-bold text-base tracking-wide text-gold mb-5">ОБЩАЯ ИНФОРМАЦИЯ ПО КОМПАНИЯМ</h3>
            <div className="flex flex-wrap items-end gap-8 justify-between">
              {summary.map((s) => (
                <div key={s.label} className="flex items-start gap-3">
                  <Icon name={s.icon} size={18} className="text-gold/70 mt-1" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                    <div className={`font-display font-extrabold text-2xl ${s.crit ? 'text-status-crit' : 'text-foreground'}`}>{s.value}</div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-secondary border border-gold/20 hover:border-gold/40 transition-colors"
              >
                <Icon name="BarChart3" size={18} className="text-gold" />
                <span className="text-sm font-medium text-foreground text-left leading-tight">Открыть общий<br />дашборд</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="px-10 py-5 flex items-center justify-between text-xs text-[hsl(30_6%_50%)] border-t border-[hsl(40_15%_85%)]">
          <span><b className="text-[hsl(30_8%_25%)]">Territory ERP</b> &nbsp;·&nbsp; Система управления мебельным производством</span>
          <span>info@неостандарт.рф &nbsp;·&nbsp; © 2026 Все права защищены</span>
        </footer>
      </main>
    </div>
  );
};

export default CompanySelect;