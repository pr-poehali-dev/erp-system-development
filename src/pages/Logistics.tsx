import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import InlineEditField from '@/components/InlineEditField';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface Vehicle { id: number; name: string; status: string; tripsToday: number; }
interface Shipment {
  id: number; orderId: number; orderCode?: string; clientName?: string; address?: string;
  shipDate: string; shipTimeRange?: string; vehicleId?: number; vehicleName?: string; status: string; sum: number;
}
interface OrderOpt { id: number; code: string; clientName: string; }

const statusRu: Record<string, string> = { scheduled: 'Запланировано', confirmed: 'Подтверждено', in_transit: 'В пути', delivered: 'Доставлено' };
const statusBg: Record<string, string> = {
  scheduled: 'bg-muted text-muted-foreground',
  confirmed: 'bg-status-ok/15 text-status-ok',
  in_transit: 'bg-status-warn/15 text-status-warn',
  delivered: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
};
const vehicleStatusBg: Record<string, string> = {
  available: 'bg-status-ok/15 text-status-ok',
  on_trip: 'bg-status-warn/15 text-status-warn',
  maintenance: 'bg-muted text-muted-foreground',
};
const vehicleStatusRu: Record<string, string> = { available: 'Свободен', on_trip: 'В рейсе', maintenance: 'Плановое ТО' };
const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;

const emptyForm = { orderId: '', address: '', shipDate: '', shipTimeRange: '', vehicleId: '' };

const Logistics = () => {
  const { success, error: toastError } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
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
      const data = await api<{ vehicles: Vehicle[]; shipments: Shipment[] }>('operations', { params: { resource: 'logistics' } });
      setVehicles(data.vehicles);
      setShipments(data.shipments);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные логистики');
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

  const sel = shipments.find((s) => s.id === selId);

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    today: shipments.filter((s) => s.shipDate?.slice(0, 10) === today).length,
    week: shipments.length,
    inTransit: shipments.filter((s) => s.status === 'in_transit').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.shipDate) {
      toastError('Выберите заказ и дату отгрузки');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'logistics' },
        body: {
          orderId: Number(form.orderId), address: form.address.trim() || undefined,
          shipDate: form.shipDate, shipTimeRange: form.shipTimeRange.trim() || undefined,
          vehicleId: form.vehicleId ? Number(form.vehicleId) : undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Доставка запланирована');
      await load();
    } catch (err) {
      toastError('Не удалось создать доставку', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    if (field === 'vehicleId') body.vehicleId = value ? Number(value) : null;
    else body[field] = value;
    await api('operations', { method: 'PUT', params: { resource: 'logistics' }, body });
    await load();
  };

  const handleStatusChange = async (status: string) => {
    if (!sel) return;
    try {
      await api('operations', { method: 'PUT', params: { resource: 'logistics' }, body: { id: sel.id, status } });
      success('Статус обновлён');
      await load();
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout title="Логистика" titleIcon="Truck" actions={
      <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
        <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новая доставка</span>
      </button>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Доставок сегодня', v: stats.today, t: 'gold' },
          { l: 'Всего запланировано', v: stats.week, t: 'info' },
          { l: 'В пути', v: stats.inTransit, t: 'warn' },
          { l: 'Доставлено', v: stats.delivered, t: 'ok' },
        ].map((k) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.t === 'ok' ? 'text-status-ok' : k.t === 'warn' ? 'text-status-warn' : k.t === 'crit' ? 'text-status-crit' : k.t === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.v}</div>
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <h3 className="font-display font-bold text-base mb-4">График доставок</h3>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Доставок пока нет</div>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => (
                <div key={s.id} onClick={() => setSelId(s.id)} className="flex items-center gap-4 p-3.5 rounded-xl bg-secondary border border-border hover:border-gold/30 transition-colors cursor-pointer">
                  <div className="shrink-0 text-center w-20">
                    <div className="text-[11px] text-muted-foreground">{new Date(s.shipDate).toLocaleDateString('ru-RU')}</div>
                    <div className="font-semibold text-[13px] text-foreground">{s.shipTimeRange || '—'}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gold text-[13px]">Заказ {s.orderCode}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusBg[s.status] || statusBg.scheduled}`}>{statusRu[s.status] || s.status}</span>
                    </div>
                    <div className="text-[13px] text-foreground truncate">{s.clientName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.address || '—'}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-muted-foreground">{s.vehicleName || '—'}</div>
                    <div className="text-[12px] font-semibold text-foreground mt-1">{fmtSum(s.sum)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-[13px] text-foreground truncate">{v.name}</div>
                  <div className="text-[11px] text-muted-foreground">{v.tripsToday} рейсов сегодня</div>
                </div>
                <span className={`text-[11px] px-2 py-1 rounded-md shrink-0 ${vehicleStatusBg[v.status] || vehicleStatusBg.available}`}>{vehicleStatusRu[v.status] || v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Shipment detail modal ── */}
      <Modal open={!!sel} onClose={() => setSelId(null)} title={sel ? `Заказ ${sel.orderCode}` : ''} subtitle={sel?.clientName} icon="Truck" size="sm"
        badge={sel ? { label: statusRu[sel.status] || sel.status, tone: sel.status === 'delivered' ? 'ok' : 'warn' } : undefined}>
        {sel && (
          <div className="space-y-4 pb-2">
            <InlineEditField label="Адрес" icon="MapPin" type="text" value={sel.address || ''} onSave={(v) => handleFieldSave(sel.id, 'address', v)} />
            <InlineEditField
              label="Автомобиль" icon="Truck" type="select" value={sel.vehicleId ? String(sel.vehicleId) : ''}
              options={[{ value: '', label: '— не назначен —' }, ...vehicles.map((v) => ({ value: String(v.id), label: v.name }))]}
              onSave={(v) => handleFieldSave(sel.id, 'vehicleId', v)}
            />
            <InlineEditField label="Дата" icon="Calendar" type="date" value={sel.shipDate?.slice(0, 10) || ''} onSave={(v) => handleFieldSave(sel.id, 'shipDate', v)} />
            <div className="flex flex-wrap gap-2">
              {[['scheduled', 'Запланировано'], ['confirmed', 'Подтверждено'], ['in_transit', 'В пути'], ['delivered', 'Доставлено']].map(([v, l]) => (
                <button key={v} onClick={() => handleStatusChange(v)} disabled={sel.status === v}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${sel.status === v ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Новая доставка modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Новая доставка" icon="Truck" size="md">
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
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Адрес доставки</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ЖК «Центральный», ул. Багратионовская, 5"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата *</label>
              <input value={form.shipDate} onChange={(e) => setForm({ ...form, shipDate: e.target.value })} type="date"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Время</label>
              <input value={form.shipTimeRange} onChange={(e) => setForm({ ...form, shipTimeRange: e.target.value })} placeholder="10:00—12:00"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Автомобиль</label>
            <div className="flex gap-2 flex-wrap">
              {vehicles.map((v) => (
                <button type="button" key={v.id} onClick={() => setForm({ ...form, vehicleId: String(v.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.vehicleId === String(v.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Запланировать доставку
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Logistics;
