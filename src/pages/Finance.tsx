import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface MarginRow {
  orderId: number; orderCode: string; clientName: string; itemType?: string;
  sum: number; cost: number; profit: number; marginPct: number;
}
interface FinanceSummary { income: number; expense: number; profit: number; margins: MarginRow[]; }
interface OrderOpt { id: number; code: string; clientName: string; }

const toneOf = (pct: number) => pct >= 30 ? 'ok' : pct >= 15 ? 'warn' : 'crit';
const toneTxt: Record<string, string> = { ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit', foreground: 'text-foreground' };
const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;

const categories = ['Оплата от клиента', 'Материалы', 'Зарплата', 'Аренда', 'Прочее'];
const emptyForm = { paymentType: 'income', sum: '', orderId: '', paymentDate: '', category: categories[0], comment: '' };

const Finance = () => {
  const { success, error: toastError } = useToast();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<FinanceSummary>('sales', { params: { resource: 'finance', action: 'summary' } });
      setSummary(data);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить финансовые данные');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api<{ orders: { id: number; code: string; clientName: string }[] }>('operations', { params: { resource: 'orders' } });
      setOrders(data.orders.map((o) => ({ id: o.id, code: o.code, clientName: o.clientName })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadOrders(); }, [load, loadOrders]);

  const profit = summary ? summary.profit : 0;
  const marginPct = summary && summary.income ? (profit / summary.income) * 100 : 0;
  const totalCost = summary ? summary.margins.reduce((acc, m) => acc + m.cost, 0) : 0;

  const handleCreatePayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.sum) {
      toastError('Укажите сумму платежа');
      return;
    }
    setSubmitting(true);
    try {
      await api('sales', {
        method: 'POST',
        params: { resource: 'finance' },
        body: {
          paymentType: form.paymentType, sum: Number(form.sum),
          orderId: form.orderId ? Number(form.orderId) : undefined,
          paymentDate: form.paymentDate || undefined, category: form.category,
          comment: form.comment.trim() || undefined,
        },
      });
      setShowPayment(false);
      setForm(emptyForm);
      success('Платёж зафиксирован', 'Добавлен в ДДС');
      await load();
    } catch (err) {
      toastError('Не удалось зафиксировать платёж', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Финансы и себестоимость" titleIcon="CircleDollarSign" actions={
      <button onClick={() => setShowPayment(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={15} /> <span className="hidden sm:inline">Платёж</span>
      </button>
    }>
      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      {loading || !summary ? (
        <div className="flex items-center justify-center py-24"><Icon name="Loader2" size={32} className="text-gold animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { l: 'Выручка', v: fmtSum(summary.income), t: 'gold', i: 'TrendingUp' },
              { l: 'Себестоимость', v: fmtSum(totalCost), t: 'warn', i: 'TrendingDown' },
              { l: 'Прибыль', v: fmtSum(profit), t: 'ok', i: 'CircleDollarSign' },
              { l: 'Рентабельность', v: `${marginPct.toFixed(0)}%`, t: 'ok', i: 'Percent' },
            ].map((k, i) => (
              <div key={k.l} className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{k.l}</span>
                  <Icon name={k.i} size={16} className={k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : 'text-gold'} />
                </div>
                <div className="font-display font-extrabold text-xl text-foreground">{k.v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
              <h3 className="font-display font-bold text-base mb-4">Движение денежных средств</h3>
              <div className="space-y-0">
                {[
                  { label: 'Поступления', value: summary.income, tone: 'ok' },
                  { label: 'Расходы', value: summary.expense, tone: 'crit' },
                  { label: 'Итоговая прибыль', value: profit, tone: 'ok', bold: true },
                ].map((c) => (
                  <div key={c.label} className={`flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 ${c.bold ? 'mt-1 pt-3 border-t border-border' : ''}`}>
                    <span className={`text-[13px] ${c.bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{c.label}</span>
                    <span className={`font-semibold text-[13px] ${toneTxt[c.tone]} ${c.bold ? 'text-lg font-display font-extrabold' : ''}`}>{fmtSum(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
              <h3 className="font-display font-bold text-base mb-4">Финансовый результат</h3>
              <div className="flex items-end justify-around h-48 gap-4">
                {[
                  { l: 'Выручка', v: summary.income, c: 'hsl(150 50% 48%)' },
                  { l: 'Себестоимость', v: totalCost, c: 'hsl(40 60% 55%)' },
                  { l: 'Расходы', v: summary.expense, c: 'hsl(4 70% 55%)' },
                  { l: 'Прибыль', v: profit, c: 'hsl(199 60% 50%)' },
                ].map((f) => {
                  const max = Math.max(summary.income, 1);
                  const h = Math.max(6, (f.v / max) * 100);
                  return (
                    <div key={f.l} className="flex flex-col items-center flex-1">
                      <span className="text-[11px] font-semibold text-foreground mb-2">{(f.v / 1000000).toFixed(2)} млн</span>
                      <div className="w-full rounded-t-md" style={{ height: `${h}%`, background: f.c, minHeight: '6px' }} />
                      <span className="text-[10px] text-muted-foreground mt-2 text-center">{f.l}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
            <h3 className="font-display font-bold text-base mb-4">Себестоимость по заказам</h3>
            {summary.margins.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Заказов пока нет</div>
            ) : (
              <div className="table-responsive">
                <table className="w-full text-sm min-w-[650px]">
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
                    {summary.margins.map((m) => (
                      <tr key={m.orderId} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-3 font-semibold text-gold">{m.orderCode}</td>
                        <td className="py-3 pr-3 text-foreground truncate max-w-[140px]">{m.clientName}</td>
                        <td className="py-3 pr-3 text-muted-foreground truncate max-w-[120px]">{m.itemType || '—'}</td>
                        <td className="py-3 pr-3 text-foreground whitespace-nowrap">{fmtSum(m.sum)}</td>
                        <td className="py-3 pr-3 text-foreground whitespace-nowrap">{fmtSum(m.cost)}</td>
                        <td className="py-3 pr-3 text-foreground font-semibold whitespace-nowrap">{fmtSum(m.profit)}</td>
                        <td className="py-3"><span className={`text-[12px] font-bold ${toneTxt[toneOf(m.marginPct)]}`}>{m.marginPct}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Новый платёж modal ── */}
      <Modal
        open={showPayment}
        onClose={() => { setShowPayment(false); setForm(emptyForm); }}
        title="Зафиксировать платёж"
        subtitle="Поступление или расход"
        icon="CircleDollarSign"
        size="sm"
      >
        <form onSubmit={handleCreatePayment} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Тип операции</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, paymentType: 'income' })}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-medium transition-all ${form.paymentType === 'income' ? 'border-status-ok/40 bg-status-ok/8 text-status-ok' : 'border-border bg-secondary text-muted-foreground hover:border-status-ok/30'}`}>
                <Icon name="TrendingUp" size={16} /> Поступление
              </button>
              <button type="button" onClick={() => setForm({ ...form, paymentType: 'expense' })}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-medium transition-all ${form.paymentType === 'expense' ? 'border-status-crit/40 bg-status-crit/8 text-status-crit' : 'border-border bg-secondary text-muted-foreground hover:border-status-crit/30'}`}>
                <Icon name="TrendingDown" size={16} /> Расход
              </button>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Сумма *</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="CircleDollarSign" size={15} className="text-gold shrink-0" />
              <input value={form.sum} onChange={(e) => setForm({ ...form, sum: e.target.value })} type="number" placeholder="1 245 000" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50" />
              <span className="text-muted-foreground text-sm">₽</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Заказ</label>
            <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Без привязки</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.code} — {o.clientName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Calendar" size={15} className="text-gold shrink-0" />
              <input value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} type="date" className="bg-transparent text-sm outline-none flex-1 text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Категория</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, category: c })}
                  className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all ${form.category === c ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} placeholder="Назначение платежа..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
              Сохранить
            </button>
            <button type="button" onClick={() => { setShowPayment(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Finance;
