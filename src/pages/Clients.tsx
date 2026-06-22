import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const clients = [
  { id: 'c1', name: 'Мария Петрова', phone: '+7 (978) 123-45-67', email: 'petrova@mail.ru', obj: 'Квартира, ЖК «Парковый»', segment: 'Премиум', mgr: 'Иванова А.С.', deals: 2, sum: '3 100 000 ₽', status: 'Активный', statusTone: 'ok', initials: 'МП' },
  { id: 'c2', name: 'Алексей Смирнов', phone: '+7 (978) 234-56-78', email: 'smirnov@mail.ru', obj: 'Квартира, ЖК «Центральный»', segment: 'Стандарт', mgr: 'Петрова Е.В.', deals: 1, sum: '950 000 ₽', status: 'Активный', statusTone: 'ok', initials: 'АС' },
  { id: 'c3', name: 'Ольга Кузнецова', phone: '+7 (978) 345-67-89', email: 'kuznetsova@mail.ru', obj: 'Дом, Симферопольский р-н', segment: 'Премиум', mgr: 'Кузнецов Д.А.', deals: 3, sum: '5 240 000 ₽', status: 'VIP', statusTone: 'gold', initials: 'ОК' },
  { id: 'c4', name: 'Игорь Волков', phone: '+7 (978) 456-78-90', email: 'volkov@mail.ru', obj: 'Офис, БЦ «Крымский»', segment: 'Бизнес', mgr: 'Иванова А.С.', deals: 1, sum: '1 130 000 ₽', status: 'Активный', statusTone: 'ok', initials: 'ИВ' },
  { id: 'c5', name: 'Дмитрий Орлов', phone: '+7 (978) 567-89-01', email: 'orlov@mail.ru', obj: 'Квартира, ЖК «Крымская Ривьера»', segment: 'Стандарт', mgr: 'Кузнецов Д.А.', deals: 1, sum: '680 000 ₽', status: 'Перенесён', statusTone: 'warn', initials: 'ДО' },
  { id: 'c6', name: 'Наталья Соколова', phone: '+7 (978) 678-90-12', email: 'sokolova@mail.ru', obj: 'Дом, Симферополь', segment: 'Премиум', mgr: 'Иванова А.С.', deals: 2, sum: '2 800 000 ₽', status: 'Активный', statusTone: 'ok', initials: 'НС' },
  { id: 'c7', name: 'Максим Фролов', phone: '+7 (978) 789-01-23', email: 'frolov@mail.ru', obj: 'Квартира, ЖК «Сердце Крыма»', segment: 'Стандарт', mgr: 'Петрова Е.В.', deals: 1, sum: '675 000 ₽', status: 'Активный', statusTone: 'ok', initials: 'МФ' },
  { id: 'c8', name: 'Антон Гусев', phone: '+7 (978) 890-12-34', email: 'gusev@mail.ru', obj: 'Квартира, ЖК «Lucky»', segment: 'Стандарт', mgr: 'Иванова А.С.', deals: 1, sum: '520 000 ₽', status: 'Отменён', statusTone: 'crit', initials: 'АГ' },
];

const [selected, setSelected] = [null as null | string, () => {}];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  gold: 'bg-gold/15 text-gold',
};

const segmentBg: Record<string, string> = {
  'Премиум': 'bg-gold/10 text-gold',
  'Бизнес': 'bg-[hsl(199_60%_50%)]/10 text-[hsl(199_60%_60%)]',
  'Стандарт': 'bg-muted text-muted-foreground',
  'VIP': 'bg-[hsl(280_40%_55%)]/10 text-[hsl(280_45%_70%)]',
};

const Clients = () => {
  const [sel, setSel] = useState<string | null>('c1');
  const selClient = clients.find((c) => c.id === sel);

  return (
    <Layout
      title="Клиенты"
      titleIcon="Contact"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
            <Icon name="Plus" size={17} /> Новый клиент
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="Download" size={16} /> Экспорт
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[{ label: 'Всего клиентов', value: '186', icon: 'Users', c: 'gold' }, { label: 'Активные', value: '142', icon: 'UserCheck', c: 'ok' }, { label: 'VIP клиенты', value: '24', icon: 'Star', c: 'gold' }, { label: 'Новые за месяц', value: '18', icon: 'UserPlus', c: 'ok' }].map((k) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <Icon name={k.icon} size={16} className={k.c === 'ok' ? 'text-status-ok' : 'text-gold'} />
            </div>
            <div className="font-display font-extrabold text-3xl text-foreground">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-secondary">
              <Icon name="Search" size={15} className="text-muted-foreground" />
              <input placeholder="Поиск по имени, телефону, email..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            {['Сегмент', 'Менеджер', 'Статус'].map((f) => (
              <button key={f} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-[12px] text-muted-foreground">
                {f} <Icon name="ChevronDown" size={13} />
              </button>
            ))}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                <th className="font-medium pb-2 pr-3">Клиент</th>
                <th className="font-medium pb-2 pr-3">Контакты</th>
                <th className="font-medium pb-2 pr-3">Сегмент</th>
                <th className="font-medium pb-2 pr-3">Сделки</th>
                <th className="font-medium pb-2 pr-3">Сумма</th>
                <th className="font-medium pb-2 pr-3">Менеджер</th>
                <th className="font-medium pb-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} onClick={() => setSel(c.id)} className={`border-b border-border/40 cursor-pointer transition-colors ${sel === c.id ? 'bg-gold/8' : 'hover:bg-muted/30'}`}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-[11px] font-bold text-gold shrink-0">{c.initials}</div>
                      <div>
                        <div className="font-semibold text-foreground text-[13px]">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{c.obj}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="text-[12px] text-foreground">{c.phone}</div>
                    <div className="text-[11px] text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md ${segmentBg[c.segment]}`}>{c.segment}</span></td>
                  <td className="py-3 pr-3 text-center font-semibold text-foreground">{c.deals}</td>
                  <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{c.sum}</td>
                  <td className="py-3 pr-3 text-[12px] text-muted-foreground">{c.mgr}</td>
                  <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[c.statusTone]}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selClient && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-background font-display font-black text-2xl mb-3">{selClient.initials}</div>
              <h2 className="font-display font-bold text-lg text-foreground">{selClient.name}</h2>
              <span className={`text-[11px] px-2 py-1 rounded-md mt-1 ${segmentBg[selClient.segment]}`}>{selClient.segment}</span>
            </div>
            <div className="space-y-3 text-[13px] mb-5">
              {[
                ['Телефон', selClient.phone, 'Phone'],
                ['Email', selClient.email, 'Mail'],
                ['Объект', selClient.obj, 'Home'],
                ['Менеджер', selClient.mgr, 'UserCircle'],
                ['Сделок', String(selClient.deals), 'Briefcase'],
                ['Общая сумма', selClient.sum, 'CircleDollarSign'],
              ].map(([l, v, ic]) => (
                <div key={l} className="flex items-center gap-3">
                  <Icon name={ic} size={15} className="text-gold shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="text-foreground font-medium">{v}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm">Открыть профиль</button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="Phone" size={15} /></button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="Mail" size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Clients;
