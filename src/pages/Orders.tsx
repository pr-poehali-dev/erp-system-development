import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import ChecklistWidget from '@/components/ChecklistWidget';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface OrderRow {
  id: number; code: string; clientId: number; clientName: string; objectAddress?: string;
  itemType?: string; sum: number; stageId: number; stageSlug: string; stageName: string;
  progressPct: number; managerId?: number; managerName?: string; companyId?: number;
  deadline?: string; isOverdue?: boolean; comment?: string;
}
interface OrderDetail extends OrderRow {
  comments: { id: number; text: string; employeeName?: string; createdAt: string }[];
}
interface Stage { id: number; slug: string; name: string; sortOrder: number; }
interface ClientOpt { id: number; fullName: string; }
interface EmployeeOpt { id: number; firstName: string; lastName: string; }
interface CompanyOpt { id: number; name: string; }

const stageToneBg: Record<string, string> = {
  design: 'bg-[hsl(280_40%_55%)]/15 text-[hsl(280_45%_70%)]',
  agreement: 'bg-status-warn/15 text-status-warn',
  production: 'bg-status-ok/15 text-status-ok',
  quality: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  ready: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  delivery: 'bg-status-warn/15 text-status-warn',
  installation: 'bg-status-warn/15 text-status-warn',
  handover: 'bg-muted text-muted-foreground',
};

const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;
const emptyForm = { clientId: '', itemType: '', objectAddress: '', sum: '', deadline: '', companyId: '', managerId: '', comment: '' };

const Orders = () => {
  const { success, info, error: toastError } = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selId, setSelId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ orders: OrderRow[] }>('operations', { params: { resource: 'orders' } });
      setOrders(data.orders);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [st, c, e] = await Promise.all([
        api<{ stages: Stage[] }>('operations', { params: { resource: 'orders', action: 'stages' } }),
        api<{ clients: ClientOpt[] }>('crm', { params: { resource: 'clients' } }),
        api<{ employees: EmployeeOpt[]; companies: CompanyOpt[] }>('employees'),
      ]);
      setStages(st.stages);
      setClients(c.clients);
      setEmployees(e.employees);
      setCompanies(e.companies);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadRefs(); }, [load, loadRefs]);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await api<{ order: OrderDetail }>('operations', { params: { resource: 'orders', id: String(id) } });
      setDetail(data.order);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openOrder = (id: number) => { setSelId(id); loadDetail(id); };

  const kpis = [
    { label: 'В производстве', value: orders.filter((o) => o.stageSlug === 'production').length, tone: 'ok' },
    { label: 'Проектирование', value: orders.filter((o) => o.stageSlug === 'design').length, tone: 'gold' },
    { label: 'Просрочены', value: orders.filter((o) => o.isOverdue).length, tone: 'crit' },
    { label: 'Готово к отгрузке', value: orders.filter((o) => o.stageSlug === 'ready').length, tone: 'info' },
    { label: 'На монтаже', value: orders.filter((o) => o.stageSlug === 'installation').length, tone: 'gold' },
  ];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toastError('Выберите клиента');
      return;
    }
    setSubmitting(true);
    try {
      await api('operations', {
        method: 'POST',
        params: { resource: 'orders' },
        body: {
          clientId: Number(form.clientId), itemType: form.itemType.trim() || undefined,
          objectAddress: form.objectAddress.trim() || undefined, sum: Number(form.sum) || 0,
          deadline: form.deadline || undefined, companyId: form.companyId ? Number(form.companyId) : undefined,
          managerId: form.managerId ? Number(form.managerId) : undefined, comment: form.comment.trim() || undefined,
        },
      });
      setShowNew(false);
      setForm(emptyForm);
      success('Заказ создан', 'Запущен в производство');
      await load();
    } catch (err) {
      toastError('Не удалось создать заказ', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStage = async (stageId: number) => {
    if (!detail) return;
    try {
      await api('operations', { method: 'PUT', params: { resource: 'orders' }, body: { id: detail.id, stageId } });
      success('Этап обновлён');
      await load();
      await loadDetail(detail.id);
    } catch (err) {
      toastError('Не удалось обновить этап', err instanceof ApiError ? err.message : undefined);
    }
  };

  const handleAddComment = async () => {
    if (!detail || !commentText.trim()) return;
    try {
      await api('operations', { method: 'POST', params: { resource: 'orders', action: 'comment' }, body: { id: detail.id, text: commentText.trim() } });
      setCommentText('');
      setShowComment(false);
      info('Комментарий сохранён');
      await loadDetail(detail.id);
    } catch (err) {
      toastError('Не удалось сохранить комментарий', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout
      title="Заказы"
      titleIcon="ClipboardList"
      actions={
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новый заказ</span>
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 text-center animate-fade-in opacity-0">
            <div className={`font-display font-extrabold text-3xl mb-1 ${k.tone === 'crit' ? 'text-status-crit' : k.tone === 'warn' ? 'text-status-warn' : k.tone === 'ok' ? 'text-status-ok' : k.tone === 'info' ? 'text-[hsl(199_60%_60%)]' : 'text-gold'}`}>{k.value}</div>
            <div className="text-[12px] text-muted-foreground">{k.label}</div>
          </div>
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
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Заказов пока нет</div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">№ заказа</th>
                  <th className="font-medium pb-2 pr-3">Клиент / Объект</th>
                  <th className="font-medium pb-2 pr-3">Сумма</th>
                  <th className="font-medium pb-2 pr-3">Прогресс</th>
                  <th className="font-medium pb-2 pr-3">Статус</th>
                  <th className="font-medium pb-2">Менеджер</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => openOrder(o.id)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-3">
                      <div className={`font-semibold ${o.isOverdue ? 'text-status-crit' : 'text-gold'}`}>{o.code}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-[13px] text-foreground font-medium truncate max-w-[160px]">{o.clientName}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">{o.objectAddress || o.itemType || '—'}</div>
                    </td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{fmtSum(o.sum)}</td>
                    <td className="py-3 pr-3">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full gold-gradient" style={{ width: `${o.progressPct}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{o.progressPct}%</div>
                    </td>
                    <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${o.isOverdue ? 'bg-status-crit/15 text-status-crit' : stageToneBg[o.stageSlug] || 'bg-muted text-muted-foreground'}`}>{o.isOverdue ? 'Просрочен' : o.stageName}</span></td>
                    <td className="py-3 text-[12px] text-muted-foreground whitespace-nowrap">{o.managerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order detail modal ── */}
      <Modal
        open={!!selId}
        onClose={() => { setSelId(null); setDetail(null); }}
        title={detail ? `Заказ ${detail.code}` : ''}
        subtitle={detail?.clientName}
        icon="ClipboardList"
        size="md"
        badge={detail ? { label: detail.isOverdue ? 'Просрочен' : detail.stageName, tone: detail.isOverdue ? 'crit' : 'ok' } : undefined}
        headerRight={
          detail && (
            <button
              onClick={() => setShowChecklist(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/10 border border-gold/25 text-gold text-[11px] font-semibold hover:bg-gold/15 transition-colors"
            >
              <Icon name="ListChecks" size={14} /> Чек-лист
            </button>
          )
        }
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={24} className="text-gold animate-spin" /></div>
        ) : (
          <div className="space-y-4 pb-2">
            <div>
              <div className="flex justify-between text-[12px] mb-2">
                <span className="text-muted-foreground">Прогресс выполнения</span>
                <span className="font-bold text-gold">{detail.progressPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${detail.progressPct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              {stages.map((s) => {
                const currentSort = stages.find((x) => x.id === detail.stageId)?.sortOrder || 0;
                const isDone = s.sortOrder < currentSort;
                const isActive = s.id === detail.stageId;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleMoveStage(s.id)}
                    className="flex items-center gap-3 w-full text-left py-0.5 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${isDone ? 'bg-status-ok border-status-ok' : isActive ? 'border-2 border-gold' : 'border-border'}`}>
                      {isDone && <Icon name="Check" size={11} className="text-white" />}
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                    </div>
                    <span className={`text-[13px] ${isActive ? 'text-gold font-semibold' : isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{s.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 text-[13px]">
              {[
                ['Объект', detail.objectAddress || '—'], ['Тип мебели', detail.itemType || '—'],
                ['Сумма', fmtSum(detail.sum)], ['Срок сдачи', detail.deadline ? new Date(detail.deadline).toLocaleDateString('ru-RU') : '—'],
                ['Менеджер', detail.managerName || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">{l}</span>
                  <span className="text-foreground font-medium text-right truncate">{v}</span>
                </div>
              ))}
            </div>

            {detail.comments.length > 0 && (
              <div>
                <div className="text-[11px] text-muted-foreground mb-2">Последний комментарий</div>
                <div className="bg-secondary rounded-xl p-3 text-[12px] text-foreground leading-relaxed">
                  {detail.comments[0].text}
                </div>
              </div>
            )}

            <button onClick={() => setShowComment(true)} className="w-full py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm flex items-center justify-center gap-2 shadow-gold/20 shadow-md">
              <Icon name="MessageSquare" size={15} /> Комментарий
            </button>
          </div>
        )}
      </Modal>

      {/* ── Чек-лист виджет (закрепляемый) ── */}
      {detail && (
        <ChecklistWidget
          open={showChecklist}
          onClose={() => setShowChecklist(false)}
          entityType="order"
          entityId={detail.id}
          title={`Заказ ${detail.code}`}
        />
      )}

      {/* ── Новый заказ modal ── */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setForm(emptyForm); }} title="Новый заказ" subtitle="Запустить в производство" icon="ClipboardList" size="md">
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
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Тип мебели / Направление</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Sofa" size={15} className="text-gold shrink-0" />
              <input value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} placeholder="Кухня и остров, Гостиная..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Объект / Адрес</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="MapPin" size={15} className="text-gold shrink-0" />
              <input value={form.objectAddress} onChange={(e) => setForm({ ...form, objectAddress: e.target.value })} placeholder="Симферополь, ЖК «Парковый», кв. 45" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Сумма заказа</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="CircleDollarSign" size={15} className="text-gold shrink-0" />
                <input value={form.sum} onChange={(e) => setForm({ ...form, sum: e.target.value })} type="number" placeholder="1245000" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Срок сдачи</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Calendar" size={15} className="text-gold shrink-0" />
                <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} type="date" className="bg-transparent text-sm outline-none flex-1 text-foreground min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Компания</label>
            <div className="flex gap-3">
              {companies.map((c) => (
                <button type="button" key={c.id} onClick={() => setForm({ ...form, companyId: String(c.id) })}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-all ${form.companyId === String(c.id) ? 'gold-gradient text-background border-transparent' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{c.name}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Менеджер</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((m) => (
                <button type="button" key={m.id} onClick={() => setForm({ ...form, managerId: String(m.id) })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.managerId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>{m.firstName} {m.lastName[0]}.</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Примечание</label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Особые условия, материалы, пожелания..." rows={2}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="ClipboardList" size={16} />}
              Создать заказ
            </button>
            <button type="button" onClick={() => { setShowNew(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Комментарий к заказу ── */}
      <Modal
        open={showComment}
        onClose={() => setShowComment(false)}
        title="Комментарий к заказу"
        subtitle={detail ? `Заказ ${detail.code} · ${detail.clientName}` : ''}
        icon="MessageSquare"
        size="sm"
        footer={
          <button onClick={handleAddComment} className="w-full py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm">
            Сохранить комментарий
          </button>
        }
      >
        <div className="space-y-3 pb-2">
          {detail && detail.comments.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {detail.comments.map((c) => (
                <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-secondary">
                  <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">{(c.employeeName || 'СИ').slice(0, 2)}</div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-muted-foreground mb-1">{c.employeeName || 'Система'} · {new Date(c.createdAt).toLocaleString('ru-RU')}</div>
                    <div className="text-[13px] text-foreground">{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Добавить комментарий</label>
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={3} placeholder="Напишите комментарий по заказу..."
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Orders;