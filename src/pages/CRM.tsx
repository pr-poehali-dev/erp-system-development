import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

const tabs = ['Канбан', 'Список', 'Аналитика'];

interface Stage {
  id: number; slug: string; name: string; color: string; sortOrder?: number; sort_order?: number;
}
interface Deal {
  id: number; clientId: number; clientName: string; stageId: number; stageSlug: string; stageName: string;
  objectAddress?: string; sum: number | null; managerId?: number; managerName?: string;
  companyId?: number; source?: string; tag?: string; taskNote?: string; isOverdue?: boolean;
  comment?: string; daysInStage?: number;
}
interface DealDetail extends Deal {
  clientPhone?: string; clientEmail?: string; objectType?: string;
  tasks: { id: number; text: string; done: boolean; tone?: string }[];
  history: { id: number; eventText: string; employeeName?: string; createdAt: string }[];
}
interface EmployeeOpt { id: number; firstName: string; lastName: string; roleSlug?: string; roleName: string; }

const fmtSum = (v: number | null) => v ? `${v.toLocaleString('ru-RU')} ₽` : '—';

const tagBg: Record<string, string> = {
  ok: 'bg-status-ok/15 text-status-ok',
  warn: 'bg-status-warn/15 text-status-warn',
  crit: 'bg-status-crit/15 text-status-crit',
  info: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  gold: 'bg-gold/15 text-gold',
};

const DealCard = ({ deal, onClick }: { deal: Deal; onClick: () => void }) => {
  const initials = deal.managerName ? deal.managerName.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() : '?';
  return (
    <div
      onClick={onClick}
      className="rounded-xl p-3.5 mb-2 cursor-pointer transition-all border border-border bg-secondary hover:border-gold/30 hover:bg-secondary/80"
    >
      <div className="font-semibold text-[13px] text-foreground mb-1 truncate">{deal.clientName}</div>
      <div className="text-[11px] text-muted-foreground mb-2 truncate">{deal.objectAddress || '—'}</div>
      {deal.sum !== null && <div className="text-[13px] font-display font-bold text-gold mb-2">{fmtSum(deal.sum)}</div>}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[9px] font-bold text-gold shrink-0">{initials}</div>
          <span className="text-[11px] text-muted-foreground shrink-0">{deal.daysInStage ?? 0}д</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          {deal.tag && <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${tagBg.gold}`}>{deal.tag}</span>}
          {deal.taskNote && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate">{deal.taskNote}</span>}
          {deal.isOverdue && <Icon name="Clock" size={13} className="text-status-crit shrink-0" />}
        </div>
      </div>
    </div>
  );
};

const emptyForm = { firstName: '', lastName: '', phone: '', itemType: '', source: '', objectAddress: '', managerId: '', comment: '' };

const CRM = () => {
  const { success, info, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState('Канбан');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DealDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showNewDeal, setShowNewDeal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ deals: Deal[]; stages: Stage[] }>('crm', { params: { resource: 'deals' } });
      setDeals(data.deals);
      setStages(data.stages);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить сделки');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api<{ employees: EmployeeOpt[] }>('employees');
      setEmployees(data.employees.filter((e) => e.roleSlug === 'sales_manager' || e.roleSlug === 'owner' || e.roleSlug === 'admin'));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { load(); loadEmployees(); }, [load, loadEmployees]);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await api<{ deal: DealDetail }>('crm', { params: { resource: 'deals', action: 'detail', id: String(id) } });
      setDetail(data.deal);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDeal = (id: number) => {
    setSelectedDealId(id);
    loadDetail(id);
  };

  const columns = stages.map((st) => {
    const stageDeals = deals.filter((d) => d.stageId === st.id);
    const sum = stageDeals.reduce((acc, d) => acc + (d.sum || 0), 0);
    return { stage: st, deals: stageDeals, sum };
  });

  const totalDeals = deals.length;

  const handleCreateDeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toastError('Укажите имя и фамилию клиента');
      return;
    }
    setSubmitting(true);
    try {
      await api('crm', {
        method: 'POST',
        params: { resource: 'deals' },
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          itemType: form.itemType.trim() || undefined,
          source: form.source.trim() || undefined,
          objectAddress: form.objectAddress.trim() || undefined,
          managerId: form.managerId ? Number(form.managerId) : undefined,
          comment: form.comment.trim() || undefined,
        },
      });
      setShowNewDeal(false);
      setForm(emptyForm);
      success('Сделка создана', 'Лид добавлен в воронку продаж');
      await load();
    } catch (err) {
      toastError('Не удалось создать сделку', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStage = async (dealId: number, stageId: number) => {
    try {
      await api('crm', { method: 'POST', params: { resource: 'deals', action: 'move-stage' }, body: { id: dealId, stageId } });
      success('Сделка перемещена');
      await load();
      if (selectedDealId === dealId) loadDetail(dealId);
    } catch (err) {
      toastError('Не удалось переместить сделку', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout
      title="CRM / Сделки"
      titleIcon="Users"
      actions={
        <>
          <button onClick={() => setShowNewDeal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
            <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Новая сделка</span>
          </button>
          <button onClick={() => setShowFilter(true)} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all">
            <Icon name="SlidersHorizontal" size={15} /> <span className="hidden lg:inline">Фильтры</span>
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
            {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 gold-gradient rounded-full" />}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground pb-1 shrink-0">
          <span>Всего: <b className="text-foreground">{totalDeals}</b> сделок</span>
        </div>
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Icon name="Loader2" size={32} className="text-gold animate-spin" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3">
          {columns.map(({ stage, deals: stageDeals, sum }) => (
            <div key={stage.id} className="shrink-0 w-[220px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: stage.color }} />
                <span className="text-[12px] font-semibold text-foreground truncate">{stage.name}</span>
                <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">{stageDeals.length}</span>
              </div>
              {sum > 0 && <div className="text-[11px] text-muted-foreground px-1 mb-2">{fmtSum(sum)}</div>}
              <div className="space-y-1">
                {stageDeals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} onClick={() => openDeal(deal.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Deal detail modal ── */}
      <Modal
        open={!!selectedDealId}
        onClose={() => { setSelectedDealId(null); setDetail(null); }}
        title={detail ? detail.clientName : 'Загрузка...'}
        subtitle={detail?.objectAddress}
        icon="Briefcase"
        size="md"
        badge={detail ? { label: detail.stageName, tone: 'ok' } : undefined}
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={24} className="text-gold animate-spin" /></div>
        ) : (
          <div className="space-y-4 pb-2">
            <div className="space-y-3 text-[13px]">
              {[
                ['Телефон', detail.clientPhone || '—'],
                ['Email', detail.clientEmail || '—'],
                ['Тип', detail.objectType || '—'],
                ['Сумма', fmtSum(detail.sum)],
                ['Менеджер', detail.managerName || '—'],
                ['Источник', detail.source || '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="text-muted-foreground w-20 shrink-0">{l}</span>
                  <span className="text-foreground font-medium truncate">{v}</span>
                </div>
              ))}
            </div>

            {detail.comment && (
              <div>
                <div className="text-muted-foreground text-[13px] mb-1">Комментарий</div>
                <div className="text-foreground text-[12px] bg-secondary rounded-xl p-3 leading-relaxed">{detail.comment}</div>
              </div>
            )}

            {detail.tasks.length > 0 && (
              <div>
                <div className="text-muted-foreground text-[13px] mb-2">Задачи</div>
                <div className="space-y-2">
                  {detail.tasks.map((t) => (
                    <div key={t.id} className={`flex items-center gap-2.5 text-[12px] ${t.done ? 'opacity-50' : ''}`}>
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${t.done ? 'bg-status-ok border-status-ok' : 'border-border'}`}>
                        {t.done && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      <span className={t.done ? 'line-through text-muted-foreground' : t.tone === 'warn' ? 'text-status-warn font-medium' : 'text-foreground'}>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-muted-foreground text-[13px] mb-2">История</div>
              <div className="space-y-2.5 max-h-40 overflow-y-auto scrollbar-thin">
                {detail.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-1 rounded-full bg-gold/30 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">{new Date(h.createdAt).toLocaleString('ru-RU')} {h.employeeName ? `· ${h.employeeName}` : ''}</div>
                      <div className="text-[12px] text-foreground">{h.eventText}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <div className="text-muted-foreground mb-2 text-[13px]">Переместить на этап</div>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleMoveStage(detail.id, st.id)}
                    disabled={st.id === detail.stageId}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${st.id === detail.stageId ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Новая сделка modal ── */}
      <Modal
        open={showNewDeal}
        onClose={() => { setShowNewDeal(false); setForm(emptyForm); }}
        title="Новая сделка"
        subtitle="Добавить лид в воронку продаж"
        icon="UserPlus"
        size="md"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4 pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Фамилия *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Иванова" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Имя *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Мария" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Телефон</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="Phone" size={15} className="text-gold shrink-0" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (978) 000-00-00" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Тип мебели</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Sofa" size={15} className="text-gold shrink-0" />
                <input value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} placeholder="Кухня, гостиная..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Источник</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Share2" size={15} className="text-gold shrink-0" />
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Instagram, ВК..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Объект / Адрес</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="MapPin" size={15} className="text-gold shrink-0" />
              <input value={form.objectAddress} onChange={(e) => setForm({ ...form, objectAddress: e.target.value })} placeholder="Симферополь, ЖК «Парковый», кв. 45" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Менеджер</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setForm({ ...form, managerId: String(m.id) })}
                  className={`px-3 py-1.5 rounded-lg text-[11px] border transition-all ${form.managerId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/40 hover:text-gold'}`}
                >
                  {m.firstName} {m.lastName[0]}.
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Комментарий</label>
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Что хочет клиент, пожелания по стилю..." rows={3}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border focus:border-gold/50 transition-colors text-sm outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
              Создать сделку
            </button>
            <button type="button" onClick={() => { setShowNewDeal(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Фильтры modal ── */}
      <Modal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        title="Фильтры сделок"
        icon="SlidersHorizontal"
        size="sm"
        footer={
          <div className="flex gap-3">
            <button onClick={() => { setShowFilter(false); info('Фильтры применены'); }} className="flex-1 py-3 rounded-xl gold-gradient text-background font-semibold text-sm">Применить</button>
            <button onClick={() => setShowFilter(false)} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">Сбросить</button>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Менеджер</label>
            <div className="flex flex-wrap gap-2">
              {['Все', ...employees.map((e) => `${e.firstName} ${e.lastName[0]}.`)].map((opt, i) => (
                <button key={opt} className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${i === 0 ? 'gold-gradient text-background font-semibold' : 'bg-secondary border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Этап воронки</label>
            <div className="flex flex-wrap gap-2">
              {['Все', ...stages.map((s) => s.name)].map((opt, i) => (
                <button key={opt} className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${i === 0 ? 'gold-gradient text-background font-semibold' : 'bg-secondary border border-border text-muted-foreground hover:border-gold/30 hover:text-foreground'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default CRM;
