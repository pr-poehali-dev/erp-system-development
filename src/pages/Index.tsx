import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const metrics = [
  { label: 'Новые лиды', value: '24', sub: '+12 за сегодня', icon: 'UserPlus', tone: 'ok' },
  { label: 'Сделки в работе', value: '58', sub: 'на сумму 13 245 000 ₽', icon: 'Briefcase', tone: 'gold' },
  { label: 'Заказы в производстве', value: '36', sub: 'на сумму 8 432 000 ₽', icon: 'Settings2', tone: 'gold' },
  { label: 'Готово к отгрузке', value: '7', sub: 'на сумму 1 872 000 ₽', icon: 'Truck', tone: 'warn' },
  { label: 'Монтажи на неделю', value: '11', sub: 'на сумму 2 156 000 ₽', icon: 'Wrench', tone: 'ok' },
];

const funnel = [
  { name: 'Новые лиды', count: 24, w: 100, c: 'hsl(199 65% 45%)' },
  { name: 'Первый контакт', count: 18, w: 86, c: 'hsl(178 50% 42%)' },
  { name: 'Замер назначен', count: 15, w: 72, c: 'hsl(150 45% 45%)' },
  { name: 'КП отправлено', count: 12, w: 58, c: 'hsl(95 40% 48%)' },
  { name: 'Согласовано', count: 7, w: 44, c: 'hsl(45 60% 55%)' },
  { name: 'Предоплата', count: 5, w: 32, c: 'hsl(35 65% 52%)' },
  { name: 'Закрыто', count: 3, w: 22, c: 'hsl(28 70% 50%)' },
];

const orders = [
  { label: 'В производстве', count: 36, crit: false },
  { label: 'Ожидают материалы', count: 9, crit: false, warn: true },
  { label: 'Просрочены', count: 5, crit: true },
  { label: 'Готово к отгрузке', count: 7, crit: false },
  { label: 'На монтаже', count: 4, crit: false },
];

const production = [
  { name: 'Мягкая мебель', val: 68 },
  { name: 'Корпусная мебель', val: 76 },
  { name: 'Кухни', val: 71 },
];

const shipments = [
  { date: '23 июн', order: 'Заказ №1256', name: 'Смирнов А.С.', status: 'Подтверждено', tone: 'ok' },
  { date: '24 июн', order: 'Заказ №1257', name: 'Петрова Е.В.', status: 'Подтверждено', tone: 'ok' },
  { date: '25 июн', order: 'Заказ №1258', name: 'Фролов М.В.', status: 'В пути', tone: 'warn' },
  { date: '27 июн', order: 'Заказ №1259', name: 'Кузнецова О.П.', status: 'Запланировано', tone: 'muted' },
];

const planner = [
  { time: '10:00', task: 'Замер — Симферополь, ЖК «Парковый»', who: 'Иванов И.' },
  { time: '12:00', task: 'Контрольный замер — ЖК «Крымская Ривьера»', who: 'Петров А.' },
  { time: '14:00', task: 'Подготовить КП — заказ №1260', who: 'Смирнова Е.' },
  { time: '16:00', task: 'Согласование материалов', who: 'Кузнецов Д.' },
  { time: '17:30', task: 'Отгрузка — заказ №1256', who: 'Логистика' },
];

const finance = [
  { label: 'Выручка', value: '9 850 000 ₽', delta: '+12% к маю', good: true },
  { label: 'Себестоимость', value: '6 820 000 ₽', delta: '+8% к маю', good: true },
  { label: 'Валовая прибыль', value: '3 030 000 ₽', delta: '+18% к маю', good: true },
  { label: 'Маржинальность', value: '30.8%', delta: '+1.6% к маю', good: true },
];

const toneColor: Record<string, string> = {
  ok: 'text-status-ok',
  warn: 'text-status-warn',
  crit: 'text-status-crit',
  gold: 'text-gold',
  muted: 'text-muted-foreground',
};
const toneBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  muted: 'bg-muted text-muted-foreground',
};

const Card = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <div
    className={`glass-card rounded-2xl p-5 card-hover animate-fade-in opacity-0 ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

const SectionHead = ({ title, action }: { title: string; action?: string }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-display font-bold text-base text-foreground">{title}</h3>
    {action && <span className="text-xs text-gold/80 hover:text-gold cursor-pointer transition-colors flex items-center gap-1">{action}</span>}
  </div>
);

const Index = () => {
  return (
    <Layout
      title="Добро пожаловать, Александр!"
      subtitle="Главная панель управления бизнесом"
      actions={
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-gold/20">
          <Icon name="Plus" size={18} />
          <span className="hidden lg:inline">Быстрое действие</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {metrics.map((m, i) => (
              <Card key={m.label} delay={i * 60}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                  <Icon name={m.icon} size={18} className={toneColor[m.tone]} />
                </div>
                <div className="font-display font-extrabold text-4xl text-foreground tracking-tight">{m.value}</div>
                <div className={`text-xs mt-2 ${m.tone === 'ok' ? 'text-status-ok' : 'text-muted-foreground'}`}>{m.sub}</div>
              </Card>
            ))}
          </div>

          {/* Row 2: Sales, Orders, Production, Supply */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Sales funnel */}
            <Card delay={100}>
              <SectionHead title="Продажи" action="За месяц" />
              <div className="space-y-2">
                {funnel.map((f) => (
                  <div key={f.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-7 rounded-md flex items-center px-2 text-[11px] text-white/90 font-medium" style={{ width: `${f.w}%`, background: f.c }}>
                        {f.name}
                      </div>
                    </div>
                    <span className="text-sm font-semibold w-6 text-right">{f.count}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-sm text-muted-foreground">Конверсия</span>
                <span className="font-display font-bold text-gold">12.5%</span>
              </div>
            </Card>

            {/* Orders */}
            <Card delay={160}>
              <SectionHead title="Заказы в работе" action="Все заказы" />
              <div className="space-y-1">
                {orders.map((o) => (
                  <div key={o.label} className={`flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors ${o.crit ? 'text-status-crit' : ''}`}>
                    <span className={`text-sm ${o.warn ? 'text-status-warn' : ''}`}>{o.label}</span>
                    <span className={`font-display font-bold ${o.crit ? 'text-status-crit' : o.warn ? 'text-status-warn' : 'text-foreground'}`}>{o.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Production */}
            <Card delay={220}>
              <SectionHead title="Производство" action="Сегодня" />
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(36 10% 20%)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(40 60% 60%)" strokeWidth="3" strokeDasharray="72 100" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-extrabold text-xl text-gold">72%</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Загрузка цеха</span>
              </div>
              <div className="space-y-3">
                {production.map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="font-semibold text-foreground">{p.val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full gold-gradient rounded-full" style={{ width: `${p.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-status-crit">
                <Icon name="TriangleAlert" size={14} />
                Узкие места: Обивочный цех
              </div>
            </Card>

            {/* Supply */}
            <Card delay={280}>
              <SectionHead title="Снабжение" action="Склад" />
              <div className="space-y-3 mt-1">
                <div className="text-center py-2">
                  <div className="font-display font-extrabold text-3xl text-gold">14</div>
                  <div className="text-xs text-muted-foreground">позиций в дефиците</div>
                </div>
                <div className="space-y-2">
                  {[
                    { l: 'Критический дефицит', v: 6, c: 'status-crit' },
                    { l: 'Низкий остаток', v: 8, c: 'status-warn' },
                    { l: 'Ожидается поставка', v: 12, c: 'status-ok' },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className={`w-2 h-2 rounded-full bg-${s.c}`} />{s.l}
                      </span>
                      <span className="font-semibold">{s.v}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-2 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 transition-colors">
                  Перейти к заявкам
                </button>
              </div>
            </Card>
          </div>

          {/* Row 3: Shipments, Planner, Mounts, Marketing */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <Card delay={120}>
              <SectionHead title="График отгрузок" action="На неделю" />
              <div className="space-y-3">
                {shipments.map((s) => (
                  <div key={s.order} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{s.date}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{s.order}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-medium shrink-0 ${toneBg[s.tone] || toneBg.muted}`}>{s.status}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-gold/80 hover:text-gold flex items-center justify-center gap-1 transition-colors">
                Перейти к логистике <Icon name="ArrowRight" size={14} />
              </button>
            </Card>

            <Card delay={180}>
              <SectionHead title="Планер на сегодня" action="5 задач" />
              <div className="space-y-3">
                {planner.map((p) => (
                  <div key={p.time} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gold w-12 shrink-0">{p.time}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{p.task}</div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{p.who}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-gold/80 hover:text-gold flex items-center justify-center gap-1 transition-colors">
                Перейти в планер <Icon name="ArrowRight" size={14} />
              </button>
            </Card>

            <Card delay={240}>
              <SectionHead title="Монтажи" action="На неделю" />
              <div className="space-y-3">
                {[
                  { d: '23 мая', a: 'ЖК Лесной, корп. 4, кв. 231', b: 'Бригада 1', t: 'ok' },
                  { d: '24 мая', a: 'ЖК Парк, ул. Цветочная, 15', b: 'Бригада 2', t: 'ok' },
                  { d: '25 мая', a: 'ЖК Вершина, д. 7, кв. 12', b: 'Бригада 1', t: 'warn' },
                  { d: '26 мая', a: 'ЖК Горки, д. 2, кв. 45', b: 'Бригада 3', t: 'muted' },
                ].map((m) => (
                  <div key={m.a} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 shrink-0">{m.d}</span>
                    <span className="flex-1 text-sm truncate">{m.a}</span>
                    <span className={`text-xs shrink-0 ${toneColor[m.t]}`}>{m.b}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-gold/80 hover:text-gold flex items-center justify-center gap-1 transition-colors">
                Все монтажи <Icon name="ArrowRight" size={14} />
              </button>
            </Card>

            <Card delay={300}>
              <SectionHead title="Маркетинг" action="Май 2024" />
              <div className="flex flex-col items-center py-2">
                <div className="font-display font-extrabold text-2xl text-gold">320 000 ₽</div>
                <span className="text-xs text-muted-foreground mb-3">Бюджет</span>
              </div>
              <div className="space-y-2">
                {[
                  { l: 'ВК реклама', v: '40%', c: 'hsl(199 60% 50%)' },
                  { l: 'Telegram', v: '25%', c: 'hsl(178 50% 45%)' },
                  { l: 'Instagram', v: '20%', c: 'hsl(40 60% 55%)' },
                  { l: 'Рекомендации', v: '10%', c: 'hsl(150 45% 48%)' },
                  { l: 'Прочее', v: '5%', c: 'hsl(28 60% 50%)' },
                ].map((m) => (
                  <div key={m.l} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.c }} />{m.l}
                    </span>
                    <span className="font-semibold">{m.v}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Finance bar */}
          <Card delay={200} className="!p-6">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="CircleDollarSign" size={20} className="text-gold" />
              <h3 className="font-display font-bold text-base">Финансы и себестоимость</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {finance.map((f) => (
                <div key={f.label}>
                  <div className="text-xs text-muted-foreground mb-1">{f.label}</div>
                  <div className="font-display font-extrabold text-2xl text-foreground">{f.value}</div>
                  <div className="text-xs text-status-ok mt-1">{f.delta}</div>
                </div>
              ))}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Заказы с низкой маржой</div>
                <div className="font-display font-extrabold text-2xl text-status-warn">4</div>
                <div className="text-xs text-muted-foreground mt-1">Требуют внимания</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Просроченные платежи</div>
                <div className="font-display font-extrabold text-2xl text-status-crit">2</div>
                <div className="text-xs text-muted-foreground mt-1">на сумму 450 000 ₽</div>
              </div>
            </div>
          </Card>
        </div>
    </Layout>
  );
};

export default Index;