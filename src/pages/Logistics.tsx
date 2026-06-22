import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const shipments = [
  { id: '№1256', client: 'Алексей Смирнов', addr: 'ЖК «Центральный», Симферополь, ул. Багратионовская, 5', date: '23.06.2026', time: '10:00—12:00', driver: 'Петров В.', car: 'Газель ВС 123 РК', status: 'Подтверждено', statusTone: 'ok', sum: '980 000 ₽' },
  { id: '№1250', client: 'Максим Фролов', addr: 'ЖК «Сердце Крыма», Симферополь', date: '23.06.2026', time: '14:00—16:00', driver: 'Иванов А.', car: 'ГАЗель NEXT КР 456', status: 'В пути', statusTone: 'warn', sum: '675 000 ₽' },
  { id: '№1263', client: 'Игорь Волков', addr: 'БЦ «Крымский», Симферополь', date: '24.06.2026', time: '09:00—11:00', driver: 'Козлов С.', car: 'Газель ВС 123 РК', status: 'Запланировано', statusTone: 'muted', sum: '1 130 000 ₽' },
  { id: '№1248', client: 'Виктор Гаврилов', addr: 'Пентхаус, ЖК «Алые Паруса», Симферополь', date: '25.06.2026', time: '10:00—14:00', driver: 'Петров В.', car: 'Газель ВС 123 РК', status: 'Запланировано', statusTone: 'muted', sum: '3 200 000 ₽' },
  { id: '№1245', client: 'Сергей Павлов', addr: 'Коттедж, пос. Строгановка, Симферопольский р-н', date: '26.06.2026', time: '08:00—12:00', driver: 'Иванов А.', car: 'ГАЗель NEXT КР 456', status: 'Запланировано', statusTone: 'muted', sum: '2 100 000 ₽' },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  muted: 'bg-muted text-muted-foreground',
};

const Logistics = () => (
  <Layout title="Логистика" titleIcon="Truck" actions={
    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
      <Icon name="Plus" size={17} /> Новая доставка
    </button>
  }>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {[{ l: 'Доставок сегодня', v: '5', t: 'gold' }, { l: 'На неделе', v: '18', t: 'info' }, { l: 'В пути', v: '2', t: 'warn' }, { l: 'Выполнено', v: '134', t: 'ok' }].map((k) => (
        <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
          <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : k.t === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.v}</div>
          <div className="text-[12px] text-muted-foreground">{k.l}</div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-base mb-4">График доставок</h3>
        <div className="space-y-3">
          {shipments.map((s) => (
            <div key={s.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-secondary border border-border hover:border-gold/30 transition-colors cursor-pointer">
              <div className="shrink-0 text-center w-20">
                <div className="text-[11px] text-muted-foreground">{s.date}</div>
                <div className="font-semibold text-[13px] text-foreground">{s.time}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gold text-[13px]">Заказ {s.id}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBg[s.statusTone]}`}>{s.status}</span>
                </div>
                <div className="text-[13px] text-foreground">{s.client}</div>
                <div className="text-[11px] text-muted-foreground truncate">{s.addr}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[11px] text-muted-foreground">{s.driver}</div>
                <div className="text-[11px] text-muted-foreground">{s.car}</div>
                <div className="text-[12px] font-semibold text-foreground mt-1">{s.sum}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-sm mb-4">Карта доставок Симферополь</h3>
        <div className="rounded-xl overflow-hidden h-64">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=34.0960,44.9527&z=12&l=map&pt=34.0960,44.9527,pmgnl~34.1060,44.9427,pmrdl~34.0860,44.9627,pmrdl"
            width="100%" height="100%" frameBorder="0" allowFullScreen title="Карта доставок"
            className="opacity-90"
          />
        </div>
        <div className="mt-4 space-y-3">
          <h4 className="text-[12px] font-semibold text-muted-foreground">Автомобили</h4>
          {[{ car: 'Газель ВС 123 РК', driver: 'Петров В.', status: 'В рейсе', count: 2 }, { car: 'ГАЗель NEXT КР 456', driver: 'Иванов А.', status: 'Свободен', count: 0 }, { car: 'ПАЗ КМ 789', driver: 'Козлов С.', status: 'Плановое ТО', count: 0 }].map((v) => (
            <div key={v.car} className="flex items-center justify-between">
              <div>
                <div className="text-[13px] text-foreground">{v.car}</div>
                <div className="text-[11px] text-muted-foreground">{v.driver}</div>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-md ${v.status === 'В рейсе' ? 'bg-status-warn/15 text-status-warn' : v.status === 'Свободен' ? 'bg-status-ok/15 text-status-ok' : 'bg-muted text-muted-foreground'}`}>{v.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

export default Logistics;
