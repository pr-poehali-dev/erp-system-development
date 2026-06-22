import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const workshops = [
  { name: 'Корпусной цех', load: 82, orders: 14, workers: 8, icon: 'Package' },
  { name: 'Малярный цех', load: 71, orders: 10, workers: 5, icon: 'Paintbrush' },
  { name: 'Сборочный цех', load: 68, orders: 9, workers: 6, icon: 'Wrench' },
  { name: 'Упаковочный цех', load: 54, orders: 7, workers: 4, icon: 'PackageCheck' },
];

const prodOrders = [
  { id: '№1258', client: 'Мария Петрова', type: 'Кухня и остров', stage: 'Распил', pct: 65, deadline: '21.07.2026', worker: 'Бригада №1', urgent: false },
  { id: '№1256', client: 'Алексей Смирнов', type: 'Гостиная', stage: 'Сборка', pct: 92, deadline: '23.06.2026', worker: 'Бригада №2', urgent: false },
  { id: '№1250', client: 'Максим Фролов', type: 'Кухня и остров', stage: 'Покраска', pct: 78, deadline: '20.06.2026', worker: 'Бригада №1', urgent: true },
  { id: '№1263', client: 'Игорь Волков', type: 'Шкафы', stage: 'Проектирование', pct: 15, deadline: '30.07.2026', worker: 'Бригада №3', urgent: false },
  { id: '№1255', client: 'Дмитрий Орлов', type: 'Спальня', stage: 'Упаковка', pct: 88, deadline: '15.06.2026', worker: 'Бригада №2', urgent: true },
];

const Production = () => {
  const [view, setView] = useState<'list' | 'board'>('list');
  return (
    <Layout title="Производство" titleIcon="Factory" actions={
      <>
        <button onClick={() => setView('list')} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm ${view === 'list' ? 'gold-gradient text-background font-semibold' : 'glass-card'}`}>
          <Icon name="List" size={15} /> Список
        </button>
        <button onClick={() => setView('board')} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm ${view === 'board' ? 'gold-gradient text-background font-semibold' : 'glass-card'}`}>
          <Icon name="LayoutGrid" size={15} /> Доска
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
          <Icon name="Plus" size={17} /> Задача производству
        </button>
      </>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {workshops.map((w, i) => (
          <div key={w.name} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/12 flex items-center justify-center"><Icon name={w.icon} size={16} className="text-gold" /></div>
              <span className="text-[12px] font-semibold text-foreground">{w.name}</span>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className={`font-display font-extrabold text-2xl ${w.load >= 80 ? 'text-status-crit' : w.load >= 70 ? 'text-status-warn' : 'text-status-ok'}`}>{w.load}%</span>
              <span className="text-[11px] text-muted-foreground">{w.orders} заказов</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${w.load >= 80 ? 'bg-status-crit' : w.load >= 70 ? 'bg-status-warn' : 'bg-status-ok'}`} style={{ width: `${w.load}%` }} />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">{w.workers} сотрудников</div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base">Заказы в производстве</h3>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-crit inline-block" />Срочно</span>
          </div>
        </div>
        <div className="space-y-3">
          {prodOrders.map((o) => (
            <div key={o.id} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${o.urgent ? 'border-status-crit/30 bg-status-crit/5' : 'border-border bg-secondary/50 hover:border-gold/30'}`}>
              <div className="w-14 shrink-0">
                <div className="font-semibold text-gold text-[13px]">{o.id}</div>
                {o.urgent && <span className="text-[10px] text-status-crit">Срочно</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-foreground">{o.client} — {o.type}</div>
                <div className="text-[11px] text-muted-foreground">Этап: <span className="text-foreground">{o.stage}</span> · {o.worker}</div>
              </div>
              <div className="w-36 shrink-0">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Готовность</span>
                  <span className="font-semibold text-foreground">{o.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${o.pct >= 90 ? 'bg-status-ok' : o.urgent ? 'bg-status-crit' : 'bg-gold'}`} style={{ width: `${o.pct}%` }} />
                </div>
              </div>
              <div className="w-24 shrink-0 text-right">
                <div className="text-[11px] text-muted-foreground">Срок</div>
                <div className="text-[12px] font-medium text-foreground">{o.deadline}</div>
              </div>
              <button className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Icon name="MoreVertical" size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Production;
