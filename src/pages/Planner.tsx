import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const tabs = ['Сегодня', 'Неделя', 'Все задачи', 'Просроченные'];

interface TaskRow {
  id: number; title: string; description?: string; taskType: string; priority: string;
  status: string; dueDate?: string; dueTime?: string; assigneeId?: number; assigneeName?: string;
  isOverdue?: boolean;
}
interface EmployeeOpt { id: number; firstName: string; lastName: string; }

const prioRu: Record<string, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический' };
const prioBg: Record<string, string> = {
  low: 'bg-status-ok/15 text-status-ok',
  medium: 'bg-status-warn/15 text-status-warn',
  high: 'bg-status-crit/15 text-status-crit',
  critical: 'bg-status-crit/15 text-status-crit',
};
const typeIcon: Record<string, string> = {
  task: 'CheckSquare', measurement: 'Ruler', meeting: 'Users', call: 'Phone', proposal: 'FileText',
  production: 'Factory', design: 'Pencil', delivery: 'Truck', marketing: 'Megaphone', warehouse: 'Warehouse',
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const weekEndStr = () => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); };

const emptyForm = { title: '', taskType: 'task', priority: 'medium', dueDate: todayStr(), dueTime: '10:00', assigneeId: '' };

const Planner = () => {
  const { success, error: toastError } = useToast();
  const { employee } = useAuth();
  const [active, setActive] = useState('Сегодня');
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [selTask, setSelTask] = useState<TaskRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ tasks: TaskRow[] }>('operations', { params: { resource: 'tasks' } });
      setTasks(data.tasks);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const data = await api<{ employees: EmployeeOpt[] }>('employees');
      setEmployees(data.employees);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const today = todayStr();
  const weekEnd = weekEndStr();

  const filtered = tasks.filter((t) => {
    if (active === 'Сегодня') return t.dueDate === today;
    if (active === 'Неделя') return t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd;
    if (active === 'Просроченные') return t.isOverdue;
    return true;
  }).sort((a, b) => (a.dueTime || '').localeCompare(b.dueTime || ''));

  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const noDateTasks = tasks.filter((t) => !t.dueDate);
  const myTasksToday = tasks.filter((t) => t.dueDate === today && t.assigneeId === employee?.id);

  const loadByManager = employees.map((e) => {
    const count = tasks.filter((t) => t.assigneeId === e.id && t.status === 'pending').length;
    return { name: `${e.firstName} ${e.lastName[0]}.`, tasks: count, pct: Math.min(100, count * 15) };
  }).filter((m) => m.tasks > 0).sort((a, b) => b.tasks - a.tasks);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toastError('Укажите название задачи');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'tasks' },
        body: {
          title: form.title.trim(), taskType: form.taskType, priority: form.priority,
          dueDate: form.dueDate || undefined, dueTime: form.dueTime || undefined,
          assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
        },
      });
      setShowNewTask(false);
      setForm(emptyForm);
      success('Задача создана', 'Добавлена в планер и назначена ответственному');
      await load();
    } catch (err) {
      toastError('Не удалось создать задачу', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api('operations', { method: 'PUT', params: { resource: 'tasks' }, body: { id, status: 'done' } });
      success('Задача выполнена');
      await load();
    } catch (err) {
      toastError('Не удалось обновить задачу', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout
      title="Планер и задачи"
      titleIcon="CalendarCheck"
      actions={
        <button onClick={() => setShowNewTask(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Новая задача</span>
        </button>
      }
    >
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${active === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {t === 'Просроченные' && overdueTasks.length > 0 && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-status-crit/15 text-status-crit">{overdueTasks.length}</span>}
            {active === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        {/* Task list */}
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0 min-w-0">
          <h3 className="font-display font-bold text-sm mb-4">{active} <span className="text-gold">{filtered.length}</span></h3>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={28} className="text-gold animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Задач нет</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((t) => (
                <div key={t.id} className={`flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-xl transition-colors cursor-pointer ${t.status === 'done' ? 'opacity-50' : 'hover:bg-secondary/50'}`} onClick={() => setSelTask(t)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleComplete(t.id); }}
                    disabled={t.status === 'done'}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${t.status === 'done' ? 'bg-status-ok border-status-ok' : 'border-border hover:border-gold/50'}`}
                  >
                    {t.status === 'done' && <Icon name="Check" size={12} className="text-white" />}
                  </button>
                  <Icon name={typeIcon[t.taskType] || 'CheckSquare'} size={15} className="text-muted-foreground shrink-0" />
                  {t.dueTime && <span className="text-xs font-semibold text-muted-foreground w-12 shrink-0">{t.dueTime.slice(0, 5)}</span>}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium truncate ${t.status === 'done' ? 'line-through text-muted-foreground' : t.isOverdue ? 'text-status-crit' : 'text-foreground'}`}>{t.title}</div>
                    {t.assigneeName && <div className="text-[11px] text-muted-foreground truncate">{t.assigneeName}</div>}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${prioBg[t.priority] || prioBg.medium}`}>{prioRu[t.priority] || t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5 min-w-0">
          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
            <h3 className="font-display font-bold text-sm mb-4">Мои задачи на сегодня <span className="text-gold">{myTasksToday.length}</span></h3>
            {myTasksToday.length === 0 ? (
              <div className="text-[12px] text-muted-foreground text-center py-4">Задач на сегодня нет</div>
            ) : (
              <div className="space-y-3">
                {myTasksToday.map((t) => (
                  <div key={t.id} className="flex gap-3">
                    <span className="text-xs font-semibold text-muted-foreground w-10 shrink-0 pt-0.5">{t.dueTime?.slice(0, 5) || '—'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-medium truncate ${t.isOverdue ? 'text-status-crit' : 'text-foreground'}`}>{t.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${prioBg[t.priority] || prioBg.medium}`}>{prioRu[t.priority] || t.priority}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
            <h3 className="font-display font-bold text-sm mb-4">Быстрое создание</h3>
            <button onClick={() => setShowNewTask(true)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm transition-colors gold-gradient text-background font-semibold">
              <Icon name="Plus" size={16} /> Новая задача
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '120ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Просроченные задачи <span className="text-status-crit">{overdueTasks.length}</span></h3>
          {overdueTasks.length === 0 ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">Просроченных задач нет</div>
          ) : (
            <div className="space-y-3">
              {overdueTasks.slice(0, 5).map((o) => (
                <div key={o.id} className="flex gap-3">
                  <Icon name="CircleAlert" size={16} className="text-status-crit mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-foreground truncate">{o.title}</div>
                    <div className="text-[11px] text-status-crit">{o.dueDate ? new Date(o.dueDate).toLocaleDateString('ru-RU') : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '180ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Задачи без даты <span className="text-gold">{noDateTasks.length}</span></h3>
          {noDateTasks.length === 0 ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">Все задачи с датой</div>
          ) : (
            <div className="space-y-3">
              {noDateTasks.slice(0, 5).map((o) => (
                <div key={o.id} className="flex gap-3">
                  <Icon name="FileText" size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[13px] text-foreground truncate">{o.title}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '240ms' }}>
          <h3 className="font-display font-bold text-sm mb-4">Нагрузка менеджеров</h3>
          {loadByManager.length === 0 ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">Нет активных задач</div>
          ) : (
            <div className="space-y-2.5">
              {loadByManager.map((m) => (
                <div key={m.name} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 truncate text-foreground">{m.name}</span>
                  <span className="w-6 text-center font-semibold">{m.tasks}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${m.pct >= 80 ? 'bg-status-crit' : m.pct >= 50 ? 'bg-status-warn' : 'bg-status-ok'}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Task detail modal ── */}
      <Modal
        open={!!selTask}
        onClose={() => setSelTask(null)}
        title={selTask?.title}
        icon={selTask ? typeIcon[selTask.taskType] || 'CheckSquare' : 'CheckSquare'}
        size="sm"
        badge={selTask ? { label: prioRu[selTask.priority] || selTask.priority, tone: selTask.priority === 'low' ? 'ok' : selTask.priority === 'medium' ? 'warn' : 'crit' } : undefined}
        footer={
          selTask && selTask.status !== 'done' ? (
            <button onClick={() => { handleComplete(selTask.id); setSelTask(null); }} className="w-full py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm flex items-center justify-center gap-2">
              <Icon name="Check" size={16} /> Отметить выполненной
            </button>
          ) : undefined
        }
      >
        {selTask && (
          <div className="space-y-3 text-[13px] pb-2">
            {selTask.description && <div className="text-foreground/80 leading-relaxed">{selTask.description}</div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Дата</span><span className="text-foreground font-medium">{selTask.dueDate ? new Date(selTask.dueDate).toLocaleDateString('ru-RU') : '—'} {selTask.dueTime?.slice(0, 5)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ответственный</span><span className="text-foreground font-medium">{selTask.assigneeName || '—'}</span></div>
          </div>
        )}
      </Modal>

      {/* ── Новая задача modal ── */}
      <Modal open={showNewTask} onClose={() => { setShowNewTask(false); setForm(emptyForm); }} title="Новая задача" subtitle="Добавить в планер" icon="CalendarCheck" size="md">
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Название задачи *</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="FileText" size={15} className="text-gold shrink-0" />
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Что нужно сделать?" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Тип задачи</label>
            <div className="grid grid-cols-4 gap-2">
              {[['task', 'CheckSquare', 'Задача'], ['measurement', 'Ruler', 'Замер'], ['meeting', 'Users', 'Встреча'], ['call', 'Phone', 'Звонок']].map(([v, ic, l]) => (
                <button type="button" key={v} onClick={() => setForm({ ...form, taskType: v })}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11px] transition-all ${form.taskType === v ? 'border-gold/40 bg-gold/8 text-gold' : 'border-border bg-secondary text-muted-foreground hover:border-gold/25'}`}>
                  <Icon name={ic} size={16} /> {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Приоритет</label>
            <div className="flex gap-2">
              {[['low', 'Низкий'], ['medium', 'Средний'], ['high', 'Высокий'], ['critical', 'Критический']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setForm({ ...form, priority: v })}
                  className={`flex-1 py-2 rounded-xl border text-[11px] transition-all ${form.priority === v ? `${prioBg[v]} border-transparent font-semibold` : 'bg-secondary border-border text-muted-foreground hover:border-gold/25'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Дата</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Calendar" size={15} className="text-gold shrink-0" />
                <input value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} type="date" className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Время</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Clock" size={15} className="text-gold shrink-0" />
                <input value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} type="time" className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Ответственный</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((m) => (
                <button type="button" key={m.id} onClick={() => setForm({ ...form, assigneeId: String(m.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.assigneeId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{m.firstName} {m.lastName[0]}.</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="CalendarCheck" size={16} />}
              Создать задачу
            </button>
            <button type="button" onClick={() => { setShowNewTask(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Planner;
