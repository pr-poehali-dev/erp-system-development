import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';

const metrics = [
  { label: 'Новые лиды', value: '24', sub: '+12 за сегодня', icon: 'UserPlus', tone: 'ok', path: '/crm' },
  { label: 'Сделки в работе', value: '58', sub: '13 245 000 ₽', icon: 'Briefcase', tone: 'gold', path: '/crm' },
  { label: 'Заказы в производстве', value: '36', sub: '8 432 000 ₽', icon: 'Settings2', tone: 'gold', path: '/orders' },
  { label: 'Готово к отгрузке', value: '7', sub: '1 872 000 ₽', icon: 'Truck', tone: 'warn', path: '/logistics' },
  { label: 'Монтажи на неделю', value: '11', sub: '2 156 000 ₽', icon: 'Wrench', tone: 'ok', path: '/installation' },
];

const funnel = [
  { name: 'Новые лиды', count: 24, w: 100, c: 'hsl(199 65% 45%)' },
  { name: 'Первый контакт', count: 18, w: 85, c: 'hsl(178 50% 42%)' },
  { name: 'Замер назначен', count: 15, w: 70, c: 'hsl(150 45% 45%)' },
  { name: 'КП отправлено', count: 12, w: 56, c: 'hsl(95 40% 48%)' },
  { name: 'Согласовано', count: 7, w: 42, c: 'hsl(45 60% 55%)' },
  { name: 'Предоплата', count: 5, w: 30, c: 'hsl(35 65% 52%)' },
  { name: 'Закрыто', count: 3, w: 20, c: 'hsl(28 70% 50%)' },
];

const orders = [
  { label: 'В производстве', count: 36 },
  { label: 'Ожидают материалы', count: 9, warn: true },
  { label: 'Просрочены', count: 5, crit: true },
  { label: 'Готово к отгрузке', count: 7 },
  { label: 'На монтаже', count: 4 },
];

const production = [
  { name: 'Корпусная мебель', val: 76, c: 'hsl(150 45% 48%)' },
  { name: 'Кухни', val: 71, c: 'hsl(40 60% 55%)' },
  { name: 'Мягкая мебель', val: 68, c: 'hsl(199 60% 50%)' },
];

const shipments = [
  { date: '23 июн', order: 'Заказ №1256', name: 'Смирнов А.С.', status: 'Подтверждено', tone: 'ok' },
  { date: '24 июн', order: 'Заказ №1257', name: 'Петрова Е.В.', status: 'Подтверждено', tone: 'ok' },
  { date: '25 июн', order: 'Заказ №1258', name: 'Фролов М.В.', status: 'В пути', tone: 'warn' },
  { date: '27 июн', order: 'Заказ №1259', name: 'Кузнецова О.П.', status: 'Запланировано', tone: 'muted' },
];

const plannerItems = [
  { time: '10:00', task: 'Замер — ЖК «Парковый», Симферополь', who: 'Иванов И.', done: true },
  { time: '12:00', task: 'Контрольный замер — ЖК «Крымская Ривьера»', who: 'Петров А.', done: false },
  { time: '14:00', task: 'Подготовить КП — заказ №1260', who: 'Смирнова Е.', done: false },
  { time: '16:00', task: 'Согласование материалов', who: 'Кузнецов Д.', done: false },
  { time: '17:30', task: 'Отгрузка — заказ №1256', who: 'Логистика', done: false },
];

const finance = [
  { label: 'Выручка', value: '9 850 000 ₽', delta: '+12%', icon: 'TrendingUp', good: true },
  { label: 'Себестоимость', value: '6 820 000 ₽', delta: '+8%', icon: 'TrendingDown', good: false },
  { label: 'Валовая прибыль', value: '3 030 000 ₽', delta: '+18%', icon: 'CircleDollarSign', good: true },
  { label: 'Маржинальность', value: '30.8%', delta: '+1.6%', icon: 'Percent', good: true },
  { label: 'Низкая маржа', value: '4', delta: 'заказа', icon: 'AlertTriangle', good: false, warn: true },
  { label: 'Долги клиентов', value: '450 000 ₽', delta: '2 просрочки', icon: 'Clock', good: false, crit: true },
];

const toneClasses: Record<string, string> = {
  ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit', gold: 'text-gold', muted: 'text-muted-foreground',
};
const toneBadge: Record<string, string> = {
  ok: 'badge-ok', warn: 'badge-warn', crit: 'badge-crit', info: 'badge-info', muted: 'badge-muted', gold: 'badge-gold',
};
const toneIconBg: Record<string, string> = {
  ok: 'bg-status-ok/12 text-status-ok',
  warn: 'bg-status-warn/12 text-status-warn',
  crit: 'bg-status-crit/12 text-status-crit',
  gold: 'bg-gold/12 text-gold',
  muted: 'bg-muted text-muted-foreground',
};

const Card = ({
  children, className = '', delay = 0, onClick, hover = true,
}: {
  children: React.ReactNode; className?: string; delay?: number; onClick?: () => void; hover?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`glass-card rounded-2xl p-5 animate-fade-in opacity-0 ${hover ? 'card-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const SectionHead = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-display font-bold text-sm text-foreground tracking-wide">{title}</h3>
    {action && (
      <button onClick={onAction} className="text-[11px] text-gold/70 hover:text-gold cursor-pointer transition-colors flex items-center gap-1 group">
        {action} <Icon name="ArrowRight" size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    )}
  </div>
);

const MetricModal = ({ metric, open, onClose }: { metric: typeof metrics[0] | null; open: boolean; onClose: () => void }) => {
  if (!metric) return null;
  return (
    <Modal open={open} onClose={onClose} title={metric.label} icon={metric.icon} size="sm"
      badge={{ label: metric.sub, tone: metric.tone as 'ok' | 'warn' | 'crit' | 'gold' | 'muted' | 'info' }}>
      <div className="text-center py-6">
        <div className={`font-display font-black text-7xl mb-2 ${toneClasses[metric.tone]}`} style={{ textShadow: '0 0 40px currentColor' }}>
          {metric.value}
        </div>
        <div className="text-sm text-muted-foreground">{metric.sub}</div>
        <div className="mt-6 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full progress-fill ${metric.tone === 'ok' ? 'bg-status-ok' : metric.tone === 'warn' ? 'bg-status-warn' : 'gold-gradient'}`} style={{ width: '72%' }} />
        </div>
        <div className="text-xs text-muted-foreground mt-2">72% от плана на месяц</div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-2 pb-2">
        {[['Вчера', String(+metric.value - 3)], ['За неделю', String(+metric.value * 5)], ['За месяц', String(+metric.value * 20)]].map(([l, v]) => (
          <div key={l} className="text-center p-3 rounded-xl bg-secondary">
            <div className="font-display font-bold text-lg text-foreground">{v}</div>
            <div className="text-[11px] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [metricModal, setMetricModal] = useState<typeof metrics[0] | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);

  return (
    <Layout title="Главная панель" subtitle="Добро пожаловать, Александр! Вот сводка на сегодня.">
      <div className="space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              onClick={() => setMetricModal(m)}
              className="glass-card rounded-2xl p-5 card-hover animate-fade-in opacity-0 cursor-pointer group relative overflow-hidden"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {/* bg accent */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl ${toneIconBg[m.tone]}`} style={{ background: 'radial-gradient(circle at 80% 10%, currentColor, transparent 60%)', opacity: 0 }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneIconBg[m.tone]}`}>
                    <Icon name={m.icon} size={18} />
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-all group-hover:translate-x-0.5" />
                </div>
                <div className={`font-display font-black text-4xl tracking-tight mb-1 stat-number animate-count-up ${toneClasses[m.tone]}`}
                  style={{ animationDelay: `${i * 70 + 200}ms` }}>
                  {m.value}
                </div>
                <div className="text-[11px] text-muted-foreground">{m.label}</div>
                <div className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Sales funnel */}
          <Card delay={80}>
            <SectionHead title="Воронка продаж" action="Подробнее" onAction={() => navigate('/crm')} />
            <div className="space-y-2">
              {funnel.map((f, i) => (
                <div key={f.name} className="flex items-center gap-2.5 group cursor-pointer" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex-1 h-6 rounded-lg overflow-hidden bg-muted relative">
                    <div
                      className="h-full rounded-lg flex items-center px-2 text-[10px] text-white/90 font-semibold transition-all duration-700 progress-fill"
                      style={{ width: `${f.w}%`, background: f.c }}
                    >
                      {f.name}
                    </div>
                  </div>
                  <span className="text-sm font-display font-bold text-foreground w-6 text-right">{f.count}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <span className="text-[12px] text-muted-foreground">Конверсия в сделку</span>
              <span className="font-display font-bold text-gold text-glow">12.5%</span>
            </div>
          </Card>

          {/* Orders */}
          <Card delay={140}>
            <SectionHead title="Заказы в работе" action="Все заказы" onAction={() => navigate('/orders')} />
            <div className="space-y-1">
              {orders.map((o) => (
                <div key={o.label} className={`flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-secondary/70 transition-colors cursor-pointer group`}>
                  <span className={`text-[13px] flex items-center gap-2 ${o.crit ? 'text-status-crit' : o.warn ? 'text-status-warn' : 'text-muted-foreground'}`}>
                    {(o.crit || o.warn) && <span className={`w-1.5 h-1.5 rounded-full ${o.crit ? 'bg-status-crit' : 'bg-status-warn'} pulse-dot`} />}
                    {o.label}
                  </span>
                  <span className={`font-display font-bold text-base ${o.crit ? 'text-status-crit' : o.warn ? 'text-status-warn' : 'text-foreground'}`}>{o.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-muted-foreground">Общая загрузка</span>
                <span className="text-gold font-semibold">72%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gold-gradient progress-fill" style={{ width: '72%' }} />
              </div>
            </div>
          </Card>

          {/* Production */}
          <Card delay={200}>
            <SectionHead title="Производство" action="Детали" onAction={() => navigate('/production')} />
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(36 10% 18%)" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(40 60% 60%)" strokeWidth="3.5"
                    strokeDasharray="72 100" strokeLinecap="round"
                    className="transition-all duration-1000" style={{ filter: 'drop-shadow(0 0 4px hsla(40,60%,55%,0.5))' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-extrabold text-lg text-gold leading-none">72%</span>
                  <span className="text-[9px] text-muted-foreground">загрузка</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                {production.map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground truncate">{p.name}</span>
                      <span className="font-semibold text-foreground">{p.val}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full progress-fill transition-all duration-700" style={{ width: `${p.val}%`, background: p.c }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-status-crit bg-status-crit/8 px-3 py-2 rounded-lg">
              <Icon name="TriangleAlert" size={13} />
              Узкое место: упаковочный цех
            </div>
          </Card>

          {/* Supply */}
          <Card delay={260}>
            <SectionHead title="Снабжение" action="На склад" onAction={() => navigate('/warehouse')} />
            <div className="space-y-3 mt-1">
              {[
                { l: 'Критический дефицит', v: 6, tone: 'crit' },
                { l: 'Низкий остаток', v: 8, tone: 'warn' },
                { l: 'Ожидается поставка', v: 12, tone: 'ok' },
              ].map((s) => (
                <div key={s.l} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-secondary/40 hover:bg-secondary/80 transition-colors cursor-pointer">
                  <span className="flex items-center gap-2.5 text-[12px] text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${s.tone === 'ok' ? 'bg-status-ok' : s.tone === 'warn' ? 'bg-status-warn' : 'bg-status-crit'}`} />
                    {s.l}
                  </span>
                  <span className={`font-display font-bold ${toneClasses[s.tone]}`}>{s.v}</span>
                </div>
              ))}
              <button
                onClick={() => navigate('/supply')}
                className="w-full mt-2 py-2.5 rounded-xl border border-gold/25 text-gold text-[12px] font-semibold hover:bg-gold/8 hover:border-gold/40 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Icon name="PackageSearch" size={14} /> К заявкам снабжения
              </button>
            </div>
          </Card>
        </div>

        {/* ── Row 3 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Shipments */}
          <Card delay={100}>
            <SectionHead title="График отгрузок" action="Логистика" onAction={() => navigate('/logistics')} />
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.order} className="flex items-center gap-3 py-1 hover:bg-secondary/40 rounded-lg px-2 -mx-2 cursor-pointer transition-colors">
                  <span className="text-[11px] text-muted-foreground w-12 shrink-0 font-medium">{s.date}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">{s.order}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.name}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold shrink-0 ${toneBadge[s.tone]}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Planner */}
          <Card delay={160}>
            <SectionHead title="Планер на сегодня" action="Все задачи" onAction={() => navigate('/planner')} />
            <div className="space-y-2.5">
              {plannerItems.map((p) => (
                <div key={p.time} className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl transition-colors cursor-pointer ${p.done ? 'opacity-50 hover:opacity-70' : 'hover:bg-secondary/40'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.done ? 'bg-status-ok' : 'bg-gold'} pulse-dot`} />
                  <span className={`text-[11px] font-bold w-10 shrink-0 ${p.done ? 'text-muted-foreground line-through' : 'text-gold'}`}>{p.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[12px] truncate ${p.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{p.task}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{p.who}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Mounts */}
          <Card delay={220}>
            <SectionHead title="Монтажи" action="Все монтажи" onAction={() => navigate('/installation')} />
            <div className="space-y-3">
              {[
                { d: '23 июн', a: 'ЖК «Сердце Крыма», наб. Салгирная', b: 'Бригада №1', t: 'warn' },
                { d: '24 июн', a: 'Пентхаус, ЖК «Алые Паруса»', b: 'Бригада №2', t: 'ok' },
                { d: '25 июн', a: 'Пос. Строгановка, Коттедж', b: 'Бригада №1+2', t: 'ok' },
                { d: '26 июн', a: 'ЖК «Парковый», Симферополь', b: 'Бригада №2', t: 'muted' },
              ].map((m) => (
                <div key={m.a} className="flex items-center gap-3 hover:bg-secondary/40 py-1 px-2 -mx-2 rounded-lg transition-colors cursor-pointer">
                  <span className="text-[11px] text-muted-foreground w-12 shrink-0 font-medium">{m.d}</span>
                  <span className="flex-1 text-[12px] truncate text-foreground">{m.a}</span>
                  <span className={`text-[10px] shrink-0 font-semibold ${toneClasses[m.t]}`}>{m.b}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Marketing */}
          <Card delay={280}>
            <SectionHead title="Маркетинг" action="Подробнее" onAction={() => navigate('/marketing')} />
            <div className="text-center py-2 mb-3">
              <div className="font-display font-extrabold text-2xl text-gold text-glow">162 000 ₽</div>
              <span className="text-[11px] text-muted-foreground">Бюджет июня</span>
            </div>
            <div className="space-y-2">
              {[
                { l: 'Instagram', v: 38, color: 'hsl(40 60% 55%)' },
                { l: 'ВКонтакте', v: 24, color: 'hsl(199 60% 50%)' },
                { l: 'Яндекс.Директ', v: 19, color: 'hsl(150 45% 48%)' },
                { l: 'Авито', v: 15, color: 'hsl(35 65% 52%)' },
                { l: 'Реферальная', v: 11, color: 'hsl(280 40% 55%)' },
              ].map((m) => (
                <div key={m.l} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-24 truncate shrink-0">{m.l}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full progress-fill" style={{ width: `${(m.v / 38) * 100}%`, background: m.color }} />
                  </div>
                  <span className="text-[11px] font-bold text-foreground w-5 text-right">{m.v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Finance bar ── */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in opacity-0 card-hover border-gold-gradient" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gold/12 border border-gold/20 flex items-center justify-center">
                <Icon name="CircleDollarSign" size={20} className="text-gold" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground">Финансы и себестоимость</h3>
                <p className="text-[11px] text-muted-foreground">Июнь 2026 · план/факт</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/finance')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gold/25 text-gold text-[12px] font-semibold hover:bg-gold/8 hover:border-gold/40 transition-all"
            >
              <Icon name="BarChart3" size={14} /> Подробный отчёт
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {finance.map((f, i) => (
              <div
                key={f.label}
                className={`p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group animate-fade-in opacity-0 border ${f.crit ? 'border-status-crit/15 hover:border-status-crit/30' : f.warn ? 'border-status-warn/15 hover:border-status-warn/30' : 'border-border/50 hover:border-gold/20'}`}
                style={{ animationDelay: `${220 + i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-muted-foreground">{f.label}</span>
                  <Icon name={f.icon} size={14} className={f.crit ? 'text-status-crit' : f.warn ? 'text-status-warn' : f.good ? 'text-status-ok' : 'text-muted-foreground'} />
                </div>
                <div className={`font-display font-extrabold text-xl mb-1 ${f.crit ? 'text-status-crit' : f.warn ? 'text-status-warn' : 'text-foreground'}`}>{f.value}</div>
                <div className={`text-[11px] ${f.good && !f.warn && !f.crit ? 'text-status-ok' : 'text-muted-foreground'}`}>{f.delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── New lead promo ── */}
        <div
          className="glass-card-light rounded-2xl p-6 animate-fade-in opacity-0 cursor-pointer group overflow-hidden relative border-gold-gradient"
          style={{ animationDelay: '350ms' }}
          onClick={() => setShowLeadModal(true)}
        >
          <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-l from-gold/5 to-transparent" />
            <div className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gold/8 blur-xl animate-float" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/20 animate-float">
                <Icon name="Zap" size={24} className="text-background" />
              </div>
              <div>
                <div className="font-display font-bold text-base text-foreground group-hover:text-gold transition-colors">Быстрые действия</div>
                <div className="text-[12px] text-muted-foreground">Создать сделку, замер, КП или задачу в один клик</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gold/70">Открыть</span>
              <Icon name="ChevronRight" size={16} className="text-gold/50 group-hover:text-gold group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Metric detail modal */}
      <MetricModal metric={metricModal} open={!!metricModal} onClose={() => setMetricModal(null)} />

      {/* Quick create from banner */}
      <Modal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        title="Создать новый лид"
        icon="UserPlus"
        size="md"
        footer={
          <div className="flex gap-3">
            <button onClick={() => { setShowLeadModal(false); success('Лид создан!', 'Новая сделка добавлена в воронку CRM'); }} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
              Создать сделку
            </button>
            <button onClick={() => setShowLeadModal(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          {[
            { label: 'Имя клиента', placeholder: 'Иванова Мария Андреевна', icon: 'User' },
            { label: 'Телефон', placeholder: '+7 (978) 000-00-00', icon: 'Phone' },
            { label: 'Источник', placeholder: 'Instagram, ВКонтакте, Авито...', icon: 'Share2' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{f.label}</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name={f.icon} size={15} className="text-gold shrink-0" />
                <input
                  placeholder={f.placeholder}
                  className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          ))}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea
              placeholder="Что хочет клиент?"
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Index;