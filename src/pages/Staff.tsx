import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';

const staff = [
  { id: 's1', name: 'Иванова Анна Сергеевна', role: 'Менеджер продаж', dept: 'Продажи', phone: '+7 (978) 111-22-33', deals: 18, sum: '2 456 000 ₽', tasks: 12, load: 80, status: 'Активен', initials: 'ИА' },
  { id: 's2', name: 'Петрова Елена Викторовна', role: 'Менеджер продаж', dept: 'Продажи', phone: '+7 (978) 222-33-44', deals: 12, sum: '1 890 000 ₽', tasks: 9, load: 60, status: 'Активен', initials: 'ПЕ' },
  { id: 's3', name: 'Кузнецов Дмитрий Андреевич', role: 'Менеджер продаж', dept: 'Продажи', phone: '+7 (978) 333-44-55', deals: 9, sum: '1 420 000 ₽', tasks: 7, load: 50, status: 'Активен', initials: 'КД' },
  { id: 's4', name: 'Смирнов Павел Александрович', role: 'Замерщик', dept: 'Производство', phone: '+7 (978) 444-55-66', deals: 0, sum: '—', tasks: 5, load: 30, status: 'Активен', initials: 'СП' },
  { id: 's5', name: 'Морозова Валентина Александровна', role: 'Дизайнер', dept: 'Проектирование', phone: '+7 (978) 555-66-77', deals: 0, sum: '—', tasks: 4, load: 25, status: 'Отпуск', initials: 'МВ' },
  { id: 's6', name: 'Артём Кириллов', role: 'Монтажник', dept: 'Монтаж', phone: '+7 (978) 666-77-88', deals: 0, sum: '—', tasks: 6, load: 70, status: 'Активен', initials: 'АК' },
  { id: 's7', name: 'Николай Волков', role: 'Монтажник', dept: 'Монтаж', phone: '+7 (978) 777-88-99', deals: 0, sum: '—', tasks: 4, load: 40, status: 'Активен', initials: 'НВ' },
];

const statusBg: Record<string, string> = { 'Активен': 'bg-status-ok/15 text-status-ok', 'Отпуск': 'bg-status-warn/15 text-status-warn', 'Уволен': 'bg-status-crit/15 text-status-crit' };

const Staff = () => {
  const [sel, setSel] = useState<string | null>('s1');
  const selS = staff.find((s) => s.id === sel);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Layout title="Сотрудники" titleIcon="UserCog" actions={
      <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
        <Icon name="Plus" size={17} /> Добавить сотрудника
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[{ l: 'Всего сотрудников', v: '24' }, { l: 'Активных', v: '21' }, { l: 'В отпуске', v: '2' }, { l: 'Открытых вакансий', v: '3' }].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="font-display font-extrabold text-3xl text-gold">{k.v}</div>
            <div className="text-[12px] text-muted-foreground mt-1">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-secondary">
              <Icon name="Search" size={15} className="text-muted-foreground" />
              <input placeholder="Поиск сотрудника..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary text-[12px] text-muted-foreground">Отдел <Icon name="ChevronDown" size={13} /></button>
          </div>

          <div className="space-y-2">
            {staff.map((s) => (
              <div key={s.id} onClick={() => setSel(s.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${sel === s.id ? 'bg-gold/8 border border-gold/30' : 'bg-secondary hover:bg-muted/80'}`}>
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm shrink-0">{s.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground truncate">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">{s.role} · {s.dept}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-muted-foreground mb-1">Нагрузка</div>
                  <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s.load >= 75 ? 'bg-status-crit' : s.load >= 50 ? 'bg-status-warn' : 'bg-status-ok'}`} style={{ width: `${s.load}%` }} />
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${statusBg[s.status]}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>

        {selS && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-background font-display font-black text-2xl mb-3">{selS.initials}</div>
              <h2 className="font-display font-bold text-base text-foreground">{selS.name}</h2>
              <p className="text-[12px] text-muted-foreground mt-0.5">{selS.role}</p>
              <span className={`text-[11px] px-2 py-1 rounded-md mt-2 ${statusBg[selS.status]}`}>{selS.status}</span>
            </div>

            <div className="space-y-3 text-[13px] mb-5">
              {[
                ['Отдел', selS.dept, 'Building2'],
                ['Телефон', selS.phone, 'Phone'],
                ['Задач', String(selS.tasks), 'CheckSquare'],
                ['Нагрузка', `${selS.load}%`, 'BarChart2'],
                ...(selS.sum !== '—' ? [['Выручка', selS.sum, 'CircleDollarSign'], ['Сделок', String(selS.deals), 'Briefcase']] : []),
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

            <div className="mb-4">
              <div className="text-[11px] text-muted-foreground mb-2">Уровень нагрузки</div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${selS.load >= 75 ? 'bg-status-crit' : selS.load >= 50 ? 'bg-status-warn' : 'bg-status-ok'}`} style={{ width: `${selS.load}%` }} />
              </div>
              <div className="text-right text-[11px] text-muted-foreground mt-1">{selS.load}%</div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm">Редактировать</button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="Phone" size={15} /></button>
              <button className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm"><Icon name="Mail" size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Добавить сотрудника modal ── */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Добавить сотрудника"
        subtitle="Новый член команды"
        icon="UserCog"
        size="md"
        footer={
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
              Добавить сотрудника
            </button>
            <button onClick={() => setShowAdd(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center text-background font-display font-black text-3xl">
                ?
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full gold-gradient flex items-center justify-center shadow-md border-2 border-background">
                <Icon name="Camera" size={14} className="text-background" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Имя', placeholder: 'Иванова', icon: 'User' },
              { label: 'Фамилия', placeholder: 'Анна Сергеевна', icon: 'User' },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{f.label}</label>
                <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                  <Icon name={f.icon} size={15} className="text-gold shrink-0" />
                  <input placeholder={f.placeholder} className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
                </div>
              </div>
            ))}
          </div>
          {[
            { label: 'Должность', placeholder: 'Менеджер продаж', icon: 'Briefcase' },
            { label: 'Телефон', placeholder: '+7 (978) 000-00-00', icon: 'Phone' },
            { label: 'Email', placeholder: 'ivanova@неостандарт.рф', icon: 'Mail' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{f.label}</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name={f.icon} size={15} className="text-gold shrink-0" />
                <input placeholder={f.placeholder} className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
              </div>
            </div>
          ))}
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Отдел</label>
            <div className="flex flex-wrap gap-2">
              {['Продажи', 'Производство', 'Проектирование', 'Монтаж', 'Логистика', 'Снабжение'].map((d, i) => (
                <button key={d} className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${i === 0 ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Роль в системе</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Менеджер', i: 'Users' },
                { l: 'Администратор', i: 'Shield' },
                { l: 'Только просмотр', i: 'Eye' },
              ].map((r, i) => (
                <button key={r.l} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11px] transition-all ${i === 0 ? 'border-gold/40 bg-gold/8 text-gold' : 'border-border bg-secondary text-muted-foreground hover:border-gold/25'}`}>
                  <Icon name={r.i} size={16} /> {r.l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Staff;