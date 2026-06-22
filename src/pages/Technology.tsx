import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';

const specs = [
  { id: 'ТЗ-1258', order: '№1258', client: 'Мария Петрова', type: 'Кухня и остров', status: 'В работе', statusTone: 'warn', designer: 'Морозова В.А.', created: '20.06.2026', deadline: '25.06.2026', materials: 'МДФ 18мм, Кварц, Blum', pct: 60 },
  { id: 'ТЗ-1256', order: '№1256', client: 'Алексей Смирнов', type: 'Гостиная', status: 'Согласовано', statusTone: 'ok', designer: 'Морозова В.А.', created: '18.06.2026', deadline: '22.06.2026', materials: 'МДФ 16мм, ДСП', pct: 100 },
  { id: 'ТЗ-1261', order: '№1261', client: 'Ольга Кузнецова', type: 'Кухня классика', status: 'На проверке', statusTone: 'info', designer: 'Морозова В.А.', created: '22.06.2026', deadline: '28.06.2026', materials: 'МДФ 18мм, Эмаль', pct: 80 },
  { id: 'ТЗ-1263', order: '№1263', client: 'Игорь Волков', type: 'Шкафы', status: 'Черновик', statusTone: 'muted', designer: 'Морозова В.А.', created: '23.06.2026', deadline: '30.06.2026', materials: 'ДСП 16мм', pct: 20 },
];

const statusBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  muted: 'bg-muted text-muted-foreground',
};

const Technology = () => {
  const [sel, setSel] = useState('ТЗ-1258');
  const selSpec = specs.find((s) => s.id === sel)!;

  return (
    <Layout title="Технология" titleIcon="Cog" actions={
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm hover:opacity-90">
        <Icon name="Plus" size={17} /> Новое ТЗ
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[{ l: 'В работе', v: '8', t: 'warn' }, { l: 'На проверке', v: '3', t: 'info' }, { l: 'Согласовано', v: '24', t: 'ok' }, { l: 'Требуют правки', v: '2', t: 'crit' }].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : 'text-[hsl(199_60%_60%)]'}`}>{k.v}</div>
            <div className="text-[12px] text-muted-foreground">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-base mb-4">Технические задания</h3>
          <div className="space-y-3">
            {specs.map((s) => (
              <div key={s.id} onClick={() => setSel(s.id)} className={`p-4 rounded-xl cursor-pointer transition-colors border ${sel === s.id ? 'border-gold/40 bg-gold/8' : 'border-border bg-secondary hover:border-gold/20'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gold">{s.id}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium text-foreground text-[13px]">Заказ {s.order}</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${statusBg[s.statusTone]}`}>{s.status}</span>
                </div>
                <div className="text-[13px] text-foreground mb-1">{s.client} — {s.type}</div>
                <div className="text-[11px] text-muted-foreground mb-3">Материалы: {s.materials} · Дизайнер: {s.designer}</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s.pct === 100 ? 'bg-status-ok' : s.pct >= 60 ? 'bg-gold' : 'bg-status-warn'}`} style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground w-8 text-right">{s.pct}%</span>
                  <span className="text-[11px] text-muted-foreground">до {s.deadline}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start sticky top-[85px]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display font-extrabold text-lg text-foreground">{selSpec.id}</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{selSpec.client} · {selSpec.type}</p>
            </div>
            <span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[selSpec.statusTone]}`}>{selSpec.status}</span>
          </div>
          <div className="space-y-3 text-[13px] mb-5">
            {[['Заказ', `Заказ ${selSpec.order}`], ['Дизайнер', selSpec.designer], ['Создано', selSpec.created], ['Срок', selSpec.deadline], ['Материалы', selSpec.materials]].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-muted-foreground">{l}</span>
                <span className="text-foreground font-medium text-right max-w-[200px]">{v}</span>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-[12px] mb-2">
              <span className="text-muted-foreground">Готовность</span>
              <span className="font-bold text-gold">{selSpec.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gold-gradient" style={{ width: `${selSpec.pct}%` }} />
            </div>
          </div>
          <div className="mb-5">
            <h4 className="text-[12px] font-semibold text-muted-foreground mb-2">Файлы</h4>
            {[{ n: 'Чертёж_кухня.dwg', s: '2.4 МБ', i: 'FileText', c: 'text-gold' }, { n: 'Спецификация.xlsx', s: '480 КБ', i: 'FileSpreadsheet', c: 'text-status-ok' }].map((f) => (
              <div key={f.n} className="flex items-center gap-2 p-2 rounded-lg bg-secondary mb-1 cursor-pointer hover:bg-muted">
                <Icon name={f.i} size={15} className={f.c} />
                <div className="flex-1"><div className="text-[12px] text-foreground">{f.n}</div><div className="text-[10px] text-muted-foreground">{f.s}</div></div>
                <Icon name="Download" size={13} className="text-muted-foreground" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm">Редактировать</button>
            <button className="flex-1 py-2.5 rounded-xl bg-status-ok/15 text-status-ok text-sm font-medium">Согласовать</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Technology;
