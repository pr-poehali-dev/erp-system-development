import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import InlineEditField from '@/components/InlineEditField';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface SpecRow {
  id: number; code: string; orderId: number; orderCode?: string; clientName?: string;
  itemType?: string; designerId?: number; designerName?: string; status: string;
  materials?: string; progressPct: number; deadline?: string; createdAt: string;
}
interface OrderOpt { id: number; code: string; clientName: string; }
interface EmployeeOpt { id: number; firstName: string; lastName: string; }

const statusRu: Record<string, string> = { draft: 'Черновик', in_progress: 'В работе', review: 'На проверке', approved: 'Согласовано', revision: 'Требует правки' };
const statusBg: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-status-warn/15 text-status-warn',
  review: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  approved: 'bg-status-ok/15 text-status-ok',
  revision: 'bg-status-crit/15 text-status-crit',
};

const emptyForm = { orderId: '', materials: '', deadline: '', designerId: '' };

const Technology = () => {
  const { success, error: toastError } = useToast();
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ specifications: SpecRow[] }>('sales', { params: { resource: 'specifications' } });
      setSpecs(data.specifications);
      if (!selId && data.specifications.length > 0) setSelId(data.specifications[0].id);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить технические задания');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [o, e] = await Promise.all([
        api<{ orders: { id: number; code: string; clientName: string }[] }>('operations', { params: { resource: 'orders' } }),
        api<{ employees: EmployeeOpt[] }>('employees'),
      ]);
      setOrders(o.orders.map((r) => ({ id: r.id, code: r.code, clientName: r.clientName })));
      setEmployees(e.employees);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const sel = specs.find((s) => s.id === selId);

  const stats = {
    inProgress: specs.filter((s) => s.status === 'in_progress').length,
    review: specs.filter((s) => s.status === 'review').length,
    approved: specs.filter((s) => s.status === 'approved').length,
    revision: specs.filter((s) => s.status === 'revision').length,
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.orderId) {
      toastError('Выберите заказ');
      return;
    }
    setSubmitting(true);
    try {
      await api('sales', {
        method: 'POST',
        params: { resource: 'specifications' },
        body: {
          orderId: Number(form.orderId), materials: form.materials.trim() || undefined,
          deadline: form.deadline || undefined, designerId: form.designerId ? Number(form.designerId) : undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('ТЗ создано');
      await load();
    } catch (err) {
      toastError('Не удалось создать ТЗ', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    body[field] = field === 'progressPct' ? Number(value) : (value || null);
    await api('sales', { method: 'PUT', params: { resource: 'specifications' }, body });
    await load();
  };

  const handleApprove = async () => {
    if (!sel) return;
    try {
      await api('sales', { method: 'PUT', params: { resource: 'specifications' }, body: { id: sel.id, status: 'approved', progressPct: 100 } });
      success('ТЗ согласовано');
      await load();
    } catch (err) {
      toastError('Не удалось согласовать', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Технология" titleIcon="Cog" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новое ТЗ</span>
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'В работе', v: stats.inProgress, t: 'warn' },
          { l: 'На проверке', v: stats.review, t: 'info' },
          { l: 'Согласовано', v: stats.approved, t: 'ok' },
          { l: 'Требуют правки', v: stats.revision, t: 'crit' },
        ].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <h3 className="font-display font-bold text-base mb-4">Технические задания</h3>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : specs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Технических заданий пока нет</div>
          ) : (
            <div className="space-y-3">
              {specs.map((s) => (
                <div key={s.id} onClick={() => setSelId(s.id)} className={`p-4 rounded-xl cursor-pointer transition-colors border ${selId === s.id ? 'border-gold/40 bg-gold/8' : 'border-border bg-secondary hover:border-gold/20'}`}>
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gold shrink-0">{s.code}</span>
                      <span className="text-muted-foreground shrink-0">→</span>
                      <span className="font-medium text-foreground text-[13px] truncate">Заказ {s.orderCode}</span>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded shrink-0 ${statusBg[s.status] || statusBg.draft}`}>{statusRu[s.status] || s.status}</span>
                  </div>
                  <div className="text-[13px] text-foreground mb-1 truncate">{s.clientName} — {s.itemType || '—'}</div>
                  <div className="text-[11px] text-muted-foreground mb-3 truncate">Материалы: {s.materials || '—'} · Дизайнер: {s.designerName || '—'}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${s.progressPct === 100 ? 'bg-status-ok' : s.progressPct >= 60 ? 'bg-gold' : 'bg-status-warn'}`} style={{ width: `${s.progressPct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-foreground w-8 text-right shrink-0">{s.progressPct}%</span>
                    {s.deadline && <span className="text-[11px] text-muted-foreground shrink-0">до {new Date(s.deadline).toLocaleDateString('ru-RU')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {sel && (
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 self-start xl:sticky xl:top-[85px] min-w-0">
            <div className="flex items-start justify-between mb-4 gap-2">
              <div className="min-w-0">
                <h2 className="font-display font-extrabold text-lg text-foreground truncate">{sel.code}</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sel.clientName} · {sel.itemType || '—'}</p>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${statusBg[sel.status] || statusBg.draft}`}>{statusRu[sel.status] || sel.status}</span>
            </div>

            <div className="space-y-3">
              <InlineEditField
                label="Материалы" icon="Package" type="text" value={sel.materials || ''}
                placeholder="МДФ 18мм, Кварц, Blum..."
                onSave={(v) => handleFieldSave(sel.id, 'materials', v)}
              />
              <InlineEditField
                label="Дизайнер / Технолог" icon="UserCircle" type="select"
                value={sel.designerId ? String(sel.designerId) : ''}
                options={[
                  { value: '', label: '— не назначен —' },
                  ...employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` })),
                ]}
                onSave={(v) => handleFieldSave(sel.id, 'designerId', v)}
              />
              <InlineEditField
                label="Срок" icon="Calendar" type="date" value={sel.deadline ? sel.deadline.slice(0, 10) : ''}
                onSave={(v) => handleFieldSave(sel.id, 'deadline', v)}
              />
              <InlineEditField
                label="Готовность, %" icon="TrendingUp" type="number" value={String(sel.progressPct ?? 0)}
                onSave={(v) => handleFieldSave(sel.id, 'progressPct', v)}
              />
            </div>

            <div className="mt-4 mb-2">
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-muted-foreground">Готовность</span>
                <span className="font-bold text-gold">{sel.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${sel.progressPct}%` }} />
              </div>
            </div>

            {sel.status !== 'approved' && (
              <button onClick={handleApprove} className="w-full mt-3 py-2.5 rounded-xl bg-status-ok/15 text-status-ok text-sm font-medium hover:bg-status-ok/20 transition-colors">
                Согласовать ТЗ
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Новое ТЗ modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Новое техническое задание" icon="Cog" size="md">
        <form onSubmit={handleCreate} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Заказ *</label>
            <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите заказ...</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.code} — {o.clientName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Материалы</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Package" size={15} className="text-gold shrink-0" />
              <input value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} placeholder="МДФ 18мм, Кварц, Blum..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Срок</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Calendar" size={15} className="text-gold shrink-0" />
              <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} type="date" className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Дизайнер / Технолог</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((e) => (
                <button type="button" key={e.id} onClick={() => setForm({ ...form, designerId: String(e.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.designerId === String(e.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {e.firstName} {e.lastName}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Создать ТЗ
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Technology;
