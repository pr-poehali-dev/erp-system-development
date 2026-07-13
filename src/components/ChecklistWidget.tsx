import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface ChecklistItem {
  id: number;
  entityType: string;
  entityId: number;
  text: string;
  done: boolean;
  sortOrder: number;
}
interface ChecklistTemplate {
  id: number;
  name: string;
  items: string[];
}

interface ChecklistWidgetProps {
  open: boolean;
  onClose: () => void;
  entityType: 'order' | 'deal';
  entityId: number;
  title: string;
}

const ChecklistWidget = ({ open, onClose, entityType, entityId, title }: ChecklistWidgetProps) => {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ items: ChecklistItem[]; templates: ChecklistTemplate[] }>('operations', {
        params: { resource: 'checklist', entityType, entityId: String(entityId) },
      });
      setItems(data.items);
      setTemplates(data.templates);
    } catch (e) {
      toastError('Не удалось загрузить чек-лист', e instanceof ApiError ? e.message : undefined);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const doneCount = items.filter((i) => i.done).length;
  const progressPct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  const handleToggle = async (item: ChecklistItem) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    try {
      await api('operations', { method: 'PUT', params: { resource: 'checklist' }, body: { id: item.id, done: !item.done } });
      if (!item.done) success('Пункт выполнен');
    } catch (e) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: item.done } : i)));
      toastError('Не удалось обновить пункт', e instanceof ApiError ? e.message : undefined);
    }
  };

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    try {
      const data = await api<{ item: ChecklistItem }>('operations', {
        method: 'POST',
        params: { resource: 'checklist' },
        body: { entityType, entityId, text },
      });
      setItems((prev) => [...prev, data.item]);
      setNewText('');
    } catch (e) {
      toastError('Не удалось добавить пункт', e instanceof ApiError ? e.message : undefined);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api('operations', { method: 'DELETE', params: { resource: 'checklist', id: String(id) } });
    } catch (e) {
      toastError('Не удалось удалить пункт', e instanceof ApiError ? e.message : undefined);
      load();
    }
  };

  const handleApplyTemplate = async (templateId: number) => {
    try {
      const data = await api<{ items: ChecklistItem[] }>('operations', {
        method: 'POST',
        params: { resource: 'checklist', action: 'apply-template' },
        body: { entityType, entityId, templateId },
      });
      setItems(data.items);
      success('Чек-лист заполнен', 'Применён стандартный шаблон');
    } catch (e) {
      toastError('Не удалось применить шаблон', e instanceof ApiError ? e.message : undefined);
    }
  };

  // Collapsed "pill" — закреплённый компактный вид поверх интерфейса
  if (collapsed) {
    return createPortal(
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 pl-4 pr-5 py-3 rounded-2xl glass-modal border-gold-gradient shadow-2xl shadow-black/40 hover:scale-105 transition-transform animate-fade-in"
      >
        <div className="relative w-9 h-9 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--gold))" strokeWidth="3"
              strokeDasharray={`${progressPct} 100`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="ListChecks" size={14} className="text-gold" />
          </div>
        </div>
        <div className="text-left">
          <div className="text-[12px] font-semibold text-foreground leading-tight">Чек-лист</div>
          <div className="text-[10px] text-muted-foreground">{doneCount}/{items.length} выполнено</div>
        </div>
      </button>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[70] w-[360px] max-w-[calc(100vw-2rem)] animate-fade-in">
      <div className="glass-modal rounded-2xl overflow-hidden flex flex-col max-h-[70vh] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gold/12 border border-gold/25 flex items-center justify-center shrink-0">
            <Icon name="ListChecks" size={17} className="text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-foreground truncate">Чек-лист заявки</div>
            <div className="text-[11px] text-muted-foreground truncate">{title}</div>
          </div>
          <button onClick={() => setCollapsed(true)} className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center shrink-0" title="Свернуть">
            <Icon name="Minus" size={14} className="text-muted-foreground" />
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center shrink-0" title="Закрыть">
            <Icon name="X" size={14} className="text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        {items.length > 0 && (
          <div className="px-4 pt-3 shrink-0">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Прогресс</span>
              <span className="font-semibold text-gold">{doneCount}/{items.length} · {progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full gold-gradient progress-fill transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Icon name="Loader2" size={22} className="text-gold animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-4">
              <Icon name="ListChecks" size={28} className="text-muted-foreground/40 mx-auto mb-3" />
              <div className="text-[12px] text-muted-foreground mb-3">Чек-лист пуст</div>
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleApplyTemplate(t.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary border border-border hover:border-gold/30 transition-colors text-left"
                    >
                      <Icon name="Sparkles" size={14} className="text-gold shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium text-foreground">{t.name}</div>
                        <div className="text-[10px] text-muted-foreground">{t.items.length} пунктов</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="group flex items-start gap-2.5 py-1.5">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-colors ${item.done ? 'bg-status-ok border-status-ok' : 'border-border hover:border-gold/50'}`}
                  >
                    {item.done && <Icon name="Check" size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-[13px] leading-snug ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.text}</span>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 hover:bg-status-crit/15 hover:text-status-crit text-muted-foreground transition-all"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add item footer */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="Добавить пункт..."
              className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-[12px] outline-none focus:border-gold/50 transition-colors text-foreground placeholder:text-muted-foreground/50 min-w-0"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newText.trim()}
              className="w-8 h-8 rounded-xl gold-gradient btn-gold flex items-center justify-center shrink-0 disabled:opacity-40"
            >
              {adding ? <Icon name="Loader2" size={14} className="text-background animate-spin" /> : <Icon name="Plus" size={15} className="text-background" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ChecklistWidget;
