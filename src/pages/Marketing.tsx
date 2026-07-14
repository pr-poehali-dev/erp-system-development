import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface MarketingSource { id: number; name: string; channelType?: string; color?: string; }
interface MarketingBudget { id: number; sourceId: number; sourceName: string; periodMonth: string; budgetSum: number; leadsCount: number; }
interface DealSource { source: string; leadsCount: number; totalSum: number; }

const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;
const iconFor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('instagram')) return 'Instagram';
  if (n.includes('вконтакте') || n.includes('vk')) return 'Share2';
  if (n.includes('директ') || n.includes('yandex') || n.includes('яндекс')) return 'Search';
  if (n.includes('авито')) return 'ShoppingBag';
  if (n.includes('реферал')) return 'Users';
  if (n.includes('сайт') || n.includes('seo')) return 'Globe';
  return 'Megaphone';
};

const emptyForm = { sourceId: '', budgetSum: '', periodMonth: '', leadsCount: '' };

const Marketing = () => {
  const { success, error: toastError } = useToast();
  const [sources, setSources] = useState<MarketingSource[]>([]);
  const [budgets, setBudgets] = useState<MarketingBudget[]>([]);
  const [dealSources, setDealSources] = useState<DealSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ sources: MarketingSource[]; budgets: MarketingBudget[]; dealSources: DealSource[] }>('crm', { params: { resource: 'marketing' } });
      setSources(data.sources);
      setBudgets(data.budgets);
      setDealSources(data.dealSources);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные маркетинга');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalLeads = dealSources.reduce((acc, d) => acc + d.leadsCount, 0);
  const totalBudget = budgets.reduce((acc, b) => acc + b.budgetSum, 0);
  const avgCpl = totalLeads > 0 ? totalBudget / totalLeads : 0;
  const maxLeads = Math.max(...dealSources.map((d) => d.leadsCount), 1);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.sourceId || !form.periodMonth) {
      toastError('Выберите источник и период');
      return;
    }
    setSubmitting(true);
    try {
      await api('crm', {
        method: 'POST',
        params: { resource: 'marketing' },
        body: {
          sourceId: Number(form.sourceId), budgetSum: Number(form.budgetSum) || 0,
          periodMonth: form.periodMonth, leadsCount: Number(form.leadsCount) || 0,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Бюджет добавлен');
      await load();
    } catch (err) {
      toastError('Не удалось добавить бюджет', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Маркетинг" titleIcon="Megaphone" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Бюджет на канал</span>
      </button>
    }>
      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24"><Icon name="Loader2" size={32} className="text-gold animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              { l: 'Лидов всего', v: String(totalLeads), t: 'ok' },
              { l: 'Общий бюджет', v: fmtSum(totalBudget), t: 'gold' },
              { l: 'Средняя CPL', v: fmtSum(Math.round(avgCpl)), t: 'ok' },
              { l: 'Источников лидов', v: String(dealSources.length), t: 'ok' },
            ].map((k) => (
              <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
                <div className="text-xs text-muted-foreground mb-1">{k.l}</div>
                <div className={`font-display font-extrabold text-2xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : 'text-gold'}`}>{k.v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
              <h3 className="font-display font-bold text-base mb-4">Лиды по источникам (из сделок)</h3>
              {dealSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Пока нет сделок с указанным источником</div>
              ) : (
                <div className="space-y-3">
                  {dealSources.map((d) => (
                    <div key={d.source} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
                        <Icon name={iconFor(d.source)} size={16} className="text-gold" fallback="Globe" />
                      </div>
                      <span className="text-[13px] w-28 text-foreground truncate shrink-0">{d.source}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gold-gradient" style={{ width: `${(d.leadsCount / maxLeads) * 100}%` }} />
                      </div>
                      <span className="text-[12px] font-semibold w-6 text-right text-foreground shrink-0">{d.leadsCount}</span>
                      <span className="text-[11px] text-muted-foreground w-24 text-right shrink-0">{fmtSum(d.totalSum)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
              <h3 className="font-display font-bold text-base mb-4">Каналы (справочник)</h3>
              {sources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Каналов пока нет</div>
              ) : (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/60">
                      <div className="w-8 h-8 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
                        <Icon name={iconFor(s.name)} size={16} className="text-gold" fallback="Globe" />
                      </div>
                      <span className="text-[13px] text-foreground flex-1 truncate">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">{s.channelType || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
            <h3 className="font-display font-bold text-base mb-4">Бюджеты по периодам</h3>
            {budgets.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Бюджетов пока нет</div>
            ) : (
              <div className="table-responsive">
                <table className="w-full text-sm min-w-[550px]">
                  <thead>
                    <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                      <th className="font-medium pb-2 pr-3">Канал</th>
                      <th className="font-medium pb-2 pr-3">Период</th>
                      <th className="font-medium pb-2 pr-3">Бюджет</th>
                      <th className="font-medium pb-2 pr-3">Лидов</th>
                      <th className="font-medium pb-2">CPL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((b) => (
                      <tr key={b.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-3 text-foreground font-medium truncate max-w-[140px]">{b.sourceName}</td>
                        <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{new Date(b.periodMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</td>
                        <td className="py-3 pr-3 text-foreground whitespace-nowrap">{fmtSum(b.budgetSum)}</td>
                        <td className="py-3 pr-3 font-semibold text-foreground">{b.leadsCount}</td>
                        <td className="py-3 text-foreground whitespace-nowrap">{b.leadsCount > 0 ? fmtSum(Math.round(b.budgetSum / b.leadsCount)) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Новый бюджет modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Бюджет на канал" icon="Megaphone" size="sm">
        <form onSubmit={handleCreate} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Канал *</label>
            <select value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите канал...</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Период *</label>
            <input value={form.periodMonth} onChange={(e) => setForm({ ...form, periodMonth: e.target.value })} type="date"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Бюджет</label>
              <input value={form.budgetSum} onChange={(e) => setForm({ ...form, budgetSum: e.target.value })} type="number" placeholder="45000"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Лидов</label>
              <input value={form.leadsCount} onChange={(e) => setForm({ ...form, leadsCount: e.target.value })} type="number" placeholder="0"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Добавить
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Marketing;
