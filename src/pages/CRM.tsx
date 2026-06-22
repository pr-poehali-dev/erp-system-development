import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';

const tabs = ['Канбан', 'Список', 'Мои сделки', 'Аналитика'];

type Deal = {
  id: string; client: string; obj: string; sum: string; mgr: string; mgrInitials: string;
  days: number; tag?: string; tagTone?: string; overdue?: boolean; task?: string;
};
type Column = { id: string; title: string; count: number; sum: string; color: string; deals: Deal[] };

const columns: Column[] = [
  {
    id: 'lead', title: 'Новый лид', count: 8, sum: '—', color: 'hsl(199 60% 50%)',
    deals: [
      { id: 'd1', client: 'Виктория Морозова', obj: 'Квартира, Симферополь', sum: '—', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 0, tag: 'Сегодня', tagTone: 'info' },
      { id: 'd2', client: 'Антон Гусев', obj: 'Дом, Симферополь', sum: '—', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 1, task: 'Перезвонить' },
      { id: 'd3', client: 'Юлия Белова', obj: 'Офис, Симферополь', sum: '—', mgr: 'Смирнов П.А.', mgrInitials: 'СП', days: 2 },
    ],
  },
  {
    id: 'contact', title: 'Первый контакт', count: 6, sum: '3 240 000 ₽', color: 'hsl(280 40% 55%)',
    deals: [
      { id: 'd4', client: 'Дмитрий Орлов', obj: 'Квартира, Симферополь', sum: '850 000 ₽', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', days: 2, task: 'Назначить замер' },
      { id: 'd5', client: 'Светлана Крылова', obj: 'Дом, Симферополь', sum: '1 200 000 ₽', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 3 },
      { id: 'd6', client: 'Роман Фёдоров', obj: 'Квартира, Симферополь', sum: '780 000 ₽', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 1 },
    ],
  },
  {
    id: 'measure', title: 'Замер назначен', count: 5, sum: '5 890 000 ₽', color: 'hsl(150 45% 45%)',
    deals: [
      { id: 'd7', client: 'Мария Петрова', obj: 'Квартира, ЖК «Парковый», Симферополь', sum: '1 245 000 ₽', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 3, tag: '23 июн', tagTone: 'ok' },
      { id: 'd8', client: 'Наталья Соколова', obj: 'Дом, Симферополь', sum: '2 100 000 ₽', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 4 },
      { id: 'd9', client: 'Игорь Волков', obj: 'Офис, БЦ «Центральный», Симферополь', sum: '980 000 ₽', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', days: 5, task: 'Подготовить ТЗ' },
    ],
  },
  {
    id: 'kp', title: 'КП отправлено', count: 7, sum: '9 320 000 ₽', color: 'hsl(40 60% 55%)',
    deals: [
      { id: 'd10', client: 'Алексей Смирнов', obj: 'Квартира, ЖК «Фили Сити», Симферополь', sum: '950 000 ₽', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 5, tag: 'КП-1246', tagTone: 'gold' },
      { id: 'd11', client: 'Ольга Кузнецова', obj: 'Дом, Симферополь', sum: '2 460 000 ₽', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', days: 7, overdue: true, task: 'Напомнить' },
      { id: 'd12', client: 'Максим Фролов', obj: 'Квартира, Симферополь', sum: '675 000 ₽', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 6 },
    ],
  },
  {
    id: 'agree', title: 'Согласование', count: 4, sum: '5 640 000 ₽', color: 'hsl(35 65% 52%)',
    deals: [
      { id: 'd13', client: 'Виктор Гаврилов', obj: 'Пентхаус, Симферополь', sum: '3 200 000 ₽', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 8, tag: 'Высокий приоритет', tagTone: 'crit' },
      { id: 'd14', client: 'Екатерина Лебедева', obj: 'Квартира, Симферополь', sum: '420 000 ₽', mgr: 'Смирнов П.А.', mgrInitials: 'СП', days: 6 },
    ],
  },
  {
    id: 'prepay', title: 'Предоплата', count: 3, sum: '4 215 000 ₽', color: 'hsl(28 70% 50%)',
    deals: [
      { id: 'd15', client: 'Сергей Павлов', obj: 'Коттедж, Симферополь', sum: '2 100 000 ₽', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 10, tag: 'В производстве', tagTone: 'ok' },
      { id: 'd16', client: 'Анна Козлова', obj: 'Квартира, Симферополь', sum: '1 380 000 ₽', mgr: 'Иванова А.С.', mgrInitials: 'ИА', days: 9 },
    ],
  },
  {
    id: 'done', title: 'Закрыто / Выиграно', count: 12, sum: '14 890 000 ₽', color: 'hsl(150 50% 45%)',
    deals: [
      { id: 'd17', client: 'Владимир Соколов', obj: 'Дом, Симферополь', sum: '2 800 000 ₽', mgr: 'Кузнецов Д.А.', mgrInitials: 'КД', days: 14, tag: 'Закрыто', tagTone: 'ok' },
      { id: 'd18', client: 'Ирина Новикова', obj: 'Квартира, Симферополь', sum: '980 000 ₽', mgr: 'Петрова Е.В.', mgrInitials: 'ПЕ', days: 12 },
    ],
  },
];

const detailDeal = {
  id: '№1258', client: 'Мария Петрова', phone: '+7 (978) 123-45-67', email: 'maria.petrova@mail.ru',
  obj: 'Квартира, ЖК «Парковый», Симферополь', type: 'Кухня и остров', budget: '1 245 000 ₽',
  mgr: 'Иванова А.С.', source: 'Instagram', created: '20.06.2026', deadline: '21.07.2026',
  stage: 'Замер назначен', comment: 'Хочет минималистичную кухню с островом и встроенной техникой. Любимые цвета: серый, дерево.',
  tasks: [
    { text: 'Замер — 23 июн 10:00', done: false, tone: 'warn' },
    { text: 'Подготовить КП после замера', done: false },
    { text: 'Отправить портфолио', done: true },
    { text: 'Первый звонок', done: true },
  ],
  history: [
    { date: '22.06.2026 14:20', text: 'Назначен замер на 23 июня 10:00', who: 'Иванова А.С.' },
    { date: '21.06.2026 11:00', text: 'Отправлено портфолио на email', who: 'Иванова А.С.' },
    { date: '20.06.2026 09:30', text: 'Сделка создана', who: 'Система' },
  ],
};

const tagBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  gold: 'bg-gold/15 text-gold',
};

const DealCard = ({ deal, onClick, isSelected }: { deal: Deal; onClick: () => void; isSelected: boolean }) => (
  <div
    onClick={onClick}
    className={`rounded-xl p-3.5 mb-2 cursor-pointer transition-all border ${isSelected ? 'border-gold/50 bg-gold/8' : 'border-border bg-secondary hover:border-gold/30 hover:bg-secondary/80'}`}
  >
    <div className="font-semibold text-[13px] text-foreground mb-1">{deal.client}</div>
    <div className="text-[11px] text-muted-foreground mb-2 truncate">{deal.obj}</div>
    {deal.sum !== '—' && <div className="text-[13px] font-display font-bold text-gold mb-2">{deal.sum}</div>}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[9px] font-bold text-gold">{deal.mgrInitials}</div>
        <span className="text-[11px] text-muted-foreground">{deal.days}д</span>
      </div>
      <div className="flex items-center gap-1">
        {deal.tag && <span className={`text-[10px] px-1.5 py-0.5 rounded ${tagBg[deal.tagTone || 'ok']}`}>{deal.tag}</span>}
        {deal.task && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{deal.task}</span>}
        {deal.overdue && <Icon name="Clock" size={13} className="text-status-crit" />}
      </div>
    </div>
  </div>
);

const CRM = () => {
  const { success, info } = useToast();
  const [activeTab, setActiveTab] = useState('Канбан');
  const [selectedDeal, setSelectedDeal] = useState<string | null>('d7');
  const [showDetail, setShowDetail] = useState(true);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const allDeals = columns.flatMap((c) => c.deals);
  const selDeal = allDeals.find((d) => d.id === selectedDeal);

  return (
    <Layout
      title="CRM / Сделки"
      titleIcon="Users"
      actions={
        <>
          <button onClick={() => setShowNewDeal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
            <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Новая сделка</span>
          </button>
          <button onClick={() => setShowFilter(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all">
            <Icon name="SlidersHorizontal" size={15} /> <span className="hidden lg:inline">Фильтры</span>
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground pb-1">
          <span>Всего: <b className="text-foreground">45</b> сделок</span>
          <span>•</span>
          <span>На сумму: <b className="text-gold">42 195 000 ₽</b></span>
        </div>
      </div>

      <div className={`grid gap-5 ${showDetail ? 'grid-cols-1 xl:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
        {/* Kanban board */}
        <div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3">
            {columns.map((col) => (
              <div key={col.id} className="shrink-0 w-[220px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color }} />
                  <span className="text-[12px] font-semibold text-foreground">{col.title}</span>
                  <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{col.count}</span>
                </div>
                {col.sum !== '—' && <div className="text-[11px] text-muted-foreground px-1 mb-2">{col.sum}</div>}
                <div className="space-y-1">
                  {col.deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onClick={() => { setSelectedDeal(deal.id); setShowDetail(true); }}
                      isSelected={selectedDeal === deal.id}
                    />
                  ))}
                </div>
                <button className="w-full mt-2 py-2 rounded-xl border border-dashed border-border text-[12px] text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors flex items-center justify-center gap-1">
                  <Icon name="Plus" size={13} /> Добавить
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Deal detail */}
        {showDetail && selDeal && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-extrabold text-lg text-foreground">Сделка {detailDeal.id}</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-status-ok/15 text-status-ok">{detailDeal.stage}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Создана {detailDeal.created}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
                <Icon name="X" size={14} />
              </button>
            </div>

            {/* Tabs inside */}
            <div className="flex gap-3 border-b border-border mb-4 text-[12px]">
              {['Информация', 'Задачи', 'История'].map((t) => (
                <button key={t} className="pb-2 text-gold border-b-2 border-gold font-medium first:border-b-2 [&:not(:first-child)]:border-transparent [&:not(:first-child)]:text-muted-foreground">{t}</button>
              ))}
            </div>

            <div className="space-y-3 text-[13px]">
              {[
                ['Клиент', detailDeal.client],
                ['Телефон', detailDeal.phone],
                ['Email', detailDeal.email],
                ['Объект', detailDeal.obj],
                ['Тип мебели', detailDeal.type],
                ['Бюджет', detailDeal.budget],
                ['Менеджер', detailDeal.mgr],
                ['Источник', detailDeal.source],
                ['Срок', detailDeal.deadline],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="text-muted-foreground w-24 shrink-0">{l}</span>
                  <span className="text-foreground font-medium">{v}</span>
                </div>
              ))}

              <div className="pt-2">
                <div className="text-muted-foreground mb-1">Комментарий</div>
                <div className="text-foreground text-[12px] bg-secondary rounded-xl p-3 leading-relaxed">{detailDeal.comment}</div>
              </div>

              <div className="pt-1">
                <div className="text-muted-foreground mb-2">Задачи</div>
                <div className="space-y-2">
                  {detailDeal.tasks.map((t) => (
                    <div key={t.text} className={`flex items-center gap-2.5 text-[12px] ${t.done ? 'opacity-50' : ''}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${t.done ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                        {t.done && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      <span className={t.done ? 'line-through text-muted-foreground' : t.tone === 'warn' ? 'text-status-warn font-medium' : 'text-foreground'}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <div className="text-muted-foreground mb-2">История</div>
                <div className="space-y-2.5">
                  {detailDeal.history.map((h) => (
                    <div key={h.date} className="flex gap-3">
                      <div className="w-1 rounded-full bg-gold/30 shrink-0" />
                      <div>
                        <div className="text-[11px] text-muted-foreground">{h.date} · {h.who}</div>
                        <div className="text-[12px] text-foreground">{h.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-border">
              <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm flex items-center justify-center gap-2">
                <Icon name="Pencil" size={15} /> Редактировать
              </button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
                <Icon name="Phone" size={15} />
              </button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
                <Icon name="FileText" size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Конверсия в замер', value: '62%', delta: '+4%', icon: 'TrendingUp', tone: 'ok' },
          { label: 'Средний чек', value: '938 000 ₽', delta: '+12%', icon: 'CircleDollarSign', tone: 'gold' },
          { label: 'Средний цикл', value: '18 дней', delta: '-2 дня', icon: 'Clock', tone: 'ok' },
          { label: 'Просроченных', value: '3', delta: 'Требуют внимания', icon: 'AlertCircle', tone: 'crit' },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <Icon name={s.icon} size={16} className={s.tone === 'crit' ? 'text-status-crit' : s.tone === 'ok' ? 'text-status-ok' : 'text-gold'} />
            </div>
            <div className="font-display font-extrabold text-2xl text-foreground">{s.value}</div>
            <div className={`text-xs mt-1 ${s.tone === 'crit' ? 'text-status-crit' : 'text-status-ok'}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* ── Новая сделка modal ── */}
      <Modal
        open={showNewDeal}
        onClose={() => setShowNewDeal(false)}
        title="Новая сделка"
        subtitle="Добавить лид в воронку продаж"
        icon="UserPlus"
        size="md"
        footer={
          <div className="flex gap-3">
            <button onClick={() => { setShowNewDeal(false); success('Сделка создана', 'Лид добавлен в воронку продаж'); }} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
              Создать сделку
            </button>
            <button onClick={() => setShowNewDeal(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Имя клиента', placeholder: 'Иванова Мария А.', icon: 'User', full: true },
              { label: 'Телефон', placeholder: '+7 (978) 000-00-00', icon: 'Phone' },
              { label: 'Email', placeholder: 'client@mail.ru', icon: 'Mail' },
            ].map((f) => (
              <div key={f.label} className={f.full ? 'col-span-2' : ''}>
                <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{f.label}</label>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                  <Icon name={f.icon} size={15} className="text-gold shrink-0" />
                  <input placeholder={f.placeholder} className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Тип мебели</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Sofa" size={15} className="text-gold shrink-0" />
                <input placeholder="Кухня, гостиная..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Источник</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Share2" size={15} className="text-gold shrink-0" />
                <input placeholder="Instagram, ВК..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Объект / Адрес</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="MapPin" size={15} className="text-gold shrink-0" />
              <input placeholder="Симферополь, ЖК «Парковый», кв. 45" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Менеджер</label>
            <div className="flex gap-2">
              {['Иванова А.С.', 'Петрова Е.В.', 'Кузнецов Д.А.', 'Смирнов П.А.'].map((m) => (
                <button key={m} className="flex-1 py-2 rounded-lg bg-secondary border border-border text-[11px] text-muted-foreground hover:border-gold/40 hover:text-gold transition-all">{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea placeholder="Что хочет клиент, пожелания по стилю..." rows={3}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
        </div>
      </Modal>

      {/* ── Фильтры modal ── */}
      <Modal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Фильтры сделок"
        icon="SlidersHorizontal"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => { setShowFilter(false); info('Фильтры применены'); }} className="flex-1 py-3 rounded-xl gold-gradient text-background font-semibold text-sm">Применить</button>
            <button onClick={() => setShowFilter(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Сбросить</button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          {[
            { label: 'Менеджер', options: ['Все', 'Иванова А.С.', 'Петрова Е.В.', 'Кузнецов Д.А.'] },
            { label: 'Этап воронки', options: ['Все', 'Новый лид', 'Первый контакт', 'Замер назначен', 'КП отправлено'] },
            { label: 'Компания', options: ['Все', 'Территория Мебели', 'Контур+'] },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-muted-foreground mb-2 block font-medium">{f.label}</label>
              <div className="flex flex-wrap gap-2">
                {f.options.map((opt, i) => (
                  <button key={opt} className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${i === 0 ? 'gold-gradient text-background font-semibold' : 'bg-secondary border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Сумма сделки</label>
            <div className="flex items-center gap-3">
              <input placeholder="от" className="flex-1 px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 transition-colors text-foreground placeholder:text-muted-foreground/50" />
              <span className="text-muted-foreground">—</span>
              <input placeholder="до" className="flex-1 px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 transition-colors text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default CRM;