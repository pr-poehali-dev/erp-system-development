import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const tabs = ['Все замеры', 'Первичные', 'Контрольные', 'Назначенные', 'Выполненные', 'Перенесенные', 'Отмененные'];

const kpis = [
  { label: 'Сегодня', value: '12', icon: 'CalendarCheck', c: 'ok' },
  { label: 'На этой неделе', value: '28', icon: 'Calendar', c: 'gold' },
  { label: 'Назначены', value: '6', icon: 'Clock', c: 'warn' },
  { label: 'Выполнены', value: '20', icon: 'CheckCircle', c: 'ok' },
  { label: 'Перенесены', value: '2', icon: 'RefreshCw', c: 'warn' },
  { label: 'Отменены', value: '1', icon: 'XCircle', c: 'crit' },
];

type Meas = {
  date: string; time: string; client: string; type: string; obj: string; addr: string;
  measType: 'Первичный' | 'Контрольный'; mgr: string; mgrInitials: string;
  status: string; statusTone: string; company: string; id: string;
};

const measurements: Meas[] = [
  { id: 'Z-1258', date: '23.06.2026', time: '10:00', client: 'Мария Петрова', type: 'Квартира', obj: 'ЖК «Парковый», Симферополь', addr: 'ул. Набережная, 9, кв. 45', measType: 'Первичный', mgr: 'Иванова А.С.', mgrInitials: 'ИА', status: 'Выполнен', statusTone: 'ok', company: 'ТМ' },
  { id: 'Z-1259', date: '23.06.2026', time: '15:00', client: 'Алексей Смирнов', type: 'Квартира', obj: 'ЖК «Центральный», Симферополь', addr: 'ул. Багратионовская, 5', measType: 'Первичный', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', status: 'Назначен', statusTone: 'warn', company: 'ТМ' },
  { id: 'Z-1260', date: '24.06.2026', time: '11:30', client: 'Ольга Кузнецова', type: 'Дом', obj: 'Симферопольский р-н', addr: 'ул. Рублевская, 12', measType: 'Первичный', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', status: 'Подтверждён', statusTone: 'info', company: 'ТМ' },
  { id: 'Z-1261', date: '24.06.2026', time: '16:00', client: 'Игорь Волков', type: 'Офис', obj: 'БЦ «Крымский», Симферополь', addr: 'Башня «Империя», 12 эт.', measType: 'Контрольный', mgr: 'Иванова А.С.', mgrInitials: 'ИА', status: 'Назначен', statusTone: 'warn', company: 'ТМ' },
  { id: 'Z-1262', date: '25.06.2026', time: '09:30', client: 'Дмитрий Орлов', type: 'Квартира', obj: 'ЖК «Крымская Ривьера»', addr: 'пр-т Победы, 37', measType: 'Первичный', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', status: 'Перенесён', statusTone: 'warn', company: 'ТМ' },
  { id: 'Z-1263', date: '25.06.2026', time: '14:30', client: 'Наталья Соколова', type: 'Дом', obj: 'Симферопольский р-н', addr: 'ул. Новикова, 25', measType: 'Первичный', mgr: 'Иванова А.С.', mgrInitials: 'ИА', status: 'Выполнен', statusTone: 'ok', company: 'ТМ' },
  { id: 'Z-1264', date: '26.06.2026', time: '12:00', client: 'Максим Фролов', type: 'Квартира', obj: 'ЖК «Сердце Крыма»', addr: 'наб. Салгирная, 34к2', measType: 'Контрольный', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', status: 'Выполнен', statusTone: 'ok', company: 'ТМ' },
  { id: 'Z-1265', date: '27.06.2026', time: '13:00', client: 'Антон Гусев', type: 'Квартира', obj: 'ЖК «Lucky», Симферополь', addr: 'ул. 2-я Звенигородская, 12', measType: 'Первичный', mgr: 'Иванова А.С.', mgrInitials: 'ИА', status: 'Отменён', statusTone: 'crit', company: 'ТМ' },
];

const detailMeas = measurements[0];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
};
const kpiColor: Record<string, string> = { ok: 'text-status-ok', gold: 'text-gold', warn: 'text-status-warn', crit: 'text-status-crit' };

const calDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const calDates = [
  [null, null, null, null, null, null, 1],
  [2, 3, 4, 5, 6, 7, 8],
  [9, 10, 11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20, 21, 22],
  [23, 24, 25, 26, 27, 28, 29],
  [30, null, null, null, null, null, null],
];
const hasMeas = [23, 24, 25, 26, 27];

const Measurements = () => {
  const [activeTab, setActiveTab] = useState('Все замеры');
  const [selected, setSelected] = useState('Z-1258');
  const sel = measurements.find((m) => m.id === selected) || detailMeas;

  return (
    <Layout
      title="Замеры"
      titleIcon="Ruler"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={17} /> Новый замер
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="Download" size={16} /> Экспорт
          </button>
        </>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {kpis.map((k, i) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 text-center" style={{ animationDelay: `${i * 50}ms` }}>
            <Icon name={k.icon} size={18} className={`mx-auto mb-1 ${kpiColor[k.c]}`} />
            <div className={`font-display font-extrabold text-2xl ${kpiColor[k.c]}`}>{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        {/* Table */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-secondary">
                <Icon name="Search" size={15} className="text-muted-foreground" />
                <input placeholder="Поиск по клиенту, адресу, объекту..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
              </div>
              {['Тип замера', 'Менеджер', 'Статус', 'Дата', 'Компания'].map((f) => (
                <button key={f} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-[12px] text-muted-foreground hover:text-foreground">
                  {f} <Icon name="ChevronDown" size={13} />
                </button>
              ))}
              <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-[12px] text-gold">
                <Icon name="SlidersHorizontal" size={13} /> Фильтры
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                    <th className="font-medium pb-2 pr-3">Дата и время</th>
                    <th className="font-medium pb-2 pr-3">Клиент / Объект</th>
                    <th className="font-medium pb-2 pr-3">Тип замера</th>
                    <th className="font-medium pb-2 pr-3">Менеджер</th>
                    <th className="font-medium pb-2 pr-3">Статус</th>
                    <th className="font-medium pb-2 pr-2">Компания</th>
                    <th className="font-medium pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m) => (
                    <tr key={m.id} onClick={() => setSelected(m.id)} className={`border-b border-border/40 cursor-pointer transition-colors ${selected === m.id ? 'bg-gold/8' : 'hover:bg-muted/30'}`}>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-foreground">{m.date}</div>
                        <div className="text-[11px] text-muted-foreground">{m.time}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="text-foreground font-medium">{m.client}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{m.type} · <span className="text-gold/80 underline cursor-pointer">{m.addr}</span></div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-[11px] px-2 py-1 rounded-md ${m.measType === 'Контрольный' ? 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]' : 'bg-muted text-muted-foreground'}`}>{m.measType}</span>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center text-[9px] font-bold text-gold shrink-0">{m.mgrInitials}</div>
                          <span className="text-[12px] text-foreground">{m.mgr}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[m.statusTone]}`}>{m.status}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <div className="w-7 h-7 rounded-lg bg-gold/12 flex items-center justify-center text-[10px] font-bold text-gold">{m.company}</div>
                      </td>
                      <td className="py-3">
                        <button className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-muted"><Icon name="MoreVertical" size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-muted-foreground text-xs">Всего записей: 28</span>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronLeft" size={13} /></button>
                {[1, 2, 3].map((n) => (
                  <button key={n} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${n === 1 ? 'gold-gradient text-background font-semibold' : 'bg-secondary text-muted-foreground'}`}>{n}</button>
                ))}
                <span className="text-muted-foreground px-1">...</span>
                <button className="w-7 h-7 rounded-lg bg-secondary text-xs text-muted-foreground flex items-center justify-center">3</button>
                <button className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronRight" size={13} /></button>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
              <h3 className="font-display font-bold text-sm mb-3">Карта замеров на сегодня</h3>
              <div className="rounded-xl overflow-hidden bg-[hsl(199_30%_15%)] h-44 relative">
                <iframe
                  src="https://yandex.ru/map-widget/v1/?ll=34.0960,44.9527&z=12&l=map&pt=34.0960,44.9527,pmgnl~34.1060,44.9427,pmrdl~34.0860,44.9627,pmrdl~34.1100,44.9500,pmbll"
                  width="100%" height="100%" frameBorder="0" allowFullScreen
                  className="opacity-90"
                  title="Карта замеров Симферополь"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warn" />Назначены</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-ok" />Выполнены</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(28_70%_50%)]" />Перенесены</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(280_40%_55%)]" />Контрольные</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">Календарь замеров</h3>
                <div className="flex items-center gap-2">
                  <button className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronLeft" size={13} /></button>
                  <span className="text-[12px] font-medium">Июнь 2026</span>
                  <button className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronRight" size={13} /></button>
                  <button className="text-[11px] px-2 py-1 rounded-lg bg-gold/15 text-gold">Сегодня</button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                {calDays.map((d) => <div key={d} className="text-muted-foreground pb-1 font-medium">{d}</div>)}
                {calDates.flat().map((d, i) => (
                  <div key={i} className={`h-8 flex items-center justify-center rounded-lg text-[12px] relative cursor-pointer transition-colors ${!d ? '' : hasMeas.includes(d) ? (d === 23 ? 'gold-gradient text-background font-bold' : 'bg-gold/12 text-gold font-medium hover:bg-gold/20') : 'hover:bg-muted text-muted-foreground'}`}>
                    {d || ''}
                    {d && hasMeas.includes(d) && d !== 23 && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warn inline-block" />Назначены (6)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-ok inline-block" />Выполнены (12)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[hsl(280_40%_55%)] inline-block" />Контрольные (4)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-warn/60 inline-block" />Перенесены (2)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]" style={{ animationDelay: '80ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground">Замер №{sel.id}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Icon name="Calendar" size={13} className="text-gold" />
                <span className="text-[11px] text-muted-foreground">{sel.date} в {sel.time}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{sel.measType} замер</span>
              </div>
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[sel.statusTone]}`}>{sel.status}</span>
          </div>

          <div className="flex gap-3 border-b border-border mb-4 text-[12px]">
            {['Информация', 'Результаты', 'Чек-лист', 'Файлы', 'История'].map((t, i) => (
              <button key={t} className={`pb-2 ${i === 0 ? 'text-gold border-b-2 border-gold font-medium' : 'text-muted-foreground'}`}>{t}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Клиент</div>
              <div className="text-[13px] font-semibold text-foreground">{sel.client}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Объект</div>
              <div className="text-[13px] text-foreground">{sel.type}</div>
            </div>
            <div className="col-span-2">
              <div className="text-[11px] text-muted-foreground mb-1">Адрес</div>
              <div className="text-[13px] text-foreground">{sel.obj}, {sel.addr}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Тип мебели</div>
              <div className="text-[13px] text-foreground">Кухня и остров</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-1">Менеджер</div>
              <div className="text-[13px] text-foreground">{sel.mgr}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[11px] text-muted-foreground mb-2">Контакты клиента</div>
            <div className="flex items-center gap-2 text-[12px] text-foreground mb-1">
              <Icon name="Phone" size={13} className="text-gold" /> +7 (978) 123-45-67
            </div>
            <div className="flex items-center gap-2 text-[12px] text-foreground">
              <Icon name="Mail" size={13} className="text-gold" /> maria.petrova@mail.ru
            </div>
          </div>

          <div className="mb-4">
            <div className="text-[11px] text-muted-foreground mb-2">Комментарий клиента</div>
            <div className="bg-secondary rounded-xl p-3 text-[12px] text-foreground leading-relaxed">
              Хочет минималистичную кухню с островом и встроенной техникой. Любимые цвета: серый, дерево.
            </div>
          </div>

          {/* Фото */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-muted-foreground">Фото с объекта</div>
              <button className="text-[11px] text-gold">Все фото (18)</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-lg overflow-hidden bg-secondary h-16 flex items-center justify-center">
                  <Icon name="Image" size={20} className="text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </div>

          {/* Файлы */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-muted-foreground">Файлы</div>
              <button className="text-[11px] text-gold">Все файлы (6)</button>
            </div>
            <div className="space-y-1.5">
              {[
                { name: 'План помещения.pdf', size: '1.2 МБ', date: '23.06.2026', icon: 'FileText', c: 'text-status-crit' },
                { name: 'Фото_кухня.jpg', size: '4.3 МБ', date: '23.06.2026', icon: 'Image', c: 'text-status-ok' },
                { name: 'Замеры помещения.xlsx', size: '330 КБ', date: '23.06.2026', icon: 'FileSpreadsheet', c: 'text-status-ok' },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-2.5 p-2 rounded-lg bg-secondary hover:bg-muted transition-colors cursor-pointer">
                  <Icon name={f.icon} size={16} className={f.c} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-foreground truncate">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{f.date} · {f.size}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm flex items-center justify-center gap-2">
              <Icon name="Pencil" size={15} /> Редактировать
            </button>
            <button className="flex-1 py-2.5 rounded-xl border border-border bg-secondary text-sm font-medium text-foreground hover:border-gold/30 transition-colors flex items-center justify-center gap-2">
              <Icon name="ClipboardCheck" size={15} /> Создать контрольный замер
            </button>
          </div>
          <button className="w-full mt-2 py-2.5 rounded-xl border border-status-crit/30 text-status-crit text-sm hover:bg-status-crit/10 transition-colors">
            Отменить замер
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Measurements;
