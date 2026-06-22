import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const items = [
  { id: 'МДФ-18', name: 'МДФ 18мм белый глянец', unit: 'листов', qty: 48, min: 50, reserved: 12, location: 'Стеллаж А-3', tone: 'crit' },
  { id: 'МДФ-16', name: 'МДФ 16мм серый', unit: 'листов', qty: 120, min: 40, reserved: 30, location: 'Стеллаж А-4', tone: 'ok' },
  { id: 'BLUM-01', name: 'Петли Blum Clip-top 110°', unit: 'шт.', qty: 340, min: 200, reserved: 80, location: 'Стеллаж Б-1', tone: 'ok' },
  { id: 'QUARTZ-20', name: 'Столешница кварц 20мм', unit: 'п.м.', qty: 18, min: 20, reserved: 6, location: 'Склад Б', tone: 'warn' },
  { id: 'FILM-WD', name: 'Плёнка ПВХ дерево', unit: 'кв.м.', qty: 145, min: 50, reserved: 35, location: 'Стеллаж В-2', tone: 'ok' },
  { id: 'PAINT-W', name: 'Эмаль акриловая RAL 9003', unit: 'кг', qty: 12, min: 25, reserved: 0, location: 'Стеллаж В-5', tone: 'crit' },
  { id: 'HANDLE-01', name: 'Ручки-профили алюминий', unit: 'шт.', qty: 280, min: 100, reserved: 60, location: 'Стеллаж Б-3', tone: 'ok' },
];

const toneCl: Record<string, string> = { ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit' };
const toneBg: Record<string, string> = { ok: 'bg-status-ok/15 text-status-ok', warn: 'bg-status-warn/15 text-status-warn', crit: 'bg-status-crit/15 text-status-crit' };

const Warehouse = () => (
  <Layout title="Склад" titleIcon="Warehouse" actions={
    <>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
        <Icon name="Plus" size={17} /> Поступление
      </button>
      <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm">
        <Icon name="ArrowRightLeft" size={15} /> Списание
      </button>
    </>
  }>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {[{ l: 'Позиций на складе', v: '148', i: 'Package', t: 'gold' }, { l: 'Дефицит', v: '3', i: 'AlertTriangle', t: 'crit' }, { l: 'Заканчиваются', v: '7', i: 'Clock', t: 'warn' }, { l: 'Стоимость склада', v: '4.2 млн ₽', i: 'CircleDollarSign', t: 'ok' }].map((k) => (
        <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="flex items-center gap-2 mb-2">
            <Icon name={k.i} size={16} className={k.t === 'crit' ? 'text-status-crit' : k.t === 'warn' ? 'text-status-warn' : k.t === 'ok' ? 'text-status-ok' : 'text-gold'} />
            <span className="text-xs text-muted-foreground">{k.l}</span>
          </div>
          <div className={`font-display font-extrabold text-2xl ${k.t === 'crit' ? 'text-status-crit' : k.t === 'warn' ? 'text-status-warn' : k.t === 'ok' ? 'text-status-ok' : 'text-gold'}`}>{k.v}</div>
        </div>
      ))}
    </div>

    <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base">Остатки материалов</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary">
            <Icon name="Search" size={14} className="text-muted-foreground" />
            <input placeholder="Поиск материала..." className="bg-transparent text-sm outline-none w-32 text-foreground placeholder:text-muted-foreground" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-[12px] text-muted-foreground">Категория <Icon name="ChevronDown" size={13} /></button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
            <th className="font-medium pb-2 pr-3">Артикул</th>
            <th className="font-medium pb-2 pr-3">Наименование</th>
            <th className="font-medium pb-2 pr-3">Остаток</th>
            <th className="font-medium pb-2 pr-3">Мин. запас</th>
            <th className="font-medium pb-2 pr-3">Зарезервировано</th>
            <th className="font-medium pb-2 pr-3">Доступно</th>
            <th className="font-medium pb-2 pr-3">Место</th>
            <th className="font-medium pb-2">Статус</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const avail = item.qty - item.reserved;
            const status = item.qty < item.min ? 'Дефицит' : item.qty < item.min * 1.3 ? 'Заканчивается' : 'В норме';
            return (
              <tr key={item.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="py-3 pr-3 font-mono text-[11px] text-gold">{item.id}</td>
                <td className="py-3 pr-3 text-foreground">{item.name}</td>
                <td className="py-3 pr-3">
                  <span className={`font-semibold ${toneCl[item.tone]}`}>{item.qty}</span>
                  <span className="text-muted-foreground text-[11px] ml-1">{item.unit}</span>
                </td>
                <td className="py-3 pr-3 text-muted-foreground">{item.min} {item.unit}</td>
                <td className="py-3 pr-3 text-foreground">{item.reserved} {item.unit}</td>
                <td className="py-3 pr-3 font-semibold text-foreground">{avail} {item.unit}</td>
                <td className="py-3 pr-3 text-muted-foreground text-[12px]">{item.location}</td>
                <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md ${toneBg[item.tone]}`}>{status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </Layout>
);

export default Warehouse;
