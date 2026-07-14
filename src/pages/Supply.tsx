import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import InlineEditField from '@/components/InlineEditField';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface SupplyRequest {
  id: number; code: string; orderId?: number; orderCode?: string; materialName: string;
  qty: number; unit?: string; supplierId?: number; supplierName?: string; status: string;
  sum: number; createdAt: string;
}
interface SupplierOpt { id: number; name: string; }
interface OrderOpt { id: number; code: string; }

const statusRu: Record<string, string> = { pending: 'Ожидает подтверждения', confirmed: 'Подтверждено', in_transit: 'В пути', out_of_stock: 'Нет в наличии' };
const statusBg: Record<string, string> = {
  pending: 'bg-status-warn/15 text-status-warn',
  confirmed: 'bg-status-ok/15 text-status-ok',
  in_transit: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  out_of_stock: 'bg-status-crit/15 text-status-crit',
};
const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;

const emptyForm = { materialName: '', qty: '', unit: 'шт.', supplierId: '', orderId: '', sum: '' };

const Supply = () => {
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOpt[]>([]);
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ requests: SupplyRequest[] }>('operations', { params: { resource: 'supply' } });
      setRequests(data.requests);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        api<{ suppliers: SupplierOpt[] }>('operations', { params: { resource: 'supply', action: 'suppliers' } }),
        api<{ orders: { id: number; code: string }[] }>('operations', { params: { resource: 'orders' } }),
      ]);
      setSuppliers(s.suppliers);
      setOrders(o.orders.map((r) => ({ id: r.id, code: r.code })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const filtered = requests.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return r.materialName.toLowerCase().includes(q) || (r.supplierName || '').toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
  });

  const sel = requests.find((r) => r.id === selId);

  const stats = {
    open: requests.filter((r) => r.status === 'pending').length,
    confirmed: requests.filter((r) => r.status === 'confirmed').length,
    inTransit: requests.filter((r) => r.status === 'in_transit').length,
    problematic: requests.filter((r) => r.status === 'out_of_stock').length,
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.materialName.trim() || !form.qty) {
      toastError('Укажите материал и количество');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'supply' },
        body: {
          materialName: form.materialName.trim(), qty: Number(form.qty), unit: form.unit,
          supplierId: form.supplierId ? Number(form.supplierId) : undefined,
          orderId: form.orderId ? Number(form.orderId) : undefined,
          sum: form.sum ? Number(form.sum) : 0,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Заявка создана', 'Отправлена на согласование поставщику');
      await load();
    } catch (err) {
      toastError('Не удалось создать заявку', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    if (field === 'sum') body.sum = value ? Number(value) : 0;
    else if (field === 'supplierId') body.supplierId = value ? Number(value) : null;
    else body[field] = value;
    await api('operations', { method: 'PUT', params: { resource: 'supply' }, body });
    await load();
  };

  const handleStatusChange = async (status: string) => {
    if (!sel) return;
    try {
      await api('operations', { method: 'PUT', params: { resource: 'supply' }, body: { id: sel.id, status } });
      success('Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Снабжение" titleIcon="PackageSearch" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новая заявка</span>
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Открытых заявок', v: stats.open, t: 'warn' },
          { l: 'Подтверждено', v: stats.confirmed, t: 'ok' },
          { l: 'В пути', v: stats.inTransit, t: 'info' },
          { l: 'Проблемных', v: stats.problematic, t: 'crit' },
        ].map((k) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : 'text-[hsl(199_60%_60%)]'}`}>{k.v}</div>
            <div className="text-[12px] text-muted-foreground">{k.l}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h3 className="font-display font-bold text-base">Заявки на материалы</h3>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary">
              <Icon name="Search" size={14} className="text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="bg-transparent text-sm outline-none w-32 text-foreground placeholder:text-muted-foreground" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Заявок не найдено</div>
          ) : (
            <div className="table-responsive">
              <table className="w-full text-sm min-w-[650px]">
                <thead>
                  <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                    <th className="font-medium pb-2 pr-3">№ заявки</th>
                    <th className="font-medium pb-2 pr-3">Материал</th>
                    <th className="font-medium pb-2 pr-3">Кол-во</th>
                    <th className="font-medium pb-2 pr-3">Поставщик</th>
                    <th className="font-medium pb-2 pr-3">Сумма</th>
                    <th className="font-medium pb-2">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} onClick={() => setSelId(r.id)} className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="py-3 pr-3 font-semibold text-gold">{r.code}</td>
                      <td className="py-3 pr-3 text-foreground truncate max-w-[160px]">{r.materialName}</td>
                      <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{r.qty} {r.unit}</td>
                      <td className="py-3 pr-3 text-foreground truncate max-w-[120px]">{r.supplierName || '—'}</td>
                      <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{fmtSum(r.sum)}</td>
                      <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[r.status] || statusBg.pending}`}>{statusRu[r.status] || r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {sel && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start xl:sticky xl:top-[85px] min-w-0">
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="min-w-0">
                <h2 className="font-display font-extrabold text-lg text-foreground truncate">{sel.code}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sel.orderCode ? `Заказ ${sel.orderCode}` : 'Без привязки к заказу'}</p>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${statusBg[sel.status] || statusBg.pending}`}>{statusRu[sel.status] || sel.status}</span>
            </div>

            <div className="space-y-3">
              <InlineEditField
                label="Материал" icon="Package" type="text" value={sel.materialName}
                onSave={(v) => handleFieldSave(sel.id, 'materialName', v)}
              />
              <InlineEditField
                label="Поставщик" icon="Truck" type="select"
                value={sel.supplierId ? String(sel.supplierId) : ''}
                options={[
                  { value: '', label: '— не выбран —' },
                  ...suppliers.map((s) => ({ value: String(s.id), label: s.name })),
                ]}
                onSave={(v) => handleFieldSave(sel.id, 'supplierId', v)}
              />
              <InlineEditField
                label="Сумма" icon="CircleDollarSign" type="number" value={String(sel.sum ?? '')}
                onSave={(v) => handleFieldSave(sel.id, 'sum', v)}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {[['pending', 'Ожидает'], ['confirmed', 'Подтверждено'], ['in_transit', 'В пути'], ['out_of_stock', 'Нет в наличии']].map(([v, l]) => (
                <button key={v} onClick={() => handleStatusChange(v)} disabled={sel.status === v}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${sel.status === v ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Новая заявка modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Новая заявка на материалы" icon="PackageSearch" size="md">
        <form onSubmit={handleCreate} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Материал *</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Package" size={15} className="text-gold shrink-0" />
              <input value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} placeholder="МДФ 18мм белый глянец" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Количество *</label>
              <input value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} type="number" placeholder="150"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Ед. измерения</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="листов, шт., п.м."
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Поставщик</label>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">— не выбран —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Заказ</label>
            <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Без привязки</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.code}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Сумма</label>
            <input value={form.sum} onChange={(e) => setForm({ ...form, sum: e.target.value })} type="number" placeholder="0"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Создать заявку
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Supply;
