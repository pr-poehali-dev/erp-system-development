import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const items = [
  { id: 'КЗ-0412', order: '№1256', client: 'Алексей Смирнов', obj: 'ЖК «Центральный», Симферополь', type: 'Гостиная', date: '24.06.2026', time: '11:30', mgr: 'Кузнецов Д.А.', mgrI: 'КД', status: 'Назначен', statusTone: 'warn', result: '' },
  { id: 'КЗ-0411', order: '№1261', client: 'Ольга Кузнецова', obj: 'Дом, Симферопольский р-н', type: 'Кухня классика', date: '26.06.2026', time: '10:00', mgr: 'Иванова А.С.', mgrI: 'ИА', status: 'Подтверждён', statusTone: 'info', result: '' },
  { id: 'КЗ-0410', order: '№1250', client: 'Максим Фролов', obj: 'ЖК «Сердце Крыма», Симферополь', type: 'Кухня и остров', date: '23.06.2026', time: '14:00', mgr: 'Петрова Е.В.', mgrI: 'ПЕ', status: 'Выполнен', statusTone: 'ok', result: 'Расхождение 2 мм — допустимо' },
  { id: 'КЗ-0409', order: '№1248', client: 'Виктор Гаврилов', obj: 'Пентхаус, ЖК «Алые Паруса»', type: 'Гостиная и столовая', date: '22.06.2026', time: '09:00', mgr: 'Иванова А.С.', mgrI: 'ИА', status: 'Требует правки', statusTone: 'crit', result: 'Проём двери не совпадает — нужна корректировка' },
  { id: 'КЗ-0408', order: '№1240', client: 'Анна Козлова', obj: 'ЖК «Парковый», Симферополь', type: 'Гардеробная', date: '20.06.2026', time: '11:00', mgr: 'Смирнов П.А.', mgrI: 'СП', status: 'Выполнен', statusTone: 'ok', result: 'Все размеры совпадают' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
};

const checklist = [
  { item: 'Ширина проёма соответствует чертежу', done: true },
  { item: 'Высота потолка от чистового пола', done: true },
  { item: 'Расположение розеток и выключателей', done: true },
  { item: 'Расположение водопровода и канализации', done: true },
  { item: 'Наличие вентиляционного канала', done: false },
  { item: 'Ровность стен (отклонение ≤ 3 мм)', done: false },
  { item: 'Напольное покрытие уложено', done: false },
];

const ControlMeasurements = () => {
  const [sel, setSel] = useState('КЗ-0412');
  const selItem = items.find((i) => i.id === sel)!;

  return (
    <Layout title="Контрольные замеры" titleIcon="ClipboardCheck" actions={
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
        <Icon name="Plus" size={17} /> Назначить контрольный замер
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[{ l: 'Назначены', v: '6', t: 'warn' }, { l: 'Выполнены', v: '18', t: 'ok' }, { l: 'Требуют правки', v: '2', t: 'crit' }, { l: 'Этот месяц', v: '26', t: 'gold' }].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : 'text-gold'}`}>{k.v}</div>
            <div className="text-[12px] text-muted-foreground">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-base mb-4">Список контрольных замеров</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} onClick={() => setSel(item.id)} className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-colors border ${sel === item.id ? 'border-gold/40 bg-gold/8' : 'border-border bg-secondary hover:border-gold/20'}`}>
                <div className="shrink-0">
                  <div className="font-semibold text-gold text-[13px]">{item.id}</div>
                  <div className="text-[11px] text-muted-foreground">Заказ {item.order}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{item.client} — {item.type}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{item.obj}</div>
                  {item.result && <div className="text-[11px] mt-0.5" style={{ color: item.statusTone === 'ok' ? 'var(--status-ok)' : item.statusTone === 'crit' ? 'var(--status-crit)' : '' }}>{item.result}</div>}
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[12px] font-semibold text-foreground">{item.date}</div>
                  <div className="text-[11px] text-muted-foreground">{item.time}</div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center text-[9px] font-bold text-gold">{item.mgrI}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap ${statusBg[item.statusTone]}`}>{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground">{selItem.id}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Заказ {selItem.order} · {selItem.date} в {selItem.time}</p>
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[selItem.statusTone]}`}>{selItem.status}</span>
          </div>

          <div className="space-y-3 text-[13px] mb-5">
            {[['Клиент', selItem.client], ['Объект', selItem.obj], ['Тип мебели', selItem.type], ['Менеджер', selItem.mgr]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground font-medium text-right max-w-[220px]">{v}</span>
              </div>
            ))}
            {selItem.result && (
              <div className="p-3 rounded-xl bg-status-crit/10 border border-status-crit/20 text-[12px] text-status-crit">{selItem.result}</div>
            )}
          </div>

          <div className="mb-5">
            <h4 className="text-[12px] font-semibold text-muted-foreground mb-3">Чек-лист замера</h4>
            <div className="space-y-2">
              {checklist.map((c) => (
                <div key={c.item} className="flex items-center gap-2.5 text-[12px]">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${c.done ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                    {c.done && <Icon name="Check" size={10} className="text-white" />}
                  </div>
                  <span className={c.done ? 'text-muted-foreground' : 'text-foreground'}>{c.item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <h4 className="text-[12px] font-semibold text-muted-foreground mb-2">Прикрепить файлы</h4>
            <button className="w-full py-3 rounded-xl border border-dashed border-border text-[12px] text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors flex items-center justify-center gap-2">
              <Icon name="Upload" size={15} /> Загрузить фото / план
            </button>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm flex items-center justify-center gap-2">
              <Icon name="CheckCircle" size={15} /> Завершить замер
            </button>
            <button className="flex-1 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium hover:border-gold/30 transition-colors">
              Создать задачу
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ControlMeasurements;
