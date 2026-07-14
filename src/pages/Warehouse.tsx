import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface WarehouseItem {
  id: number; sku: string; name: string; unit: string; qty: number; minQty: number;
  reservedQty: number; available: number; price: number; location?: string; tone: string;
}

const toneCl: Record<string, string> = { ok: 'text-status-ok', warn: 'text-status-warn', crit: 'text-status-crit' };
const toneBg: Record<string, string> = { ok: 'bg-status-ok/15 text-status-ok', warn: 'bg-status-warn/15 text-status-warn', crit: 'bg-status-crit/15 text-status-crit' };
const statusRu: Record<string, string> = { ok: 'В норме', warn: 'Заканчивается', crit: 'Дефицит' };

const emptyMovementForm = { itemId: '', qty: '', comment: '' };
const emptyNewItemForm = { name: '', unit: 'шт.', qty: '', minQty: '', price: '', location: '' };

const Warehouse = () => {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showIncoming, setShowIncoming] = useState(false);
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [newItemForm, setNewItemForm] = useState(emptyNewItemForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ items: WarehouseItem[] }>('operations', { params: { resource: 'warehouse' } });
      setItems(data.items);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить остатки склада');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q);
  });

  const stats = {
    total: items.length,
    deficit: items.filter((i) => i.tone === 'crit').length,
    low: items.filter((i) => i.tone === 'warn').length,
    totalCost: items.reduce((acc, i) => acc + i.qty * i.price, 0),
  };

  const handleMovement = async (e: FormEvent, type: 'in' | 'out') => {
    e.preventDefault();
    if (!movementForm.itemId || !movementForm.qty) {
      toastError('Выберите материал и укажите количество');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'warehouse', action: 'movement' },
        body: { itemId: Number(movementForm.itemId), movementType: type, qty: Number(movementForm.qty), comment: movementForm.comment.trim() || undefined },
      });
      setShowIncoming(false);
      setShowOutgoing(false);
      setMovementForm(emptyMovementForm);
      success(type === 'in' ? 'Поступление зафиксировано' : 'Списание зафиксировано');
      await load();
    } catch (err) {
      toastError('Не удалось провести операцию', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim()) {
      toastError('Укажите наименование материала');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'warehouse' },
        body: {
          name: newItemForm.name.trim(), unit: newItemForm.unit, qty: Number(newItemForm.qty) || 0,
          minQty: Number(newItemForm.minQty) || 0, price: Number(newItemForm.price) || 0,
          location: newItemForm.location.trim() || undefined,
        },
      });
      setShowNewItem(false);
      setNewItemForm(emptyNewItemForm);
      success('Материал добавлен на склад');
      await load();
    } catch (err) {
      toastError('Не удалось добавить материал', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Склад" titleIcon="Warehouse" actions={
      <>
        <button onClick={() => setShowNewItem(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all whitespace-nowrap">
          <Icon name="PackagePlus" size={15} /> <span className="hidden sm:inline">Новый материал</span>
        </button>
        <button onClick={() => setShowIncoming(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Поступление</span>
        </button>
        <button onClick={() => setShowOutgoing(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all whitespace-nowrap">
          <Icon name="ArrowRightLeft" size={15} /> <span className="hidden sm:inline">Списание</span>
        </button>
      </>
    }>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { l: 'Позиций на складе', v: stats.total, i: 'Package', t: 'gold' },
          { l: 'Дефицит', v: stats.deficit, i: 'AlertTriangle', t: 'crit' },
          { l: 'Заканчиваются', v: stats.low, i: 'Clock', t: 'warn' },
          { l: 'Стоимость склада', v: `${(stats.totalCost / 1000000).toFixed(1)} млн ₽`, i: 'CircleDollarSign', t: 'ok' },
        ].map((k) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon name={k.i} size={16} className={k.t === 'crit' ? 'text-status-crit' : k.t === 'warn' ? 'text-status-warn' : k.t === 'ok' ? 'text-status-ok' : 'text-gold'} />
              <span className="text-xs text-muted-foreground">{k.l}</span>
            </div>
            <div className={`font-display font-extrabold text-2xl ${k.t === 'crit' ? 'text-status-crit' : k.t === 'warn' ? 'text-status-warn' : k.t === 'ok' ? 'text-status-ok' : 'text-gold'}`}>{k.v}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="font-display font-bold text-base">Остатки материалов</h3>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary">
            <Icon name="Search" size={14} className="text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск материала..." className="bg-transparent text-sm outline-none w-32 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Материалы не найдены</div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">Артикул</th>
                  <th className="font-medium pb-2 pr-3">Наименование</th>
                  <th className="font-medium pb-2 pr-3">Остаток</th>
                  <th className="font-medium pb-2 pr-3">Мин. запас</th>
                  <th className="font-medium pb-2 pr-3">Резерв</th>
                  <th className="font-medium pb-2 pr-3">Доступно</th>
                  <th className="font-medium pb-2 pr-3">Место</th>
                  <th className="font-medium pb-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-3 font-mono text-[11px] text-gold">{item.sku}</td>
                    <td className="py-3 pr-3 text-foreground truncate max-w-[180px]">{item.name}</td>
                    <td className="py-3 pr-3">
                      <span className={`font-semibold ${toneCl[item.tone]}`}>{item.qty}</span>
                      <span className="text-muted-foreground text-[11px] ml-1">{item.unit}</span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground whitespace-nowrap">{item.minQty} {item.unit}</td>
                    <td className="py-3 pr-3 text-foreground whitespace-nowrap">{item.reservedQty} {item.unit}</td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{item.available} {item.unit}</td>
                    <td className="py-3 pr-3 text-muted-foreground text-[12px] truncate max-w-[100px]">{item.location || '—'}</td>
                    <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${toneBg[item.tone]}`}>{statusRu[item.tone]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Поступление modal ── */}
      <Modal open={showIncoming} onClose={() => { setShowIncoming(false); setMovementForm(emptyMovementForm); }} title="Поступление на склад" icon="PackagePlus" size="sm">
        <form onSubmit={(e) => handleMovement(e, 'in')} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Материал *</label>
            <select value={movementForm.itemId} onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите материал...</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.qty} {i.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Количество *</label>
            <input value={movementForm.qty} onChange={(e) => setMovementForm({ ...movementForm, qty: e.target.value })} type="number" placeholder="0"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea value={movementForm.comment} onChange={(e) => setMovementForm({ ...movementForm, comment: e.target.value })} rows={2} placeholder="От поставщика по заявке..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
              Оприходовать
            </button>
            <button type="button" onClick={() => { setShowIncoming(false); setMovementForm(emptyMovementForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>

      {/* ── Списание modal ── */}
      <Modal open={showOutgoing} onClose={() => { setShowOutgoing(false); setMovementForm(emptyMovementForm); }} title="Списание со склада" icon="ArrowRightLeft" size="sm">
        <form onSubmit={(e) => handleMovement(e, 'out')} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Материал *</label>
            <select value={movementForm.itemId} onChange={(e) => setMovementForm({ ...movementForm, itemId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите материал...</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.qty} {i.unit})</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Количество *</label>
            <input value={movementForm.qty} onChange={(e) => setMovementForm({ ...movementForm, qty: e.target.value })} type="number" placeholder="0"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea value={movementForm.comment} onChange={(e) => setMovementForm({ ...movementForm, comment: e.target.value })} rows={2} placeholder="На заказ №..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
              Списать
            </button>
            <button type="button" onClick={() => { setShowOutgoing(false); setMovementForm(emptyMovementForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>

      {/* ── Новый материал modal ── */}
      <Modal open={showNewItem} onClose={() => { setShowNewItem(false); setNewItemForm(emptyNewItemForm); }} title="Новый материал на складе" icon="PackagePlus" size="md">
        <form onSubmit={handleCreateItem} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Наименование *</label>
            <input value={newItemForm.name} onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })} placeholder="МДФ 18мм белый глянец"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Ед. измерения</label>
              <input value={newItemForm.unit} onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })} placeholder="шт., листов, кг"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Начальный остаток</label>
              <input value={newItemForm.qty} onChange={(e) => setNewItemForm({ ...newItemForm, qty: e.target.value })} type="number" placeholder="0"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Мин. запас</label>
              <input value={newItemForm.minQty} onChange={(e) => setNewItemForm({ ...newItemForm, minQty: e.target.value })} type="number" placeholder="0"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Цена за ед.</label>
              <input value={newItemForm.price} onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })} type="number" placeholder="0"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Место хранения</label>
            <input value={newItemForm.location} onChange={(e) => setNewItemForm({ ...newItemForm, location: e.target.value })} placeholder="Стеллаж А-3"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
              Добавить материал
            </button>
            <button type="button" onClick={() => { setShowNewItem(false); setNewItemForm(emptyNewItemForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Отмена</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Warehouse;
