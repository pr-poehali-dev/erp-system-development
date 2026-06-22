import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const tabs = ['Обзор', 'Продажи', 'Производство', 'Финансы', 'Склад', 'Монтажи', 'Клиенты', 'Менеджеры'];

const kpis = [
  { label: 'Выручка за период', value: '8 126 400 ₽', delta: '+12% к прошлому периоду', good: true, color: 'hsl(40 60% 55%)' },
  { label: 'Заказы в работе', value: '56', delta: '+8 новых заказов', good: true, color: 'hsl(150 50% 50%)' },
  { label: 'Производство: загрузка цехов', value: '72%', delta: '+5% к прошлому периоду', good: true, color: 'hsl(280 40% 55%)' },
  { label: 'Монтажи на неделе', value: '18', delta: '+3 к прошлой неделе', good: true, color: 'hsl(199 60% 50%)' },
  { label: 'Просроченные задачи', value: '3', delta: '-1 к прошлой неделе', good: true, color: 'hsl(4 70% 55%)' },
];

const revenuePoints = [12, 18, 15, 22, 28, 25, 33, 30, 38, 42, 39, 48, 52, 58, 55, 63, 68, 65, 72, 78, 82, 88, 85, 92];

const statuses = [
  { label: 'В производстве', value: 18, pct: '32%', c: 'hsl(150 50% 48%)' },
  { label: 'Готовы к монтажу', value: 12, pct: '21%', c: 'hsl(199 60% 50%)' },
  { label: 'Согласование', value: 8, pct: '14%', c: 'hsl(40 60% 55%)' },
  { label: 'Проектирование', value: 7, pct: '13%', c: 'hsl(280 40% 55%)' },
  { label: 'Прочие', value: 11, pct: '20%', c: 'hsl(30 8% 35%)' },
];

const managers = [
  { name: 'Иванова А.С.', value: '2 456 000 ₽', pct: 100 },
  { name: 'Петрова Е.В.', value: '1 890 000 ₽', pct: 77 },
  { name: 'Кузнецов Д.А.', value: '1 420 000 ₽', pct: 58 },
  { name: 'Соколова Н.А.', value: '1 015 000 ₽', pct: 41 },
  { name: 'Смирнов П.А.', value: '785 400 ₽', pct: 32 },
];

const workshops = [
  { name: 'Корпусной цех', pct: 82, c: 'status-ok' },
  { name: 'Малярный цех', pct: 71, c: 'status-warn' },
  { name: 'Сборочный цех', pct: 68, c: 'status-warn' },
  { name: 'Упаковочный цех', pct: 54, c: 'status-crit' },
];

const finResult = [
  { label: 'Выручка', value: '8.13 млн ₽', h: 100, c: 'hsl(150 50% 48%)' },
  { label: 'Себестоимость', value: '5.18 млн ₽', h: 64, c: 'hsl(40 60% 55%)' },
  { label: 'Расходы', value: '1.01 млн ₽', h: 13, c: 'hsl(4 70% 55%)' },
  { label: 'Прибыль', value: '2.94 млн ₽', h: 36, c: 'hsl(199 60% 50%)' },
];

const cashflow = [
  { label: 'Остаток на начало периода', value: '1 245 000 ₽', tone: 'foreground' },
  { label: 'Поступления', value: '9 240 000 ₽', tone: 'status-ok' },
  { label: 'Расходы', value: '5 183 600 ₽', tone: 'status-crit' },
  { label: 'Остаток на конец периода', value: '5 301 400 ₽', tone: 'status-ok' },
];

const lastOrders = [
  { n: '№1258', client: 'Мария Петрова', obj: 'Квартира, ЖК «Сити Парк»', sum: '1 245 000 ₽', status: 'В производстве', tone: 'ok', mgr: 'Иванова А.С.', date: '21.05.2024' },
  { n: '№1256', client: 'Алексей Смирнов', obj: 'Квартира, ЖК «Фили Сити»', sum: '980 000 ₽', status: 'Готов к монтажу', tone: 'info', mgr: 'Петрова Е.В.', date: '23.05.2024' },
  { n: '№1261', client: 'Ольга Кузнецова', obj: 'Дом, КП «Рублевский»', sum: '750 000 ₽', status: 'Согласование', tone: 'warn', mgr: 'Кузнецов Д.А.', date: '27.05.2024' },
  { n: '№1263', client: 'Игорь Волков', obj: 'Офис, БЦ «Москва-Сити»', sum: '1 130 000 ₽', status: 'Проектирование', tone: 'purple', mgr: 'Иванова А.С.', date: '30.05.2024' },
];

const popular = [
  { title: 'Отчет по продажам', sub: 'Анализ продаж по периодам и менеджерам', c: 'status-ok', i: 'TrendingUp' },
  { title: 'Отчет по производству', sub: 'Загрузка цехов и выполнение заказов', c: 'status-crit', i: 'Factory' },
  { title: 'Финансовый отчет', sub: 'Движение денежных средств и прибыль', c: 'status-ok', i: 'CircleDollarSign' },
  { title: 'Отчет по складу', sub: 'Остатки материалов и готовой продукции', c: 'info', i: 'Warehouse' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  purple: 'bg-[hsl(280_40%_55%)]/15 text-[hsl(280_45%_70%)]',
};
const txt: Record<string, string> = { foreground: 'text-foreground', 'status-ok': 'text-status-ok', 'status-crit': 'text-status-crit' };

const Sparkline = ({ color, points }: { color: string; points: number[] }) => {
  const max = Math.max(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${30 - (p / max) * 28}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

const Reports = () => {
  const [active, setActive] = useState('Обзор');
  const donutTotal = statuses.reduce((a, s) => a + s.value, 0);
  let acc = 0;

  return (
    <Layout
      title="Отчеты"
      titleIcon="BarChart3"
      actions={
        <>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="Download" size={16} /> <span className="hidden lg:inline">Экспорт</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Настроить отчеты</span>
          </button>
        </>
      }
    >
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${active === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {active === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={k.label} className="glass-card rounded-2xl p-5 card-hover animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-sm text-muted-foreground mb-2">{k.label}</div>
            <div className="font-display font-extrabold text-2xl text-foreground mb-1">{k.value}</div>
            <div className="text-xs text-status-ok mb-2">{k.delta}</div>
            <Sparkline color={k.color} points={revenuePoints.slice(0, 14).map((p) => p + Math.random() * 10)} />
          </div>
        ))}
      </div>

      {/* Row: Revenue chart, Donut, Managers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base">Выручка</h3>
            <div className="flex gap-1 text-xs">
              {['Неделя', 'Месяц', 'Год'].map((p) => (
                <button key={p} className={`px-3 py-1.5 rounded-lg ${p === 'Месяц' ? 'gold-gradient text-background font-semibold' : 'bg-secondary text-muted-foreground'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div className="h-44 relative">
            <svg viewBox="0 0 100 44" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(40 60% 55%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(40 60% 55%)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline points={`0,44 ${revenuePoints.map((p, i) => `${(i / (revenuePoints.length - 1)) * 100},${44 - (p / 92) * 40}`).join(' ')} 100,44`} fill="url(#revGrad)" />
              <polyline points={revenuePoints.map((p, i) => `${(i / (revenuePoints.length - 1)) * 100},${44 - (p / 92) * 40}`).join(' ')} fill="none" stroke="hsl(40 65% 58%)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
            {[['Выручка за период', '8 126 400 ₽'], ['Себестоимость', '5 183 600 ₽'], ['Прибыль', '2 942 800 ₽'], ['Рентабельность', '36%']].map(([l, v]) => (
              <div key={l}><div className="text-[11px] text-muted-foreground">{l}</div><div className="text-sm font-bold text-foreground">{v}</div></div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
          <h3 className="font-display font-bold text-base mb-4">Статусы заказов</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {statuses.map((s) => {
                  const dash = (s.value / donutTotal) * 100;
                  const el = <circle key={s.label} cx="18" cy="18" r="15.9" fill="none" stroke={s.c} strokeWidth="4" strokeDasharray={`${dash} 100`} strokeDashoffset={-acc} />;
                  acc += dash;
                  return el;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-extrabold text-2xl text-foreground">56</span>
                <span className="text-[10px] text-muted-foreground">заказов</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {statuses.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.c }} />{s.label}</span>
                  <span className="font-semibold text-foreground">{s.value} <span className="text-muted-foreground font-normal">({s.pct})</span></span>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Перейти к заказам <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '160ms' }}>
          <h3 className="font-display font-bold text-base mb-4">Топ менеджеров по выручке</h3>
          <div className="space-y-3">
            {managers.map((m) => (
              <div key={m.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">{m.name.split(' ')[0].slice(0, 2)}</div>
                <span className="text-[13px] w-24 truncate text-foreground">{m.name}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `${m.pct}%` }} /></div>
                <span className="text-[12px] font-semibold text-foreground w-24 text-right">{m.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все менеджеры <Icon name="ArrowRight" size={13} /></button>
        </div>
      </div>

      {/* Row: Workshops, Fin result, Cashflow */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base">Загрузка цехов</h3>
            <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-lg bg-secondary">Месяц</span>
          </div>
          <div className="space-y-4">
            {workshops.map((w) => (
              <div key={w.name}>
                <div className="flex justify-between text-sm mb-1.5"><span className="text-foreground">{w.name}</span><span className="font-semibold">{w.pct}%</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full bg-${w.c}`} style={{ width: `${w.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <button className="mt-5 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Перейти к производству <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
          <h3 className="font-display font-bold text-base mb-4">Финансовый результат</h3>
          <div className="flex items-end justify-around h-40 gap-4">
            {finResult.map((f) => (
              <div key={f.label} className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-semibold text-foreground mb-1">{f.value}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height: `${f.h}%`, background: f.c, minHeight: '8px' }} />
                <span className="text-[10px] text-muted-foreground mt-2 text-center">{f.label}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Подробный отчет <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '160ms' }}>
          <h3 className="font-display font-bold text-base mb-4">Движение денежных средств</h3>
          <div className="space-y-1">
            {cashflow.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <span className={`font-semibold ${txt[c.tone]}`}>{c.value}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Перейти к финансам <Icon name="ArrowRight" size={13} /></button>
        </div>
      </div>

      {/* Row: Last orders, Popular reports */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-base mb-4">Последние заказы</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">№ заказа</th><th className="font-medium pb-2 pr-3">Клиент</th><th className="font-medium pb-2 pr-3">Объект</th><th className="font-medium pb-2 pr-3">Сумма</th><th className="font-medium pb-2 pr-3">Статус</th><th className="font-medium pb-2 pr-3">Менеджер</th><th className="font-medium pb-2">Срок сдачи</th>
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((o) => (
                  <tr key={o.n} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-3 font-semibold text-gold">{o.n}</td>
                    <td className="py-3 pr-3 text-foreground">{o.client}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{o.obj}</td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{o.sum}</td>
                    <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[o.tone]}`}>{o.status}</span></td>
                    <td className="py-3 pr-3 text-muted-foreground">{o.mgr}</td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все заказы <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
          <h3 className="font-display font-bold text-base mb-4">Популярные отчеты</h3>
          <div className="space-y-3">
            {popular.map((p) => (
              <div key={p.title} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                <div className={`w-9 h-9 rounded-lg bg-${p.c}/15 flex items-center justify-center shrink-0`}>
                  <Icon name={p.i} size={18} className={`text-${p.c}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.sub}</div>
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-gold/40 text-foreground shrink-0">Открыть</button>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все отчеты <Icon name="ArrowRight" size={13} /></button>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
