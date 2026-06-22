import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const tabs = ['День', 'Неделя', 'Месяц', 'Список', 'Канбан', 'Мои задачи'];
const days = [
  { name: 'Пн, 23 июн', label: 'Маркетинговая кампания VK', tone: 'ok' },
  { name: 'Вт, 24 июн', label: 'Обучение менеджеров', tone: 'warn' },
  { name: 'Ср, 25 июн', label: 'Проверка склада', tone: 'info' },
  { name: 'Чт, 26 июн', label: '', tone: '' },
  { name: 'Пт, 27', label: 'Отгрузки', tone: 'warn', active: true },
  { name: 'Сб, 28 июн', label: 'Монтажи', tone: 'crit' },
  { name: 'Вс, 29 июн', label: '', tone: '' },
];
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

type Ev = { day: number; start: number; span: number; title: string; sub: string; color: string };
const events: Ev[] = [
  { day: 0, start: 1, span: 1, title: '09:00 – 10:00 Замер', sub: 'Мария Петрова, ЖК «Парковый», Симферополь', color: 'hsl(150 40% 30%)' },
  { day: 0, start: 3, span: 1, title: '11:00 – 12:00 Звонок клиенту', sub: 'Алексей Смирнов, Кухня и остров', color: 'hsl(40 40% 30%)' },
  { day: 0, start: 6, span: 2, title: '14:00 – 15:30 Подготовить КП', sub: 'Мария Петрова, Кухня и остров', color: 'hsl(199 40% 28%)' },
  { day: 0, start: 8, span: 1, title: '16:00 – 17:00 Планерка отдела', sub: 'Продаж', color: 'hsl(36 25% 25%)' },
  { day: 1, start: 1, span: 1, title: '08:30 – 09:30 Контрольный замер', sub: 'Ольга Кузнецова, Рублево-Успенское ш., 12', color: 'hsl(4 50% 30%)' },
  { day: 1, start: 2, span: 1, title: '10:00 – 11:30 Согласование КП', sub: 'Алексей Смирнов, Кухня классика', color: 'hsl(40 40% 30%)' },
  { day: 1, start: 5, span: 1, title: '13:00 – 14:00 Встреча с поставщиком', sub: 'Фурнитура Blum', color: 'hsl(36 25% 25%)' },
  { day: 1, start: 7, span: 1, title: '15:00 – 16:00 Замер', sub: 'Игорь Волков, Офис, БЦ «Москва-Сити»', color: 'hsl(150 40% 30%)' },
  { day: 2, start: 1, span: 1, title: '09:00 – 10:00 Замер', sub: 'Наталья Соколова, Новокуркинское ш., 25', color: 'hsl(150 40% 30%)' },
  { day: 2, start: 3, span: 1, title: '11:00 – 12:00 Подготовить КП', sub: 'Наталья Соколова, Агаркова Эстейт', color: 'hsl(280 30% 30%)' },
  { day: 2, start: 6, span: 1, title: '14:00 – 15:00 Задача снабжению', sub: 'Проверить материалы', color: 'hsl(36 25% 25%)' },
  { day: 2, start: 8, span: 2, title: '16:00 – 17:30 Просроченная задача', sub: 'Подготовить чертежи (Кухня и остров)', color: 'hsl(4 55% 32%)' },
  { day: 3, start: 0, span: 1, title: '08:30 – 09:30 Планерка производства', sub: '', color: 'hsl(199 40% 28%)' },
  { day: 3, start: 2, span: 1, title: '10:00 – 11:00 Замер', sub: 'Максим Фролов, ЖК «Сердце столицы»', color: 'hsl(150 40% 30%)' },
  { day: 3, start: 4, span: 1, title: '12:00 – 13:00 Согласование чертежей', sub: 'Технология', color: 'hsl(36 25% 25%)' },
  { day: 3, start: 6, span: 1, title: '14:00 – 15:00 Передача заказа', sub: 'Технологу', color: 'hsl(40 40% 30%)' },
  { day: 3, start: 7, span: 1, title: '15:00 – 16:00 Обучение сотрудников', sub: 'Работа в системе', color: 'hsl(36 25% 25%)' },
  { day: 3, start: 9, span: 1, title: '17:00 – 18:00 Маркетинг план', sub: 'Обсуждение', color: 'hsl(150 40% 30%)' },
  { day: 4, start: 1, span: 2, title: '09:00 – 19:00 Отгрузка', sub: 'Заказ №1258, Кухня и остров', color: 'hsl(40 45% 30%)' },
  { day: 4, start: 3, span: 1, title: '11:00 – 12:30 Замер', sub: 'Виктория Морозова, ул. Винницкая, 8к3', color: 'hsl(150 40% 30%)' },
  { day: 4, start: 6, span: 1, title: '16:00 – 17:30 Подготовить КП', sub: 'Виктория Морозова, Настоящево', color: 'hsl(199 40% 28%)' },
  { day: 5, start: 2, span: 2, title: '10:00 – 14:00 Монтаж', sub: 'Бригада №2, Детская мебель', color: 'hsl(36 25% 25%)' },
  { day: 5, start: 7, span: 3, title: '15:00 – 18:00 Монтаж', sub: 'Бригада №1, Кухня классика', color: 'hsl(36 25% 25%)' },
];

const myTasks = [
  { time: '09:00', title: 'Замер у клиента', sub: 'Мария Петрова, ЖК «Парковый», Симферополь, кв. 45', prio: 'Низкий', tone: 'ok' },
  { time: '10:00', title: 'Отгрузка заказа №1258', sub: 'Кухня и остров', prio: 'Высокий', tone: 'crit' },
  { time: '11:00', title: 'Подготовить КП', sub: 'Алексей Смирнов', prio: 'Средний', tone: 'warn' },
  { time: '14:00', title: 'Передача заказа технологу', sub: 'Заказ №1261', prio: 'Низкий', tone: 'ok' },
  { time: '16:00', title: 'Просроченная задача', sub: 'Подготовить чертежи', prio: 'Критический', tone: 'crit', overdue: true },
];

const events5 = [
  { date: '24 июн, 08:30', title: 'Контрольный замер', sub: 'Ольга Кузнецова', tone: 'crit' },
  { date: '25 июн, 09:00', title: 'Замер у клиента', sub: 'Наталья Соколова', tone: 'ok' },
  { date: '26 июн, 12:00', title: 'Согласование чертежей', sub: 'Технология', tone: 'warn' },
  { date: '27 июн, 09:00', title: 'Отгрузка заказа №1258', sub: 'Кухня и остров', tone: 'crit' },
  { date: '28 июн, 10:00', title: 'Монтаж детской мебели', sub: 'Бригада №2', tone: 'info' },
];

const overdue = [
  { title: 'Подготовить чертежи (Кухня и остров)', sub: 'Просрочена 2 дня' },
  { title: 'Согласовать материалы по заказу №1256', sub: 'Просрочена 1 день' },
  { title: 'Отправить КП клиенту (Агаркова Эстейт)', sub: 'Просрочена 1 день' },
];

const noDate = [
  { title: 'Обновить прайс-лист на материалы', sub: 'Технология' },
  { title: 'Проверить остатки на складе', sub: 'Снабжение' },
];

const load = [
  { name: 'Иванова А.С.', tasks: 12, pct: 80, c: 'status-crit' },
  { name: 'Петрова Е.В.', tasks: 9, pct: 60, c: 'status-warn' },
  { name: 'Кузнецов Д.А.', tasks: 7, pct: 50, c: 'status-warn' },
  { name: 'Смирнов П.А.', tasks: 5, pct: 30, c: 'status-ok' },
  { name: 'Морозова В.А.', tasks: 4, pct: 25, c: 'status-ok' },
];

const dot: Record<string, string> = { ok: 'bg-status-ok', warn: 'bg-status-warn', crit: 'bg-status-crit', info: 'bg-[hsl(199_60%_50%)]' };
const prioBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
};

const Planner = () => {
  const [active, setActive] = useState('Неделя');

  return (
    <Layout
      title="Планер и задачи"
      titleIcon="CalendarCheck"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Новая задача</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="SlidersHorizontal" size={16} /> <span className="hidden lg:inline">Фильтры</span>
          </button>
        </>
      }
    >
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${active === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t}
            {t === 'Мои задачи' && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-gold/15 text-gold">8</span>}
            {active === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* Calendar */}
        <div className="glass-card rounded-2xl overflow-hidden animate-fade-in opacity-0">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
            <div className="border-r border-border" />
            {days.map((d) => (
              <div key={d.name} className={`px-2 py-2.5 border-r border-border last:border-r-0 ${d.active ? 'bg-gold/8' : ''}`}>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  {d.name}
                  {d.active && <span className="w-5 h-5 rounded-full gold-gradient text-background text-[10px] flex items-center justify-center font-bold">27</span>}
                </div>
                {d.label && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot[d.tone]}`} />{d.label}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Grid */}
          <div className="relative grid grid-cols-[60px_repeat(7,1fr)]" style={{ gridTemplateRows: `repeat(${hours.length}, 56px)` }}>
            {hours.map((h, hi) => (
              <div key={h} className="border-r border-b border-border text-[10px] text-muted-foreground px-2 py-1" style={{ gridColumn: 1, gridRow: hi + 1 }}>
                {h}
              </div>
            ))}
            {hours.map((_, hi) =>
              days.map((d, di) => (
                <div key={`${hi}-${di}`} className={`border-r border-b border-border last:border-r-0 ${d.active ? 'bg-gold/[0.03]' : ''}`} style={{ gridColumn: di + 2, gridRow: hi + 1 }} />
              ))
            )}
            {events.map((e, i) => (
              <div
                key={i}
                className="m-0.5 rounded-md p-1.5 overflow-hidden cursor-pointer hover:brightness-125 transition-all border-l-2"
                style={{ gridColumn: e.day + 2, gridRow: `${e.start + 1} / span ${e.span}`, background: e.color, borderColor: 'rgba(255,255,255,0.3)' }}
              >
                <div className="text-[10px] font-semibold text-white/95 leading-tight truncate">{e.title}</div>
                {e.sub && <div className="text-[9px] text-white/70 leading-tight mt-0.5 line-clamp-2">{e.sub}</div>}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Приоритет задач:</span>
            {[['Низкий', 'ok'], ['Средний', 'warn'], ['Высокий', 'crit'], ['Критический', 'crit']].map(([l, t]) => (
              <span key={l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${dot[t]}`} />{l}</span>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm">Мои задачи на сегодня <span className="text-gold">8</span></h3>
              <Icon name="MoreVertical" size={16} className="text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {myTasks.map((t) => (
                <div key={t.title} className="flex gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-10 shrink-0 pt-0.5">{t.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[13px] font-medium truncate ${t.overdue ? 'text-status-crit' : 'text-foreground'}`}>{t.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${prioBg[t.tone]}`}>{t.prio}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Показать все задачи <Icon name="ArrowRight" size={13} /></button>
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '140ms' }}>
            <h3 className="font-display font-bold text-sm mb-4">Ближайшие события <span className="text-gold">5</span></h3>
            <div className="space-y-3">
              {events5.map((e) => (
                <div key={e.title} className="flex gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${dot[e.tone]}`} />
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground">{e.date}</div>
                    <div className="text-[13px] font-medium text-foreground">{e.title}</div>
                    <div className="text-[11px] text-muted-foreground">{e.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все события <Icon name="ArrowRight" size={13} /></button>
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
            <h3 className="font-display font-bold text-sm mb-4">Быстрое создание</h3>
            <div className="space-y-2">
              {[
                { l: 'Новая задача', i: 'Plus', gold: true },
                { l: 'Назначить замер', i: 'Ruler' },
                { l: 'Назначить контрольный замер', i: 'ClipboardCheck' },
                { l: 'Создать сделку', i: 'Briefcase' },
                { l: 'Создать заказ', i: 'ClipboardList' },
              ].map((b) => (
                <button key={b.l} className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${b.gold ? 'gold-gradient text-background font-semibold' : 'bg-secondary hover:bg-muted text-foreground'}`}>
                  <Icon name={b.i} size={16} /> {b.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '120ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Просроченные задачи <span className="text-status-crit">3</span></h3>
          <div className="space-y-3">
            {overdue.map((o) => (
              <div key={o.title} className="flex gap-3">
                <Icon name="CircleAlert" size={16} className="text-status-crit mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] text-foreground">{o.title}</div>
                  <div className="text-[11px] text-status-crit">{o.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все просроченные задачи <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '180ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Задачи без даты <span className="text-gold">2</span></h3>
          <div className="space-y-3">
            {noDate.map((o) => (
              <div key={o.title} className="flex gap-3">
                <Icon name="FileText" size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-[13px] text-foreground">{o.title}</div>
                  <div className="text-[11px] text-muted-foreground">{o.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-xs text-gold/80 hover:text-gold flex items-center gap-1">Все задачи без даты <Icon name="ArrowRight" size={13} /></button>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '240ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Нагрузка менеджеров</h3>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
            <span>Менеджер</span><span>Задачи</span><span>Загрузка</span>
          </div>
          <div className="space-y-2.5">
            {load.map((m) => (
              <div key={m.name} className="flex items-center gap-3 text-[13px]">
                <span className="w-24 truncate text-foreground">{m.name}</span>
                <span className="w-6 text-center font-semibold">{m.tasks}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full bg-${m.c}`} style={{ width: `${m.pct}%` }} />
                </div>
                <span className="w-9 text-right text-muted-foreground">{m.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Planner;