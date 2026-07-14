import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import InlineEditField from '@/components/InlineEditField';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface ChecklistItem { item: string; done: boolean; }
interface ControlMeasurement {
  id: number; code: string; orderId?: number; orderCode?: string; clientId: number; clientName: string;
  objectType?: string; measureDate: string; measureTime?: string; managerId?: number; managerName?: string;
  status: string; resultNotes?: string; checklist: ChecklistItem[];
}
interface ClientOpt { id: number; fullName: string; }
interface EmployeeOpt { id: number; firstName: string; lastName: string; }
interface OrderOpt { id: number; code: string; }

const statusRu: Record<string, string> = { scheduled: 'Назначен', confirmed: 'Подтверждён', done: 'Выполнен', revision: 'Требует правки' };
const statusBg: Record<string, string> = {
  scheduled: 'bg-status-warn/15 text-status-warn',
  confirmed: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  done: 'bg-status-ok/15 text-status-ok',
  revision: 'bg-status-crit/15 text-status-crit',
};

const emptyForm = { clientId: '', orderId: '', objectType: '', measureDate: '', measureTime: '10:00', managerId: '' };

const ControlMeasurements = () => {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<ControlMeasurement[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [orders, setOrders] = useState<OrderOpt[]>([]);
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
      const data = await api<{ controlMeasurements: ControlMeasurement[] }>('sales', { params: { resource: 'controlMeasurements' } });
      setItems(data.controlMeasurements);
      if (!selId && data.controlMeasurements.length > 0) setSelId(data.controlMeasurements[0].id);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить контрольные замеры');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [c, e, o] = await Promise.all([
        api<{ clients: ClientOpt[] }>('crm', { params: { resource: 'clients' } }),
        api<{ employees: EmployeeOpt[] }>('employees'),
        api<{ orders: { id: number; code: string }[] }>('operations', { params: { resource: 'orders' } }),
      ]);
      setClients(c.clients);
      setEmployees(e.employees);
      setOrders(o.orders.map((r) => ({ id: r.id, code: r.code })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const sel = items.find((i) => i.id === selId);

  const thisMonth = new Date().getMonth();
  const stats = {
    scheduled: items.filter((i) => i.status === 'scheduled' || i.status === 'confirmed').length,
    done: items.filter((i) => i.status === 'done').length,
    revision: items.filter((i) => i.status === 'revision').length,
    thisMonth: items.filter((i) => new Date(i.measureDate).getMonth() === thisMonth).length,
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.measureDate) {
      toastError('Укажите клиента и дату замера');
      return;
    }
    setSubmitting(true);
    try {
      await api('sales', {
        method: 'POST',
        params: { resource: 'controlMeasurements' },
        body: {
          clientId: Number(form.clientId), orderId: form.orderId ? Number(form.orderId) : undefined,
          objectType: form.objectType.trim() || undefined, measureDate: form.measureDate,
          measureTime: form.measureTime, managerId: form.managerId ? Number(form.managerId) : undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Контрольный замер назначен');
      await load();
    } catch (err) {
      toastError('Не удалось назначить замер', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    body[field] = field === 'managerId' ? (value ? Number(value) : null) : (value || null);
    await api('sales', { method: 'PUT', params: { resource: 'controlMeasurements' }, body });
    await load();
  };

  const handleToggleChecklistItem = async (idx: number) => {
    if (!sel) return;
    const updated = sel.checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c);
    try {
      await api('sales', { method: 'PUT', params: { resource: 'controlMeasurements' }, body: { id: sel.id, checklist: updated } });
      await load();
    } catch (err) {
      toastError('Не удалось обновить чек-лист', err instanceof ApiError ? err.message : undefined);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!sel) return;
    try {
      await api('sales', { method: 'PUT', params: { resource: 'controlMeasurements' }, body: { id: sel.id, status } });
      success('Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Контрольные замеры" titleIcon="ClipboardCheck" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Назначить контрольный замер</span>
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Назначены', v: stats.scheduled, t: 'warn' },
          { l: 'Выполнены', v: stats.done, t: 'ok' },
          { l: 'Требуют правки', v: stats.revision, t: 'crit' },
          { l: 'Этот месяц', v: stats.thisMonth, t: 'gold' },
        ].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : 'text-gold'}`}>{k.v}</div>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <h3 className="font-display font-bold text-base mb-4">Список контрольных замеров</h3>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Контрольных замеров пока нет</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} onClick={() => setSelId(item.id)} className={`flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-colors border ${selId === item.id ? 'border-gold/40 bg-gold/8' : 'border-border bg-secondary hover:border-gold/20'}`}>
                  <div className="shrink-0">
                    <div className="font-semibold text-gold text-[13px]">{item.code}</div>
                    {item.orderCode && <div className="text-[11px] text-muted-foreground">Заказ {item.orderCode}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{item.clientName} — {item.objectType || '—'}</div>
                    {item.resultNotes && <div className="text-[11px] mt-0.5 text-muted-foreground truncate">{item.resultNotes}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[12px] font-semibold text-foreground">{new Date(item.measureDate).toLocaleDateString('ru-RU')}</div>
                    <div className="text-[11px] text-muted-foreground">{item.measureTime?.slice(0, 5) || '—'}</div>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap ${statusBg[item.status] || statusBg.scheduled}`}>{statusRu[item.status] || item.status}</span>
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
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sel.orderCode ? `Заказ ${sel.orderCode} · ` : ''}{new Date(sel.measureDate).toLocaleDateString('ru-RU')} в {sel.measureTime?.slice(0, 5)}</p>
              </div>
              <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${statusBg[sel.status] || statusBg.scheduled}`}>{statusRu[sel.status] || sel.status}</span>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Клиент</span>
                <span className="text-foreground font-medium text-right max-w-[220px] truncate">{sel.clientName}</span>
              </div>
              <InlineEditField
                label="Тип объекта" icon="Home" type="text" value={sel.objectType || ''}
                placeholder="Кухня, гостиная..."
                onSave={(v) => handleFieldSave(sel.id, 'objectType', v)}
              />
              <InlineEditField
                label="Менеджер" icon="UserCircle" type="select"
                value={sel.managerId ? String(sel.managerId) : ''}
                options={[
                  { value: '', label: '— не назначен —' },
                  ...employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` })),
                ]}
                onSave={(v) => handleFieldSave(sel.id, 'managerId', v)}
              />
              <InlineEditField
                label="Результаты замера" icon="FileText" type="textarea" rows={2}
                value={sel.resultNotes || ''} placeholder="Расхождения, комментарии..."
                onSave={(v) => handleFieldSave(sel.id, 'resultNotes', v)}
              />
            </div>

            <div className="mb-5">
              <h4 className="text-[12px] font-semibold text-muted-foreground mb-3">Чек-лист замера</h4>
              <div className="space-y-2">
                {sel.checklist.map((c, idx) => (
                  <button key={idx} onClick={() => handleToggleChecklistItem(idx)} className="flex items-center gap-2.5 text-[12px] w-full text-left">
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${c.done ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                      {c.done && <Icon name="Check" size={10} className="text-white" />}
                    </div>
                    <span className={c.done ? 'text-muted-foreground line-through' : 'text-foreground'}>{c.item}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[['scheduled', 'Назначен'], ['confirmed', 'Подтверждён'], ['done', 'Выполнен'], ['revision', 'Требует правки']].map(([v, l]) => (
                <button key={v} onClick={() => handleStatusChange(v)} disabled={sel.status === v}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${sel.status === v ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Новый контрольный замер modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Назначить контрольный замер" icon="ClipboardCheck" size="md">
        <form onSubmit={handleCreate} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Клиент *</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите клиента...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
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
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Тип объекта</label>
            <input value={form.objectType} onChange={(e) => setForm({ ...form, objectType: e.target.value })} placeholder="Кухня, гостиная..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата *</label>
              <input value={form.measureDate} onChange={(e) => setForm({ ...form, measureDate: e.target.value })} type="date"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Время</label>
              <input value={form.measureTime} onChange={(e) => setForm({ ...form, measureTime: e.target.value })} type="time"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Менеджер</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((e) => (
                <button type="button" key={e.id} onClick={() => setForm({ ...form, managerId: String(e.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.managerId === String(e.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {e.firstName} {e.lastName}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Назначить замер
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ControlMeasurements;
