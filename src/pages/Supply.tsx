import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const requests = [
  { id: 'З-1045', mat: 'МДФ 18мм белый глянец', qty: '150 листов', supplier: 'КрымМатериалы', status: 'Подтверждено', statusTone: 'ok', sum: '142 500 ₽', date: '25.06.2026', order: '№1258' },
  { id: 'З-1044', mat: 'Фурнитура Blum Aventos', qty: '24 комплекта', supplier: 'МебельФурнитура', status: 'Ожидает подтверждения', statusTone: 'warn', sum: '38 400 ₽', date: '26.06.2026', order: '№1256' },
  { id: 'З-1043', mat: 'Столешница кварц 20мм', qty: '12 п.м.', supplier: 'КаменьСтиль', status: 'В пути', statusTone: 'info', sum: '288 000 ₽', date: '24.06.2026', order: '№1261' },
  { id: 'З-1042', mat: 'Эмаль акриловая RAL 9003', qty: '30 кг', supplier: 'КраскиПро', status: 'Нет в наличии', statusTone: 'crit', sum: '27 000 ₽', date: '28.06.2026', order: '№1250' },
  { id: 'З-1041', mat: 'Плёнка ПВХ дерево', qty: '80 кв.м.', supplier: 'ПолимерЮг', status: 'Подтверждено', statusTone: 'ok', sum: '48 000 ₽', date: '23.06.2026', order: '№1263' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
};

const Supply = () => (
  <Layout title="Снабжение" titleIcon="PackageSearch" actions={
    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
      <Icon name="Plus" size={17} /> Новая заявка
    </button>
  }>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {[{ l: 'Открытых заявок', v: '18', t: 'warn' }, { l: 'Подтверждено', v: '12', t: 'ok' }, { l: 'В пути', v: '4', t: 'info' }, { l: 'Проблемных', v: '2', t: 'crit' }].map((k) => (
        <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : 'text-[hsl(199_60%_60%)]'}`}>{k.v}</div>
          <div className="text-[12px] text-muted-foreground">{k.l}</div>
        </div>
      ))}
    </div>

    <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base">Заявки на материалы</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary">
            <Icon name="Search" size={14} className="text-muted-foreground" />
            <input placeholder="Поиск..." className="bg-transparent text-sm outline-none w-32 text-foreground placeholder:text-muted-foreground" />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-[12px] text-muted-foreground">Поставщик <Icon name="ChevronDown" size={13} /></button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary text-[12px] text-muted-foreground">Статус <Icon name="ChevronDown" size={13} /></button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
            <th className="font-medium pb-2 pr-3">№ заявки</th>
            <th className="font-medium pb-2 pr-3">Материал</th>
            <th className="font-medium pb-2 pr-3">Кол-во</th>
            <th className="font-medium pb-2 pr-3">Поставщик</th>
            <th className="font-medium pb-2 pr-3">Сумма</th>
            <th className="font-medium pb-2 pr-3">Срок</th>
            <th className="font-medium pb-2 pr-3">Заказ</th>
            <th className="font-medium pb-2">Статус</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer">
              <td className="py-3 pr-3 font-semibold text-gold">{r.id}</td>
              <td className="py-3 pr-3 text-foreground">{r.mat}</td>
              <td className="py-3 pr-3 text-muted-foreground">{r.qty}</td>
              <td className="py-3 pr-3 text-foreground">{r.supplier}</td>
              <td className="py-3 pr-3 font-semibold text-foreground">{r.sum}</td>
              <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{r.date}</td>
              <td className="py-3 pr-3 text-gold">{r.order}</td>
              <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[r.statusTone]}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Layout>
);

export default Supply;
