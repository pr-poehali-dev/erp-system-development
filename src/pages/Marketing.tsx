import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const channels = [
  { name: 'Instagram', leads: 38, cost: '45 000 ₽', cpl: '1 184 ₽', conv: '18%', tone: 'ok', icon: 'Instagram' },
  { name: 'ВКонтакте', leads: 24, cost: '28 000 ₽', cpl: '1 167 ₽', conv: '14%', tone: 'ok', icon: 'Share2' },
  { name: 'Яндекс.Директ', leads: 19, cost: '62 000 ₽', cpl: '3 263 ₽', conv: '22%', tone: 'warn', icon: 'Search' },
  { name: 'Авито', leads: 15, cost: '12 000 ₽', cpl: '800 ₽', conv: '12%', tone: 'ok', icon: 'ShoppingBag' },
  { name: 'Реферальная', leads: 11, cost: '0 ₽', cpl: '0 ₽', conv: '42%', tone: 'ok', icon: 'Users' },
  { name: 'Сайт (SEO)', leads: 8, cost: '15 000 ₽', cpl: '1 875 ₽', conv: '25%', tone: 'ok', icon: 'Globe' },
];

const campaigns = [
  { name: 'Кухни — Летняя акция', channel: 'Instagram', status: 'Активна', budget: '45 000 ₽', spent: '32 000 ₽', leads: 28, cpl: '1 143 ₽', start: '01.06.2026', end: '30.06.2026' },
  { name: 'Гардеробные — скидка 15%', channel: 'ВКонтакте', status: 'Активна', budget: '28 000 ₽', spent: '18 500 ₽', leads: 14, cpl: '1 321 ₽', start: '10.06.2026', end: '30.06.2026' },
  { name: 'Ремаркетинг — Яндекс', channel: 'Яндекс.Директ', status: 'Пауза', budget: '30 000 ₽', spent: '22 000 ₽', leads: 8, cpl: '2 750 ₽', start: '15.05.2026', end: '15.07.2026' },
  { name: 'Авито — Мебель Симферополь', channel: 'Авито', status: 'Активна', budget: '12 000 ₽', spent: '12 000 ₽', leads: 15, cpl: '800 ₽', start: '01.06.2026', end: '30.06.2026' },
];

const statusBg: Record<string, string> = { 'Активна': 'bg-status-ok/15 text-status-ok', 'Пауза': 'bg-status-warn/15 text-status-warn', 'Завершена': 'bg-muted text-muted-foreground' };

const Marketing = () => (
  <Layout title="Маркетинг" titleIcon="Megaphone" actions={
    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
      <Icon name="Plus" size={17} /> Новая кампания
    </button>
  }>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {[{ l: 'Лидов за месяц', v: '115', delta: '+23%', t: 'ok' }, { l: 'Общий бюджет', v: '162 000 ₽', delta: 'Июнь', t: 'gold' }, { l: 'Средняя CPL', v: '1 409 ₽', delta: '-8%', t: 'ok' }, { l: 'Конверсия в заказ', v: '19%', delta: '+3%', t: 'ok' }].map((k) => (
        <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className="text-xs text-muted-foreground mb-1">{k.l}</div>
          <div className={`font-display font-extrabold text-2xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : 'text-gold'}`}>{k.v}</div>
          <div className="text-[11px] text-status-ok">{k.delta}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-base mb-4">Лиды по каналам</h3>
        <div className="space-y-3">
          {channels.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
                <Icon name={c.icon} size={16} className="text-gold" fallback="Globe" />
              </div>
              <span className="text-[13px] w-28 text-foreground">{c.name}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gold-gradient" style={{ width: `${(c.leads / 38) * 100}%` }} />
              </div>
              <span className="text-[12px] font-semibold w-6 text-right text-foreground">{c.leads}</span>
              <span className="text-[11px] text-muted-foreground w-20 text-right">{c.cpl} / лид</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-base mb-4">Конверсия по каналам</h3>
        <div className="space-y-3">
          {channels.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="text-[13px] w-28 text-foreground shrink-0">{c.name}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${c.tone === 'ok' ? 'bg-status-ok' : 'bg-status-warn'}`} style={{ width: c.conv }} />
              </div>
              <span className={`text-[12px] font-bold w-10 text-right ${c.tone === 'ok' ? 'text-status-ok' : 'text-status-warn'}`}>{c.conv}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
      <h3 className="font-display font-bold text-base mb-4">Рекламные кампании</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
            <th className="font-medium pb-2 pr-3">Кампания</th>
            <th className="font-medium pb-2 pr-3">Канал</th>
            <th className="font-medium pb-2 pr-3">Бюджет</th>
            <th className="font-medium pb-2 pr-3">Потрачено</th>
            <th className="font-medium pb-2 pr-3">Лидов</th>
            <th className="font-medium pb-2 pr-3">CPL</th>
            <th className="font-medium pb-2 pr-3">Период</th>
            <th className="font-medium pb-2">Статус</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.name} className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer">
              <td className="py-3 pr-3 text-foreground font-medium">{c.name}</td>
              <td className="py-3 pr-3 text-muted-foreground">{c.channel}</td>
              <td className="py-3 pr-3 text-foreground">{c.budget}</td>
              <td className="py-3 pr-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gold-gradient rounded-full" style={{ width: `${(parseInt(c.spent) / parseInt(c.budget)) * 100}%` }} />
                  </div>
                  <span className="text-[12px] text-foreground">{c.spent}</span>
                </div>
              </td>
              <td className="py-3 pr-3 font-semibold text-foreground">{c.leads}</td>
              <td className="py-3 pr-3 text-foreground">{c.cpl}</td>
              <td className="py-3 pr-3 text-[11px] text-muted-foreground whitespace-nowrap">{c.start} — {c.end}</td>
              <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[c.status]}`}>{c.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Layout>
);

export default Marketing;
