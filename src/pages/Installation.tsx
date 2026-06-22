import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const installs = [
  { id: '№1250', client: 'Максим Фролов', addr: 'ЖК «Сердце Крыма», Симферополь, наб. Салгирная, 34к2', type: 'Кухня и остров', date: '23.06.2026', time: '10:00—18:00', team: 'Бригада №1', members: 'Артём К., Сергей Л.', status: 'В процессе', statusTone: 'warn', sum: '675 000 ₽' },
  { id: '№1248', client: 'Виктор Гаврилов', addr: 'Пентхаус, ЖК «Алые Паруса», Симферополь', type: 'Гостиная и столовая', date: '24.06.2026', time: '09:00—17:00', team: 'Бригада №2', members: 'Николай В., Дмитрий Р.', status: 'Запланировано', statusTone: 'muted', sum: '3 200 000 ₽' },
  { id: '№1245', client: 'Сергей Павлов', addr: 'Коттедж, пос. Строгановка, Симферопольский р-н', type: 'Кухня + гостиная + спальня', date: '25.06.2026', time: '08:00—20:00', team: 'Бригада №1+2', members: 'Артём К., Николай В.', status: 'Запланировано', statusTone: 'muted', sum: '2 100 000 ₽' },
  { id: '№1240', client: 'Анна Козлова', addr: 'ЖК «Парковый», Симферополь', type: 'Гардеробная', date: '20.06.2026', time: '10:00—14:00', team: 'Бригада №2', members: 'Дмитрий Р.', status: 'Выполнено', statusTone: 'ok', sum: '420 000 ₽' },
];

const statusBg: Record<string, string> = { ok: 'bg-status-ok/15 text-status-ok', warn: 'bg-status-warn/15 text-status-warn', crit: 'bg-status-crit/15 text-status-crit', muted: 'bg-muted text-muted-foreground' };

const Installation = () => (
  <Layout title="Монтаж" titleIcon="Wrench" actions={
    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
      <Icon name="Plus" size={17} /> Назначить монтаж
    </button>
  }>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {[{ l: 'Монтажей сегодня', v: '2', t: 'warn' }, { l: 'На неделе', v: '8', t: 'gold' }, { l: 'Выполнено (июнь)', v: '24', t: 'ok' }, { l: 'Бригад активных', v: '3', t: 'info' }].map((k) => (
        <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.v}</div>
          <div className="text-[12px] text-muted-foreground">{k.l}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-base mb-4">График монтажей</h3>
        <div className="space-y-3">
          {installs.map((inst) => (
            <div key={inst.id} className="p-4 rounded-xl bg-secondary border border-border hover:border-gold/30 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gold">Заказ {inst.id}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${statusBg[inst.statusTone]}`}>{inst.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-semibold text-foreground">{inst.date}</div>
                  <div className="text-[11px] text-muted-foreground">{inst.time}</div>
                </div>
              </div>
              <div className="text-[13px] font-medium text-foreground mb-1">{inst.client} — {inst.type}</div>
              <div className="text-[11px] text-muted-foreground mb-2">{inst.addr}</div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Icon name="Users" size={13} />{inst.team}: {inst.members}</span>
                <span className="font-semibold text-foreground">{inst.sum}</span>
              </div>
              {inst.status === 'В процессе' && (
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-2 rounded-lg bg-gold/15 text-gold text-[12px] font-medium hover:bg-gold/25 transition-colors">Добавить фото</button>
                  <button className="flex-1 py-2 rounded-lg bg-status-ok/15 text-status-ok text-[12px] font-medium hover:bg-status-ok/25 transition-colors">Подписать акт</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-sm mb-4">Бригады</h3>
          {[{ name: 'Бригада №1', members: ['Артём К.', 'Сергей Л.'], status: 'На объекте', today: 1 }, { name: 'Бригада №2', members: ['Николай В.', 'Дмитрий Р.'], status: 'Свободна', today: 0 }, { name: 'Бригада №3', members: ['Павел М.'], status: 'Отгрузка', today: 0 }].map((b) => (
            <div key={b.name} className="mb-3 p-3 rounded-xl bg-secondary">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[13px] text-foreground">{b.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${b.status === 'На объекте' ? 'bg-status-warn/15 text-status-warn' : b.status === 'Свободна' ? 'bg-status-ok/15 text-status-ok' : 'bg-muted text-muted-foreground'}`}>{b.status}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{b.members.join(', ')}</div>
              {b.today > 0 && <div className="text-[11px] text-gold mt-1">Монтажей сегодня: {b.today}</div>}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-sm mb-3">Статистика июня</h3>
          {[['Выполнено монтажей', '24'], ['Ср. время монтажа', '6 ч.'], ['Рекламаций', '1'], ['Оценка клиентов', '4.8 / 5']].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2 border-b border-border/50 last:border-0 text-[13px]">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-semibold text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

export default Installation;
