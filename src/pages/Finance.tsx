import { useState } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';

const periods = ['Июнь 2026', 'Май 2026', 'Q2 2026', 'Год'];

const cashflow = [
  { label: 'Остаток на начало периода', value: '1 245 000 ₽', tone: 'foreground' },
  { label: 'Поступления', value: '9 240 000 ₽', tone: 'ok' },
  { label: 'Авансы от клиентов', value: '4 120 000 ₽', tone: 'ok' },
  { label: 'Оплата по актам', value: '5 120 000 ₽', tone: 'ok' },
  { label: 'Расходы (производство)', value: '3 840 000 ₽', tone: 'crit' },
  { label: 'Расходы (материалы)', value: '1 343 600 ₽', tone: 'crit' },
  { label: 'Зарплата', value: '980 000 ₽', tone: 'crit' },
  { label: 'Аренда, коммунальные', value: '120 000 ₽', tone: 'crit' },
  { label: 'Остаток на конец периода', value: '5 301 400 ₽', tone: 'ok', bold: true },
];

const margins = [
  { id: '№1258', client: 'Мария Петрова', type: 'Кухня и остров', sum: '1 245 000 ₽', cost: '746 000 ₽', profit: '499 000 ₽', margin: '40%', tone: 'ok' },
  { id: '№1256', client: 'Алексей Смирнов', type: 'Гостиная', sum: '980 000 ₽', cost: '650 000 ₽', profit: '330 000 ₽', margin: '34%', tone: 'ok' },
  { id: '№1263', client: 'Игорь Волков', type: 'Шкафы', sum: '1 130 000 ₽', cost: '890 000 ₽', profit: '240 000 ₽', margin: '21%', tone: 'warn' },
  { id: '№1255', client: 'Дмитрий Орлов', type: 'Спальня', sum: '680 000 ₽', cost: '620 000 ₽', profit: '60 000 ₽', margin: '9%', tone: 'crit' },
  { id: '№1250', client: 'Максим Фролов', type: 'Кухня и остров', sum: '675 000 ₽', cost: '410 000 ₽', profit: '265 000 ₽', margin: '39%', tone: 'ok' },
];

const toneTxt: Record<string, string> = { ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit', foreground: 'text-foreground' };

const Finance = () => {
  const { success, info } = useToast();
  const [period, setPeriod] = useState('Июнь 2026');
  const [showPayment, setShowPayment] = useState(false);
  const [showExport, setShowExport] = useState(false);
  return (
    <Layout title="Финансы и себестоимость" titleIcon="CircleDollarSign" actions={
      <>
        <div className="flex gap-1 p-1 rounded-xl bg-secondary">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${period === p ? 'gold-gradient text-background' : 'text-muted-foreground hover:text-foreground'}`}>{p}</button>
          ))}
        </div>
        <button onClick={() => setShowPayment(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
          <Icon name="Plus" size={15} /> Платёж
        </button>
        <button onClick={() => setShowExport(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all">
          <Icon name="Download" size={15} /> Экспорт
        </button>
      </>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Выручка', v: '8 126 400 ₽', delta: '+12%', t: 'gold', i: 'TrendingUp' },
          { l: 'Себестоимость', v: '5 183 600 ₽', delta: '-', t: 'warn', i: 'TrendingDown' },
          { l: 'Прибыль', v: '2 942 800 ₽', delta: '+18%', t: 'ok', i: 'CircleDollarSign' },
          { l: 'Рентабельность', v: '36%', delta: '+1.6%', t: 'ok', i: 'Percent' },
        ].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.l}</span>
              <Icon name={k.i} size={16} className={k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : 'text-gold'} />
            </div>
            <div className="font-display font-extrabold text-xl text-foreground">{k.v}</div>
            <div className="text-xs text-status-ok mt-1">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-base mb-4">Движение денежных средств</h3>
          <div className="space-y-0">
            {cashflow.map((c) => (
              <div key={c.label} className={`flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 ${c.bold ? 'mt-1 pt-3 border-t border-border' : ''}`}>
                <span className={`text-[13px] ${c.bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
                <span className={`font-semibold text-[13px] ${toneTxt[c.tone]} ${c.bold ? 'text-lg font-display font-extrabold' : ''}`}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
          <h3 className="font-display font-bold text-base mb-4">Финансовый результат</h3>
          <div className="flex items-end justify-around h-48 gap-4">
            {[{ l: 'Выручка', v: '8.13 млн', h: 100, c: 'hsl(150 50% 48%)' }, { l: 'Себестоимость', v: '5.18 млн', h: 64, c: 'hsl(40 60% 55%)' }, { l: 'Расходы', v: '1.01 млн', h: 13, c: 'hsl(4 70% 55%)' }, { l: 'Прибыль', v: '2.94 млн', h: 36, c: 'hsl(199 60% 50%)' }].map((f) => (
              <div key={f.l} className="flex flex-col items-center flex-1">
                <span className="text-[11px] font-semibold text-foreground mb-2">{f.v}</span>
                <div className="w-full rounded-t-md" style={{ height: `${f.h}%`, background: f.c, minHeight: '6px' }} />
                <span className="text-[10px] text-muted-foreground mt-2 text-center">{f.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
        <h3 className="font-display font-bold text-base mb-4">Себестоимость по заказам</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
              <th className="font-medium pb-2 pr-3">№ заказа</th>
              <th className="font-medium pb-2 pr-3">Клиент</th>
              <th className="font-medium pb-2 pr-3">Тип</th>
              <th className="font-medium pb-2 pr-3">Выручка</th>
              <th className="font-medium pb-2 pr-3">Себестоимость</th>
              <th className="font-medium pb-2 pr-3">Прибыль</th>
              <th className="font-medium pb-2">Маржа</th>
            </tr>
          </thead>
          <tbody>
            {margins.map((m) => (
              <tr key={m.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                <td className="py-3 pr-3 font-semibold text-gold">{m.id}</td>
                <td className="py-3 pr-3 text-foreground">{m.client}</td>
                <td className="py-3 pr-3 text-muted-foreground">{m.type}</td>
                <td className="py-3 pr-3 text-foreground">{m.sum}</td>
                <td className="py-3 pr-3 text-foreground">{m.cost}</td>
                <td className="py-3 pr-3 text-foreground font-semibold">{m.profit}</td>
                <td className="py-3"><span className={`text-[12px] font-bold ${toneTxt[m.tone]}`}>{m.margin}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Новый платёж modal ── */}
      <Modal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        title="Зафиксировать платёж"
        subtitle="Поступление или расход"
        icon="CircleDollarSign"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => { setShowPayment(false); success('Платёж зафиксирован', 'Добавлен в ДДС'); }} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20">
              Сохранить
            </button>
            <button onClick={() => setShowPayment(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Тип операции</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: 'Поступление', i: 'TrendingUp', c: 'border-status-ok/40 bg-status-ok/8 text-status-ok', active: true },
                { l: 'Расход', i: 'TrendingDown', c: 'border-border bg-secondary text-muted-foreground hover:border-status-crit/30', active: false },
              ].map((t) => (
                <button key={t.l} className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-medium transition-all ${t.c}`}>
                  <Icon name={t.i} size={16} /> {t.l}
                </button>
              ))}
            </div>
          </div>
          {[
            { label: 'Сумма', placeholder: '1 245 000', icon: 'CircleDollarSign', suffix: '₽' },
            { label: 'Заказ / Клиент', placeholder: '№1258 · Мария Петрова', icon: 'Link' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">{f.label}</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name={f.icon} size={15} className="text-gold shrink-0" />
                <input placeholder={f.placeholder} className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
                {f.suffix && <span className="text-muted-foreground text-sm">{f.suffix}</span>}
              </div>
            </div>
          ))}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Calendar" size={15} className="text-gold shrink-0" />
              <input type="date" className="bg-transparent text-sm outline-none flex-1 text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Категория</label>
            <div className="flex flex-wrap gap-2">
              {['Оплата от клиента', 'Материалы', 'Зарплата', 'Аренда', 'Прочее'].map((c, i) => (
                <button key={c} className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all ${i === 0 ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea rows={2} placeholder="Назначение платежа..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
        </div>
      </Modal>

      {/* ── Экспорт modal ── */}
      <Modal
        open={showExport}
        onClose={() => setShowExport(false)}
        title="Экспорт отчёта"
        icon="Download"
        size="sm"
        footer={
          <button onClick={() => { setShowExport(false); info('Отчёт подготовлен', 'Загрузка началась'); }} className="w-full py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 flex items-center justify-center gap-2">
            <Icon name="Download" size={16} /> Скачать отчёт
          </button>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Формат файла</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: 'Excel', i: 'FileSpreadsheet', active: true },
                { l: 'PDF', i: 'FileText', active: false },
                { l: 'CSV', i: 'FileCode', active: false },
              ].map((f) => (
                <button key={f.l} className={`flex flex-col items-center gap-2 py-3 rounded-xl border text-[12px] transition-all ${f.active ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/25'}`}>
                  <Icon name={f.i} size={18} /> {f.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Данные для включения</label>
            <div className="space-y-2">
              {['Движение денежных средств', 'Себестоимость по заказам', 'Маржинальность', 'Сравнение с предыдущим периодом'].map((opt, i) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-secondary/60 transition-colors">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${i < 3 ? 'gold-gradient border-transparent' : 'border-border'}`}>
                    {i < 3 && <Icon name="Check" size={10} className="text-background" />}
                  </div>
                  <span className="text-[13px] text-foreground">{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gold/8 border border-gold/15 flex items-center gap-3 text-[12px]">
            <Icon name="Info" size={15} className="text-gold shrink-0" />
            <span className="text-muted-foreground">Период: <span className="text-foreground font-medium">{period}</span> · Компания: Территория Мебели</span>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Finance;