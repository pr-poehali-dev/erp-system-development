import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import InlineEditField from '@/components/InlineEditField';
import Modal from '@/components/Modal';
import { api, ApiError } from '@/lib/api';

interface Workshop {
  id: number; slug: string; name: string; icon?: string; workersCount: number; ordersCount: number; load: number;
}
interface ProductionTask {
  id: number; orderId: number; orderCode?: string; clientName?: string; itemType?: string;
  workshopId: number; stageName?: string; progressPct: number; teamName?: string; isUrgent?: boolean; deadline?: string;
}

const Production = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selTask, setSelTask] = useState<ProductionTask | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ workshops: Workshop[]; tasks: ProductionTask[] }>('operations', { params: { resource: 'production' } });
      setWorkshops(data.workshops);
      setTasks(data.tasks);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные производства');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTaskFieldSave = async (id: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id };
    if (field === 'progressPct') body.progressPct = value ? Number(value) : 0;
    else if (field === 'workshopId') body.workshopId = value ? Number(value) : null;
    else body[field] = value || null;
    await api('operations', { method: 'PUT', params: { resource: 'production' }, body });
    await load();
    if (selTask?.id === id) {
      const updated = tasks.find((t) => t.id === id);
      if (updated) setSelTask({ ...updated, [field]: field === 'progressPct' ? Number(value) : value });
    }
  };

  return (
    <Layout title="Производство" titleIcon="Factory">
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
            {workshops.map((w, i) => (
              <div key={w.id} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/12 flex items-center justify-center shrink-0"><Icon name={w.icon || 'Factory'} size={16} className="text-gold" /></div>
                  <span className="text-[12px] font-semibold text-foreground truncate">{w.name}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`font-display font-extrabold text-2xl ${w.load >= 80 ? 'text-status-crit' : w.load >= 70 ? 'text-status-warn' : 'text-status-ok'}`}>{w.load}%</span>
                  <span className="text-[11px] text-muted-foreground">{w.ordersCount} заказов</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${w.load >= 80 ? 'bg-status-crit' : w.load >= 70 ? 'bg-status-warn' : 'bg-status-ok'}`} style={{ width: `${w.load}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">{w.workersCount} сотрудников</div>
              </div>
            ))}
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base">Заказы в производстве</h3>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-status-crit inline-block" />Срочно</span>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">Активных заданий нет</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelTask(t)}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors cursor-pointer ${t.isUrgent ? 'border-status-crit/30 bg-status-crit/5' : 'border-border bg-secondary/50 hover:border-gold/30'}`}
                  >
                    <div className="w-16 shrink-0">
                      <div className="font-semibold text-gold text-[13px] truncate">{t.orderCode}</div>
                      {t.isUrgent && <span className="text-[10px] text-status-crit">Срочно</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-foreground truncate">{t.clientName} — {t.itemType || '—'}</div>
                      <div className="text-[11px] text-muted-foreground truncate">Этап: <span className="text-foreground">{t.stageName || '—'}</span> · {t.teamName || '—'}</div>
                    </div>
                    <div className="w-36 shrink-0 hidden sm:block">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Готовность</span>
                        <span className="font-semibold text-foreground">{t.progressPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${t.progressPct >= 90 ? 'bg-status-ok' : t.isUrgent ? 'bg-status-crit' : 'bg-gold'}`} style={{ width: `${t.progressPct}%` }} />
                      </div>
                    </div>
                    <div className="w-20 shrink-0 text-right hidden md:block">
                      <div className="text-[11px] text-muted-foreground">Срок</div>
                      <div className="text-[12px] font-medium text-foreground">{t.deadline ? new Date(t.deadline).toLocaleDateString('ru-RU') : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Task detail modal ── */}
      <Modal
        open={!!selTask}
        onClose={() => setSelTask(null)}
        title={selTask ? `Заказ ${selTask.orderCode}` : ''}
        subtitle={selTask?.clientName}
        icon="Factory"
        size="sm"
        badge={selTask?.isUrgent ? { label: 'Срочно', tone: 'crit' } : undefined}
      >
        {selTask && (
          <div className="space-y-4 pb-2">
            <InlineEditField
              label="Цех" icon="Factory" type="select"
              value={String(selTask.workshopId)}
              options={workshops.map((w) => ({ value: String(w.id), label: w.name }))}
              onSave={(v) => handleTaskFieldSave(selTask.id, 'workshopId', v)}
            />
            <InlineEditField
              label="Этап" icon="ListChecks" type="text" value={selTask.stageName || ''}
              placeholder="Распил, Сборка, Покраска..."
              onSave={(v) => handleTaskFieldSave(selTask.id, 'stageName', v)}
            />
            <InlineEditField
              label="Бригада" icon="Users" type="text" value={selTask.teamName || ''}
              placeholder="Бригада №1"
              onSave={(v) => handleTaskFieldSave(selTask.id, 'teamName', v)}
            />
            <InlineEditField
              label="Готовность, %" icon="TrendingUp" type="number" value={String(selTask.progressPct ?? 0)}
              onSave={(v) => handleTaskFieldSave(selTask.id, 'progressPct', v)}
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Production;
