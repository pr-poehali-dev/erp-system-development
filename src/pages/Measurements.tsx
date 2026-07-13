import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

const tabs = ['Все замеры', 'Первичные', 'Контрольные', 'Назначенные', 'Выполненные', 'Перенесенные', 'Отмененные'];

interface MeasurementRow {
  id: number; code: string; clientId: number; clientName: string; measureType: string;
  objectType?: string; objectName?: string; address?: string; measureDate: string;
  measureTime?: string; managerId?: number; managerName?: string; status: string;
  resultNotes?: string;
}
interface ClientOpt { id: number; fullName: string; }
interface EmployeeOpt { id: number; firstName: string; lastName: string; }

const statusRu: Record<string, string> = { scheduled: 'Назначен', confirmed: 'Подтверждён', done: 'Выполнен', postponed: 'Перенесён', cancelled: 'Отменён' };
const statusBg: Record<string, string> = {
  scheduled: 'bg-status-warn/15 text-status-warn',
  confirmed: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  done: 'bg-status-ok/15 text-status-ok',
  postponed: 'bg-status-warn/15 text-status-warn',
  cancelled: 'bg-status-crit/15 text-status-crit',
};
const measureTypeRu: Record<string, string> = { primary: 'Первичный', control: 'Контрольный' };

const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

const emptyForm = { clientId: '', measureType: 'primary', objectType: '', objectName: '', address: '', measureDate: '', measureTime: '10:00', managerId: '' };

const Measurements = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('Все замеры');
  const [items, setItems] = useState<MeasurementRow[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
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
      const data = await api<{ measurements: MeasurementRow[] }>('sales', { params: { resource: 'measurements' } });
      setItems(data.measurements);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить замеры');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([
        api<{ clients: ClientOpt[] }>('crm', { params: { resource: 'clients' } }),
        api<{ employees: EmployeeOpt[] }>('employees'),
      ]);
      setClients(c.clients);
      setEmployees(e.employees);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const filtered = items.filter((m) => {
    if (activeTab === 'Все замеры') return true;
    if (activeTab === 'Первичные') return m.measureType === 'primary';
    if (activeTab === 'Контрольные') return m.measureType === 'control';
    if (activeTab === 'Назначенные') return m.status === 'scheduled';
    if (activeTab === 'Выполненные') return m.status === 'done';
    if (activeTab === 'Перенесенные') return m.status === 'postponed';
    if (activeTab === 'Отмененные') return m.status === 'cancelled';
    return true;
  });

  const sel = items.find((m) => m.id === selId);

  const kpis = [
    { label: 'Всего', value: items.length, icon: 'Calendar', c: 'gold' },
    { label: 'Назначены', value: items.filter((m) => m.status === 'scheduled').length, icon: 'Clock', c: 'warn' },
    { label: 'Выполнены', value: items.filter((m) => m.status === 'done').length, icon: 'CheckCircle', c: 'ok' },
    { label: 'Перенесены', value: items.filter((m) => m.status === 'postponed').length, icon: 'RefreshCw', c: 'warn' },
    { label: 'Отменены', value: items.filter((m) => m.status === 'cancelled').length, icon: 'XCircle', c: 'crit' },
    { label: 'Контрольные', value: items.filter((m) => m.measureType === 'control').length, icon: 'ClipboardCheck', c: 'gold' },
  ];
  const kpiColor: Record<string, string> = { ok: 'text-status-ok', gold: 'text-gold', warn: 'text-status-warn', crit: 'text-status-crit' };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.measureDate) {
      toastError('Укажите клиента и дату замера');
      return;
    }
    setSubmitting(true);
    try {
      await api('sales', {
        method: 'POST',
        params: { resource: 'measurements' },
        body: {
          clientId: Number(form.clientId), measureType: form.measureType,
          objectType: form.objectType.trim() || undefined, objectName: form.objectName.trim() || undefined,
          address: form.address.trim() || undefined, measureDate: form.measureDate,
          measureTime: form.measureTime, managerId: form.managerId ? Number(form.managerId) : undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Замер назначен', 'Менеджер получил уведомление');
      await load();
    } catch (err) {
      toastError('Не удалось назначить замер', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!sel) return;
    try {
      await api('sales', { method: 'PUT', params: { resource: 'measurements' }, body: { id: sel.id, status } });
      success('Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout
      title="Замеры"
      titleIcon="Ruler"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новый замер</span>
        </button>
      }
    >
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {kpis.map((k, i) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 text-center" style={{ animationDelay: `${i * 50}ms` }}>
            <Icon name={k.icon} size={18} className={`mx-auto mb-1 ${kpiColor[k.c]}`} />
            <div className={`font-display font-extrabold text-2xl ${kpiColor[k.c]}`}>{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${activeTab === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 min-w-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Замеры не найдены</div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">Дата и время</th>
                  <th className="font-medium pb-2 pr-3">Клиент / Объект</th>
                  <th className="font-medium pb-2 pr-3">Тип</th>
                  <th className="font-medium pb-2 pr-3">Менеджер</th>
                  <th className="font-medium pb-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} onClick={() => setSelId(m.id)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-3">
                      <div className="font-semibold text-foreground whitespace-nowrap">{new Date(m.measureDate).toLocaleDateString('ru-RU')}</div>
                      <div className="text-[11px] text-muted-foreground">{m.measureTime?.slice(0, 5)}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-foreground font-medium truncate max-w-[160px]">{m.clientName}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{m.objectName || m.objectType || m.address || '—'}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${m.measureType === 'control' ? 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]' : 'bg-muted text-muted-foreground'}`}>{measureTypeRu[m.measureType]}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center text-[9px] font-bold text-gold shrink-0">{m.managerName ? initialsOf(m.managerName) : '?'}</div>
                        <span className="text-[12px] text-foreground truncate">{m.managerName || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[m.status] || statusBg.scheduled}`}>{statusRu[m.status] || m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail modal ── */}
      <Modal
        open={!!sel}
        onClose={() => setSelId(null)}
        title={sel ? `Замер ${sel.code}` : ''}
        subtitle={sel ? `${new Date(sel.measureDate).toLocaleDateString('ru-RU')} в ${sel.measureTime?.slice(0, 5)} · ${measureTypeRu[sel.measureType]}` : ''}
        icon="Ruler"
        size="sm"
        badge={sel ? { label: statusRu[sel.status] || sel.status, tone: sel.status === 'done' ? 'ok' : sel.status === 'cancelled' ? 'crit' : 'warn' } : undefined}
      >
        {sel && (
          <div className="space-y-4 pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Клиент</div>
                <div className="text-[13px] font-semibold text-foreground truncate">{sel.clientName}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">Объект</div>
                <div className="text-[13px] text-foreground truncate">{sel.objectType || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] text-muted-foreground mb-1">Адрес</div>
                <div className="text-[13px] text-foreground">{sel.objectName ? `${sel.objectName}, ` : ''}{sel.address || '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[11px] text-muted-foreground mb-1">Менеджер</div>
                <div className="text-[13px] text-foreground">{sel.managerName || '—'}</div>
              </div>
            </div>

            {sel.resultNotes && (
              <div>
                <div className="text-[11px] text-muted-foreground mb-2">Заметки</div>
                <div className="bg-secondary rounded-xl p-3 text-[12px] text-foreground leading-relaxed">{sel.resultNotes}</div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {sel.status !== 'done' && (
                <button onClick={() => handleStatusChange('done')} className="flex-1 py-2.5 rounded-xl gold-gradient text-background font-semibold text-sm flex items-center justify-center gap-2 min-w-[130px]">
                  <Icon name="CheckCircle" size={15} /> Выполнен
                </button>
              )}
              {sel.status === 'scheduled' && (
                <button onClick={() => handleStatusChange('confirmed')} className="flex-1 py-2.5 rounded-xl border border-border bg-secondary text-sm font-medium text-foreground hover:border-gold/30 transition-colors min-w-[130px]">
                  Подтвердить
                </button>
              )}
            </div>
            {sel.status !== 'cancelled' && (
              <button onClick={() => handleStatusChange('cancelled')} className="w-full py-2.5 rounded-xl border border-status-crit/30 text-status-crit text-sm hover:bg-status-crit/10 transition-colors">
                Отменить замер
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Новый замер modal ── */}
      <Modal
        open={showNew}
        onClose={() => { setShowNew(false); setForm(emptyForm); }}
        title="Назначить замер"
        subtitle="Первичный или контрольный"
        icon="Ruler"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Тип замера</label>
            <div className="grid grid-cols-2 gap-3">
              {[['primary', 'Ruler', 'Первичный', 'Первый визит к клиенту'], ['control', 'ClipboardCheck', 'Контрольный', 'Перед запуском в производство']].map(([v, ic, l, sub]) => (
                <button type="button" key={v} onClick={() => setForm({ ...form, measureType: v })}
                  className={`p-3.5 rounded-xl text-left border transition-all ${form.measureType === v ? 'border-gold/40 bg-gold/8' : 'border-border bg-secondary hover:border-gold/25'}`}>
                  <Icon name={ic} size={18} className={form.measureType === v ? 'text-gold mb-2' : 'text-muted-foreground mb-2'} />
                  <div className={`text-[13px] font-semibold ${form.measureType === v ? 'text-gold' : 'text-foreground'}`}>{l}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Клиент *</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 transition-colors text-foreground">
              <option value="">Выберите клиента...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Адрес объекта</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="MapPin" size={15} className="text-gold shrink-0" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Симферополь, ЖК «Парковый», кв. 45" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Calendar" size={15} className="text-gold shrink-0" />
                <input type="date" value={form.measureDate} onChange={(e) => setForm({ ...form, measureDate: e.target.value })} className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Время</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Clock" size={15} className="text-gold shrink-0" />
                <input type="time" value={form.measureTime} onChange={(e) => setForm({ ...form, measureTime: e.target.value })} className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Замерщик / Менеджер</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((m) => (
                <button type="button" key={m.id} onClick={() => setForm({ ...form, managerId: String(m.id) })}
                  className={`px-3 py-2 rounded-xl text-[12px] border transition-all ${form.managerId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {m.firstName} {m.lastName[0]}.
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Ruler" size={16} />}
              Назначить замер
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

export default Measurements;
