import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const HERO_IMG = 'https://cdn.poehali.dev/projects/eef01eb5-7830-4400-a486-64829cb2d730/files/731403e6-0aba-4e1a-8599-1dee4329e054.jpg';

const tabs = ['Все КП', 'Черновики', 'Отправленные', 'Согласуются', 'Принятые', 'Отклоненные', 'Требуют правки'];

const proposals = [
  { id: 'КП-1258', ver: 'версия 2', client: 'Мария Петрова', deal: 'Сделка №1258', item: 'Кухня и остров', company: 'ТМ', sum: '1 850 000 ₽', status: 'Согласуется', tone: 'warn', date: '23.06.2026 14:20', mgr: 'Иванова А.С.' },
  { id: 'КП-1246', ver: 'версия 1', client: 'Алексей Смирнов', deal: 'Сделка №1261', item: 'Гостиная и ТВ-зона', company: 'ТМ', sum: '950 000 ₽', status: 'Отправлено', tone: 'info', date: '22.06.2026 16:30', mgr: 'Иванова А.С.' },
  { id: 'КП-1241', ver: 'версия 1', client: 'Наталья Соколова', deal: 'Сделка №1262', item: 'Кухня классика', company: 'ТМ', sum: '1 280 000 ₽', status: 'Черновик', tone: 'muted', date: '22.06.2026 11:20', mgr: 'Смирнов Д.А.' },
  { id: 'КП-1235', ver: 'версия 3', client: 'Игорь Волков', deal: 'Сделка №1263', item: 'Прихожая', company: 'ТМ', sum: '380 000 ₽', status: 'Принято', tone: 'ok', date: '21.06.2026 17:00', mgr: 'Иванова А.С.' },
  { id: 'КП-1232', ver: 'версия 1', client: 'Ольга Кузнецова', deal: 'Сделка №1262', item: 'Комплексный проект', company: 'ТМ', sum: '2 460 000 ₽', status: 'Отклонено', tone: 'crit', date: '21.06.2026 12:10', mgr: 'Кузнецов Д.А.' },
  { id: 'КП-1228', ver: 'версия 2', client: 'Максим Фролов', deal: 'Сделка №1267', item: 'Кухня и остров', company: 'К+', sum: '675 000 ₽', status: 'Требует правки', tone: 'warn', date: '20.06.2026 15:40', mgr: 'Петрова Е.В.' },
  { id: 'КП-1225', ver: 'версия 1', client: 'Екатерина Лебедева', deal: 'Сделка №1264', item: 'Шкафы и гардеробная', company: 'К+', sum: '420 000 ₽', status: 'Отправлено', tone: 'info', date: '20.06.2026 10:30', mgr: 'Петрова Е.В.' },
  { id: 'КП-1220', ver: 'версия 1', client: 'Виктория Морозова', deal: 'Сделка №1268', item: 'Детская мебель', company: 'К+', sum: '310 000 ₽', status: 'Согласуется', tone: 'warn', date: '19.06.2026 16:45', mgr: 'Смирнов Д.А.' },
  { id: 'КП-1215', ver: 'версия 1', client: 'Антон Гусев', deal: 'Сделка №1269', item: 'Кухня угловая', company: 'К+', sum: '520 000 ₽', status: 'Принято', tone: 'ok', date: '19.06.2026 14:10', mgr: 'Кузнецов Д.А.' },
  { id: 'КП-1210', ver: 'версия 1', client: 'Юлия Белова', deal: 'Сделка №1270', item: 'Гардеробная', company: 'К+', sum: '260 000 ₽', status: 'Черновик', tone: 'muted', date: '18.06.2026 11:50', mgr: 'Петрова Е.В.' },
];

const composition = [
  { n: 1, name: 'Кухонный гарнитур (нижние модули)', qty: '1', unit: 'компл.', price: '780 000 ₽', sum: '780 000 ₽' },
  { n: 2, name: 'Кухонный гарнитур (верхние модули)', qty: '1', unit: 'компл.', price: '460 000 ₽', sum: '460 000 ₽' },
  { n: 3, name: 'Остров кухонный с хранением', qty: '1', unit: 'шт.', price: '380 000 ₽', sum: '380 000 ₽' },
  { n: 4, name: 'Столешница кварцевая 20 мм', qty: '6,5', unit: 'п.м.', price: '24 000 ₽', sum: '156 000 ₽' },
  { n: 5, name: 'Бытовая техника (комплект)', qty: '1', unit: 'компл.', price: '270 000 ₽', sum: '270 000 ₽' },
];

const approval = [
  { title: 'Создано', sub: '23.05.2024, 14:20\nИванова А.С.', done: true },
  { title: 'Отправлено клиенту', sub: '23.05.2024, 15:00\nИванова А.С.', done: true },
  { title: 'Ожидает согласования клиента', sub: '—', active: true },
  { title: 'Принято клиентом', sub: '—' },
  { title: 'Заказ создан', sub: '—' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  muted: 'bg-muted text-muted-foreground',
};

const Proposals = () => {
  const [active, setActive] = useState('Все КП');
  const [selected, setSelected] = useState('КП-1258');
  const sel = proposals.find((p) => p.id === selected)!;

  return (
    <Layout
      title="Коммерческие предложения"
      titleIcon="FileText"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90 transition-opacity">
            <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Создать КП</span>
          </button>
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
            <Icon name="Download" size={16} /> <span className="hidden lg:inline">Экспорт</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_640px] gap-5">
        {/* List */}
        <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 px-3.5 py-2.5 rounded-xl bg-secondary">
              <Icon name="Search" size={16} className="text-muted-foreground" />
              <input placeholder="Поиск по клиенту, сделке, номеру КП..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-sm text-muted-foreground">
              <Icon name="SlidersHorizontal" size={15} /> Фильтры
            </button>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-2"></th><th className="font-medium pb-2 pr-3">№ КП</th><th className="font-medium pb-2 pr-3">Клиент / Сделка</th><th className="font-medium pb-2 pr-3">Сумма</th><th className="font-medium pb-2 pr-3">Статус</th><th className="font-medium pb-2">Менеджер</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} onClick={() => setSelected(p.id)} className={`border-b border-border/40 cursor-pointer transition-colors ${selected === p.id ? 'bg-gold/8' : 'hover:bg-muted/30'}`}>
                    <td className="py-3 pl-1 pr-2"><div className={`w-4 h-4 rounded border flex items-center justify-center ${selected === p.id ? 'gold-gradient border-gold' : 'border-border'}`}>{selected === p.id && <Icon name="Check" size={11} className="text-background" />}</div></td>
                    <td className="py-3 pr-3"><div className="font-semibold text-foreground">{p.id}</div><div className="text-[11px] text-muted-foreground">{p.ver}</div></td>
                    <td className="py-3 pr-3"><div className="text-foreground">{p.client}</div><div className="text-[11px] text-muted-foreground">{p.deal} · {p.item}</div></td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{p.sum}</td>
                    <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[p.tone]}`}>{p.status}</span></td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{p.mgr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground text-xs">Всего: 42 КП</span>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronLeft" size={15} /></button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${n === 1 ? 'gold-gradient text-background font-semibold' : 'bg-secondary text-muted-foreground'}`}>{n}</button>
              ))}
              <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Icon name="ChevronRight" size={15} /></button>
            </div>
          </div>
        </div>

        {/* Detail card */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-extrabold text-2xl text-foreground">{sel.id}</h2>
                  <span className={`text-[11px] px-2.5 py-1 rounded-md ${statusBg[sel.tone]}`}>{sel.status}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Icon name="Calendar" size={13} /> {sel.date}</span>
                  <span className="flex items-center gap-1.5"><Icon name="GitBranch" size={13} /> {sel.ver}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs hover:bg-muted transition-colors"><Icon name="Pencil" size={14} /> Редактировать</button>
                <button className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Icon name="MoreVertical" size={15} /></button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              {[['Скачать PDF', 'FileDown'], ['Отправить', 'Send'], ['Копировать ссылку', 'Link'], ['Создать версию', 'Copy']].map(([l, i]) => (
                <button key={l} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-xs text-foreground hover:bg-muted transition-colors">
                  <Icon name={i} size={14} className="text-gold" /> {l}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Info */}
              <div className="space-y-3 text-sm">
                <h4 className="font-display font-bold text-sm text-foreground">Информация о предложении</h4>
                {[['Клиент', sel.client], ['Сделка', sel.deal.replace('Сделка ', '')], ['Компания', sel.company === 'ТМ' ? 'Территория Мебели' : 'Контур+'], ['Направление', sel.item], ['Адрес объекта', 'Симферополь, ЖК «Парковый», ул. Набережная, 9, кв. 45'], ['Менеджер', sel.mgr], ['Срок действия КП', 'до 06.07.2026']].map(([l, v]) => (
                  <div key={l}><div className="text-[11px] text-muted-foreground">{l}</div><div className="text-[13px] text-foreground">{v}</div></div>
                ))}
              </div>

              {/* Preview */}
              <div>
                <h4 className="font-display font-bold text-sm text-foreground mb-3">Предпросмотр КП</h4>
                <div className="rounded-xl overflow-hidden border border-border bg-[hsl(40_15%_96%)]">
                  <div className="p-4 text-center">
                    <div className="font-display font-black text-[hsl(30_8%_15%)] text-base mb-0.5">ТМ ТЕРРИТОРИЯ</div>
                    <div className="text-[8px] tracking-widest text-[hsl(30_6%_40%)] mb-3">МЕБЕЛИ</div>
                    <div className="text-[10px] font-bold text-[hsl(30_8%_20%)] tracking-wide">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</div>
                    <div className="text-[9px] text-[hsl(30_6%_45%)] mb-2">{sel.item}</div>
                  </div>
                  <img src={HERO_IMG} alt="" className="w-full h-28 object-cover" />
                  <div className="p-2 text-center text-[8px] text-[hsl(30_6%_45%)]">{sel.id}</div>
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <div className="flex gap-1">{[0, 1, 2, 3, 4].map((d) => <span key={d} className={`w-1.5 h-1.5 rounded-full ${d === 0 ? 'bg-gold' : 'bg-border'}`} />)}</div>
                  <span>1 / 8</span>
                </div>
              </div>

              {/* Approval */}
              <div>
                <h4 className="font-display font-bold text-sm text-foreground mb-3">Согласование КП</h4>
                <div className="space-y-3">
                  {approval.map((a, i) => (
                    <div key={a.title} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${a.done ? 'bg-status-ok' : a.active ? 'border-2 border-gold' : 'border-2 border-border'}`}>
                          {a.done && <Icon name="Check" size={12} className="text-white" />}
                          {a.active && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                        </div>
                        {i < approval.length - 1 && <div className={`w-0.5 flex-1 min-h-[20px] ${a.done ? 'bg-status-ok/40' : 'bg-border'}`} />}
                      </div>
                      <div className="pb-1">
                        <div className={`text-[13px] font-medium ${a.active ? 'text-gold' : 'text-foreground'}`}>{a.title}</div>
                        <div className="text-[11px] text-muted-foreground whitespace-pre-line">{a.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 py-2.5 rounded-xl border border-gold/30 text-gold text-sm font-medium hover:bg-gold/10 transition-colors">Перейти к сделке</button>
              </div>
            </div>
          </div>

          {/* Composition */}
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '160ms' }}>
            <h3 className="font-display font-bold text-base mb-4">Состав предложения</h3>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                      <th className="font-medium pb-2 pr-2">№</th><th className="font-medium pb-2 pr-3">Наименование</th><th className="font-medium pb-2 pr-3">Кол-во</th><th className="font-medium pb-2 pr-3">Ед. изм.</th><th className="font-medium pb-2 pr-3">Цена</th><th className="font-medium pb-2">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {composition.map((c) => (
                      <tr key={c.n} className="border-b border-border/40">
                        <td className="py-2.5 pr-2 text-muted-foreground">{c.n}</td>
                        <td className="py-2.5 pr-3 text-foreground">{c.name}</td>
                        <td className="py-2.5 pr-3 text-foreground">{c.qty}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{c.unit}</td>
                        <td className="py-2.5 pr-3 text-foreground whitespace-nowrap">{c.price}</td>
                        <td className="py-2.5 font-semibold text-foreground whitespace-nowrap">{c.sum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="mt-3 text-xs px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors">Посмотреть весь состав</button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Сумма без скидки</span><span className="text-foreground">2 160 000 ₽</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Скидка</span><span className="text-status-crit">310 000 ₽</span></div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="font-display font-bold text-foreground">Итого</span>
                  <span className="font-display font-extrabold text-xl text-gold">1 850 000 ₽</span>
                </div>
                <div className="text-[11px] text-muted-foreground">НДС не облагается</div>
                <div className="mt-2 p-3 rounded-xl bg-gold/8 border border-gold/15 text-[11px] text-foreground/80 leading-relaxed">
                  Срок изготовления: 40 рабочих дней<br />Срок монтажа: 2 дня
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Proposals;