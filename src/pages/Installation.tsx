import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import InlineEditField from '@/components/InlineEditField';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface Team { id: number; name: string; members?: string; status: string; }
interface InstallationRow {
  id: number; orderId: number; orderCode?: string; clientName?: string; itemType?: string;
  address?: string; installDate: string; installTimeRange?: string; teamId?: number; teamName?: string;
  status: string; clientRating?: number | null; sum: number;
}
interface OrderOpt { id: number; code: string; clientName: string; }

const statusRu: Record<string, string> = { scheduled: 'Запланировано', in_progress: 'В процессе', done: 'Выполнено' };
const statusBg: Record<string, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  in_progress: 'bg-status-warn/15 text-status-warn',
  done: 'bg-status-ok/15 text-status-ok',
};
const teamStatusBg: Record<string, string> = {
  available: 'bg-status-ok/15 text-status-ok',
  on_site: 'bg-status-warn/15 text-status-warn',
  busy: 'bg-muted text-muted-foreground',
};
const teamStatusRu: Record<string, string> = { available: 'Свободна', on_site: 'На объекте', busy: 'Занята' };
const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;

const emptyForm = { orderId: '', address: '', installDate: '', installTimeRange: '', teamId: '' };

const Installation = () => {
  const { success, error: toastError } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [installations, setInstallations] = useState<InstallationRow[]>([]);
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selId, setSelId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ teams: Team[]; installations: InstallationRow[] }>('operations', { params: { resource: 'installations' } });
      setTeams(data.teams);
      setInstallations(data.installations);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные монтажей');
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

  const sel = installations.find((i) => i.id === selId);
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    today: installations.filter((i) => i.installDate?.slice(0, 10) === today).length,
    week: installations.length,
    done: installations.filter((i) => i.status === 'done').length,
    activeTeams: teams.filter((t) => t.status !== 'busy').length,
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.installDate) {
      toastError('Выберите заказ и дату монтажа');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'installations' },
        body: {
          orderId: Number(form.orderId), address: form.address.trim() || undefined,
          installDate: form.installDate, installTimeRange: form.installTimeRange.trim() || undefined,
          teamId: form.teamId ? Number(form.teamId) : undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Монтаж назначен');
      await load();
    } catch (err) {
      toastError('Не удалось назначить монтаж', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    if (field === 'teamId') body.teamId = value ? Number(value) : null;
    else if (field === 'clientRating') body.clientRating = value ? Number(value) : null;
    else body[field] = value;
    await api('operations', { method: 'PUT', params: { resource: 'installations' }, body });
    await load();
  };

  const handleStatusChange = async (status: string) => {
    if (!sel) return;
    try {
      await api('operations', { method: 'PUT', params: { resource: 'installations' }, body: { id: sel.id, status } });
      success('Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Монтаж" titleIcon="Wrench" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Назначить монтаж</span>
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Монтажей сегодня', v: stats.today, t: 'warn' },
          { l: 'Всего запланировано', v: stats.week, t: 'gold' },
          { l: 'Выполнено', v: stats.done, t: 'ok' },
          { l: 'Бригад свободно', v: stats.activeTeams, t: 'info' },
        ].map((k) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.v}</div>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <h3 className="font-display font-bold text-base mb-4">График монтажей</h3>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : installations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Монтажей пока нет</div>
          ) : (
            <div className="space-y-3">
              {installations.map((inst) => (
                <div key={inst.id} onClick={() => setSelId(inst.id)} className="p-4 rounded-xl bg-secondary border border-border hover:border-gold/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gold truncate">Заказ {inst.orderCode}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded shrink-0 ${statusBg[inst.status] || statusBg.scheduled}`}>{statusRu[inst.status] || inst.status}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-semibold text-foreground">{new Date(inst.installDate).toLocaleDateString('ru-RU')}</div>
                      <div className="text-[11px] text-muted-foreground">{inst.installTimeRange || '—'}</div>
                    </div>
                  </div>
                  <div className="text-[13px] font-medium text-foreground mb-1 truncate">{inst.clientName} — {inst.itemType || '—'}</div>
                  <div className="text-[11px] text-muted-foreground mb-2 truncate">{inst.address || '—'}</div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5 text-muted-foreground truncate"><Icon name="Users" size={13} className="shrink-0" />{inst.teamName || '—'}</span>
                    <span className="font-semibold text-foreground shrink-0">{fmtSum(inst.sum)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
            <h3 className="font-display font-bold text-sm mb-4">Бригады</h3>
            {teams.map((t) => (
              <div key={t.id} className="mb-3 p-3 rounded-xl bg-secondary last:mb-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="font-semibold text-[13px] text-foreground truncate">{t.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${teamStatusBg[t.status] || teamStatusBg.available}`}>{teamStatusRu[t.status] || t.status}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">{t.members || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Installation detail modal ── */}
      <Modal open={!!sel} onClose={() => setSelId(null)} title={sel ? `Заказ ${sel.orderCode}` : ''} subtitle={sel?.clientName} icon="Wrench" size="sm"
        badge={sel ? { label: statusRu[sel.status] || sel.status, tone: sel.status === 'done' ? 'ok' : 'warn' } : undefined}>
        {sel && (
          <div className="space-y-4 pb-2">
            <InlineEditField label="Адрес" icon="MapPin" type="text" value={sel.address || ''} onSave={(v) => handleFieldSave(sel.id, 'address', v)} />
            <InlineEditField
              label="Бригада" icon="Users" type="select" value={sel.teamId ? String(sel.teamId) : ''}
              options={[{ value: '', label: '— не назначена —' }, ...teams.map((t) => ({ value: String(t.id), label: t.name }))]}
              onSave={(v) => handleFieldSave(sel.id, 'teamId', v)}
            />
            <InlineEditField label="Дата" icon="Calendar" type="date" value={sel.installDate?.slice(0, 10) || ''} onSave={(v) => handleFieldSave(sel.id, 'installDate', v)} />
            {sel.status === 'done' && (
              <InlineEditField label="Оценка клиента (0-5)" icon="Star" type="number" value={sel.clientRating != null ? String(sel.clientRating) : ''} onSave={(v) => handleFieldSave(sel.id, 'clientRating', v)} />
            )}
            <div className="flex flex-wrap gap-2">
              {[['scheduled', 'Запланировано'], ['in_progress', 'В процессе'], ['done', 'Выполнено']].map(([v, l]) => (
                <button key={v} onClick={() => handleStatusChange(v)} disabled={sel.status === v}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${sel.status === v ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Новый монтаж modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Назначить монтаж" icon="Wrench" size="md">
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
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Адрес объекта</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ЖК «Сердце Крыма», наб. Салгирная, 34к2"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата *</label>
              <input value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })} type="date"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Время</label>
              <input value={form.installTimeRange} onChange={(e) => setForm({ ...form, installTimeRange: e.target.value })} placeholder="10:00—18:00"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Бригада</label>
            <div className="flex gap-2 flex-wrap">
              {teams.map((t) => (
                <button type="button" key={t.id} onClick={() => setForm({ ...form, teamId: String(t.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.teamId === String(t.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Назначить монтаж
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Installation;
