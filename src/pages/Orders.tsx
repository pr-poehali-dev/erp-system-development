import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const orders = [
  { id: '№1258', client: 'Мария Петрова', obj: 'Квартира, ЖК «Парковый», Симферополь', type: 'Кухня и остров', sum: '1 245 000 ₽', status: 'В производстве', statusTone: 'ok', mgr: 'Иванова А.С.', deadline: '21.07.2026', pct: 65, company: 'ТМ' },
  { id: '№1256', client: 'Алексей Смирнов', obj: 'Квартира, ЖК «Центральный», Симферополь', type: 'Гостиная', sum: '980 000 ₽', status: 'Готов к монтажу', statusTone: 'info', mgr: 'Петрова Е.В.', deadline: '23.06.2026', pct: 100, company: 'ТМ' },
  { id: '№1261', client: 'Ольга Кузнецова', obj: 'Дом, Симферопольский р-н', type: 'Кухня классика', sum: '750 000 ₽', status: 'Согласование', statusTone: 'warn', mgr: 'Кузнецов Д.А.', deadline: '27.07.2026', pct: 20, company: 'ТМ' },
  { id: '№1263', client: 'Игорь Волков', obj: 'Офис, БЦ «Крымский», Симферополь', type: 'Шкафы и стеллажи', sum: '1 130 000 ₽', status: 'Проектирование', statusTone: 'purple', mgr: 'Иванова А.С.', deadline: '30.07.2026', pct: 10, company: 'ТМ' },
  { id: '№1255', client: 'Дмитрий Орлов', obj: 'Квартира, ЖК «Крымская Ривьера»', type: 'Спальня', sum: '680 000 ₽', status: 'Просрочен', statusTone: 'crit', mgr: 'Кузнецов Д.А.', deadline: '15.06.2026', pct: 80, company: 'К+' },
  { id: '№1253', client: 'Наталья Соколова', obj: 'Дом, Симферополь', type: 'Гардеробная', sum: '420 000 ₽', status: 'Отгружен', statusTone: 'muted', mgr: 'Иванова А.С.', deadline: '10.06.2026', pct: 100, company: 'К+' },
  { id: '№1250', client: 'Максим Фролов', obj: 'Квартира, ЖК «Сердце Крыма»', type: 'Кухня и остров', sum: '675 000 ₽', status: 'На монтаже', statusTone: 'warn', mgr: 'Петрова Е.В.', deadline: '20.06.2026', pct: 95, company: 'К+' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  purple: 'bg-[hsl(280_40%_55%)]/15 text-[hsl(280_45%_70%)]',
  muted: 'bg-muted text-muted-foreground',
};

const stages = [
  { name: 'Проектирование', done: true },
  { name: 'Согласование', done: true },
  { name: 'В производстве', done: false, active: true },
  { name: 'Контроль качества', done: false },
  { name: 'Готов к отгрузке', done: false },
  { name: 'Доставка', done: false },
  { name: 'Монтаж', done: false },
  { name: 'Сдача', done: false },
];

const Orders = () => {
  const [sel, setSel] = useState('№1258');
  const selOrder = orders.find((o) => o.id === sel)!;

  return (
    <Layout
      title="Заказы"
      titleIcon="ClipboardList"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
            <Icon name="Plus" size={17} /> Новый заказ
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="Download" size={16} /> Экспорт
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'В производстве', value: '36', tone: 'ok' },
          { label: 'Ожидают материалы', value: '9', tone: 'warn' },
          { label: 'Просрочены', value: '5', tone: 'crit' },
          { label: 'Готово к отгрузке', value: '7', tone: 'info' },
          { label: 'На монтаже', value: '4', tone: 'gold' },
        ].map((k) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 text-center animate-fade-in opacity-0">
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.tone === 'crit' ? 'text-status-crit' : k.tone === 'warn' ? 'text-status-warn' : k.tone === 'ok' ? 'text-status-ok' : k.tone === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.value}</div>
            <div className="text-[12px] text-muted-foreground">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-secondary">
              <Icon name="Search" size={15} className="text-muted-foreground" />
              <input placeholder="Поиск по номеру заказа, клиенту..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            {['Статус', 'Менеджер', 'Компания', 'Срок'].map((f) => (
              <button key={f} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-[12px] text-muted-foreground">
                {f} <Icon name="ChevronDown" size={13} />
              </button>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                <th className="font-medium pb-2 pr-3">№ заказа</th>
                <th className="font-medium pb-2 pr-3">Клиент / Объект</th>
                <th className="font-medium pb-2 pr-3">Тип</th>
                <th className="font-medium pb-2 pr-3">Сумма</th>
                <th className="font-medium pb-2 pr-3">Прогресс</th>
                <th className="font-medium pb-2 pr-3">Статус</th>
                <th className="font-medium pb-2 pr-3">Срок</th>
                <th className="font-medium pb-2">Менеджер</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setSel(o.id)} className={`border-b border-border/40 cursor-pointer transition-colors ${sel === o.id ? 'bg-gold/8' : 'hover:bg-muted/30'}`}>
                  <td className="py-3 pr-3">
                    <div className="font-semibold text-gold">{o.id}</div>
                    <div className="text-[10px] text-muted-foreground">{o.company}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="text-[13px] text-foreground font-medium">{o.client}</div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{o.obj}</div>
                  </td>
                  <td className="py-3 pr-3 text-[12px] text-muted-foreground">{o.type}</td>
                  <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{o.sum}</td>
                  <td className="py-3 pr-3">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${o.pct}%` }} />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{o.pct}%</div>
                  </td>
                  <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[o.statusTone]}`}>{o.status}</span></td>
                  <td className="py-3 pr-3 text-[12px] text-muted-foreground whitespace-nowrap">{o.deadline}</td>
                  <td className="py-3 text-[12px] text-muted-foreground">{o.mgr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-xl text-foreground">Заказ {selOrder.id}</h2>
              <p className="text-[11px] text-muted-foreground mt-1">{selOrder.client}</p>
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[selOrder.statusTone]}`}>{selOrder.status}</span>
          </div>

          <div className="mb-5">
            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-muted-foreground">Прогресс выполнения</span>
              <span className="font-bold text-gold">{selOrder.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${selOrder.pct}%` }} />
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {stages.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${s.done ? 'bg-status-ok border-status-ok' : s.active ? 'border-2 border-gold' : 'border-border'}`}>
                  {s.done && <Icon name="Check" size={11} className="text-white" />}
                  {s.active && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </div>
                {i < stages.length - 1 && <div className="absolute ml-2.5 mt-5 w-px h-4 bg-border" />}
                <span className={`text-[13px] ${s.active ? 'text-gold font-semibold' : s.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{s.name}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-[13px] mb-5">
            {[
              ['Объект', selOrder.obj],
              ['Тип мебели', selOrder.type],
              ['Сумма', selOrder.sum],
              ['Срок сдачи', selOrder.deadline],
              ['Менеджер', selOrder.mgr],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground font-medium text-right">{v}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm flex items-center justify-center gap-2">
              <Icon name="Pencil" size={15} /> Редактировать
            </button>
            <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="FileText" size={15} /></button>
            <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="Printer" size={15} /></button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
