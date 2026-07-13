import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

const tabs = ['Все КП', 'Черновики', 'Отправленные', 'Согласуются', 'Принятые', 'Отклоненные'];

interface ProposalRow {
  id: number; code: string; version: number; dealId?: number; clientId: number; clientName: string;
  itemType?: string; companyId?: number; companyName?: string; sum: number; discount: number;
  status: string; managerId?: number; managerName?: string; validDays?: number; comment?: string;
  createdAt: string;
}
interface ProposalDetail extends ProposalRow {
  items: { id: number; name: string; qty: number; unit: string; price: number; sum: number }[];
}
interface ClientOpt { id: number; fullName: string; }
interface EmployeeOpt { id: number; firstName: string; lastName: string; }
interface CompanyOpt { id: number; name: string; }

const statusRu: Record<string, string> = { draft: 'Черновик', sent: 'Отправлено', agreement: 'Согласуется', accepted: 'Принято', rejected: 'Отклонено', revision: 'Требует правки' };
const statusBg: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-[hsl(199_60%_50%)]/15 text-[hsl(199_60%_60%)]',
  agreement: 'bg-status-warn/15 text-status-warn',
  accepted: 'bg-status-ok/15 text-status-ok',
  rejected: 'bg-status-crit/15 text-status-crit',
  revision: 'bg-status-warn/15 text-status-warn',
};
const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;

const emptyForm = { clientId: '', itemType: '', companyId: '', sum: '', discount: '', managerId: '' };
type ProposalItemInput = { name: string; qty: string; unit: string; price: string };

const Proposals = () => {
  const { success, error: toastError } = useToast();
  const [active, setActive] = useState('Все КП');
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [employees, setEmployees] = useState<EmployeeOpt[]>([]);
  const [companies, setCompanies] = useState<CompanyOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ProposalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ProposalItemInput[]>([{ name: '', qty: '1', unit: 'шт.', price: '' }]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ proposals: ProposalRow[] }>('sales', { params: { resource: 'proposals' } });
      setProposals(data.proposals);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить КП');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRefs = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([
        api<{ clients: ClientOpt[] }>('crm', { params: { resource: 'clients' } }),
        api<{ employees: EmployeeOpt[]; companies: CompanyOpt[] }>('employees'),
      ]);
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
      const data = await api<{ proposal: ProposalDetail }>('sales', { params: { resource: 'proposals', id: String(id) } });
      setDetail(data.proposal);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openProposal = (id: number) => { setSelectedId(id); loadDetail(id); };

  const filtered = proposals.filter((p) => {
    if (active === 'Все КП') return true;
    if (active === 'Черновики') return p.status === 'draft';
    if (active === 'Отправленные') return p.status === 'sent';
    if (active === 'Согласуются') return p.status === 'agreement';
    if (active === 'Принятые') return p.status === 'accepted';
    if (active === 'Отклоненные') return p.status === 'rejected';
    return true;
  });

  const itemsTotal = items.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);

  const handleAddItem = () => setItems([...items, { name: '', qty: '1', unit: 'шт.', price: '' }]);
  const handleRemoveItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const handleItemChange = (i: number, field: keyof ProposalItemInput, value: string) => {
    setItems(items.map((it, idx) => idx === i ? { ...it, [field]: value } : it));
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.clientId) {
      toastError('Выберите клиента');
      return;
    }
    setSubmitting(true);
    try {
      const validItems = items.filter((it) => it.name.trim());
      await api('sales', {
        method: 'POST',
        params: { resource: 'proposals' },
        body: {
          clientId: Number(form.clientId), itemType: form.itemType.trim() || undefined,
          companyId: form.companyId ? Number(form.companyId) : undefined,
          sum: itemsTotal || Number(form.sum) || 0, discount: Number(form.discount) || 0,
          managerId: form.managerId ? Number(form.managerId) : undefined,
          items: validItems.map((it) => ({
            name: it.name, qty: Number(it.qty) || 1, unit: it.unit,
            price: Number(it.price) || 0, sum: (Number(it.qty) || 1) * (Number(it.price) || 0),
          })),
        },
      });
      setShowCreate(false);
      setForm(emptyForm);
      setItems([{ name: '', qty: '1', unit: 'шт.', price: '' }]);
      success('КП создано', 'Добавлено в черновики');
      await load();
    } catch (err) {
      toastError('Не удалось создать КП', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!detail) return;
    try {
      await api('sales', { method: 'PUT', params: { resource: 'proposals' }, body: { id: detail.id, status } });
      success(status === 'sent' ? 'КП отправлено клиенту' : 'Статус обновлён');
      await load();
      await loadDetail(detail.id);
    } catch (err) {
      toastError('Не удалось обновить статус', err instanceof ApiError ? err.message : undefined);
    }
  };

  return (
    <Layout
      title="Коммерческие предложения"
      titleIcon="FileText"
      actions={
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden lg:inline">Создать КП</span>
        </button>
      }
    >
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActive(t)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative ${active === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
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

      <div className="glass-card rounded-2xl p-4 animate-fade-in opacity-0 min-w-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">КП не найдены</div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">№ КП</th><th className="font-medium pb-2 pr-3">Клиент</th><th className="font-medium pb-2 pr-3">Сумма</th><th className="font-medium pb-2 pr-3">Статус</th><th className="font-medium pb-2">Менеджер</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => openProposal(p.id)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-3"><div className="font-semibold text-foreground">{p.code}</div><div className="text-[11px] text-muted-foreground">версия {p.version}</div></td>
                    <td className="py-3 pr-3"><div className="text-foreground truncate max-w-[140px]">{p.clientName}</div><div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{p.itemType || '—'}</div></td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{fmtSum(p.sum)}</td>
                    <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md whitespace-nowrap ${statusBg[p.status] || statusBg.draft}`}>{statusRu[p.status] || p.status}</span></td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{p.managerName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Deal detail modal ── */}
      <Modal
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setDetail(null); }}
        title={detail?.code}
        subtitle={detail?.clientName}
        icon="FileText"
        size="md"
        badge={detail ? { label: statusRu[detail.status] || detail.status, tone: detail.status === 'accepted' ? 'ok' : detail.status === 'rejected' ? 'crit' : 'gold' } : undefined}
      >
        {detailLoading || !detail ? (
          <div className="flex items-center justify-center py-16"><Icon name="Loader2" size={24} className="text-gold animate-spin" /></div>
        ) : (
          <div className="space-y-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {detail.status === 'draft' && (
                <button onClick={() => handleStatusChange('sent')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg gold-gradient btn-gold text-background text-xs font-semibold">
                  <Icon name="Send" size={14} /> Отправить клиенту
                </button>
              )}
              {detail.status === 'sent' && (
                <button onClick={() => handleStatusChange('agreement')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-status-warn/15 text-status-warn text-xs font-semibold">На согласовании</button>
              )}
              {(detail.status === 'sent' || detail.status === 'agreement') && (
                <>
                  <button onClick={() => handleStatusChange('accepted')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-status-ok/15 text-status-ok text-xs font-semibold"><Icon name="Check" size={14} /> Принято</button>
                  <button onClick={() => handleStatusChange('rejected')} className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-status-crit/15 text-status-crit text-xs font-semibold"><Icon name="X" size={14} /> Отклонено</button>
                </>
              )}
            </div>

            <div className="space-y-3 text-sm">
              {[
                ['Компания', detail.companyName || '—'], ['Направление', detail.itemType || '—'],
                ['Менеджер', detail.managerName || '—'], ['Срок действия', `${detail.validDays || 14} дней`],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <span className="text-muted-foreground w-28 shrink-0">{l}</span>
                  <span className="text-foreground font-medium truncate">{v}</span>
                </div>
              ))}
            </div>

            {detail.items.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-sm mb-3">Состав предложения</h3>
                <div className="table-responsive mb-3">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                        <th className="font-medium pb-2 pr-3">Наименование</th><th className="font-medium pb-2 pr-3">Кол-во</th><th className="font-medium pb-2">Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((c) => (
                        <tr key={c.id} className="border-b border-border/40">
                          <td className="py-2.5 pr-3 text-foreground">{c.name}</td>
                          <td className="py-2.5 pr-3 text-foreground whitespace-nowrap">{c.qty} {c.unit}</td>
                          <td className="py-2.5 font-semibold text-foreground whitespace-nowrap">{fmtSum(c.sum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Скидка</span><span className="text-status-crit">{fmtSum(detail.discount)}</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-display font-bold text-foreground">Итого</span>
                    <span className="font-display font-extrabold text-xl text-gold">{fmtSum(detail.sum - detail.discount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Создать КП modal ── */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm); }} title="Создать коммерческое предложение" icon="FileText" size="lg">
        <form onSubmit={handleCreate} className="space-y-4 pb-2">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Клиент *</label>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
              <option value="">Выберите клиента...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Направление</label>
              <input value={form.itemType} onChange={(e) => setForm({ ...form, itemType: e.target.value })} placeholder="Кухня и остров"
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Компания</label>
              <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground">
                <option value="">—</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Менеджер</label>
            <div className="flex gap-2 flex-wrap">
              {employees.map((m) => (
                <button type="button" key={m.id} onClick={() => setForm({ ...form, managerId: String(m.id) })}
                  className={`px-3 py-1.5 rounded-lg text-[12px] border transition-all ${form.managerId === String(m.id) ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {m.firstName} {m.lastName[0]}.
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] text-muted-foreground block font-medium">Состав предложения</label>
              <button type="button" onClick={handleAddItem} className="text-[12px] text-gold hover:underline flex items-center gap-1"><Icon name="Plus" size={13} /> Добавить позицию</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={it.name} onChange={(e) => handleItemChange(i, 'name', e.target.value)} placeholder="Наименование"
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-[12px] outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
                  <input value={it.qty} onChange={(e) => handleItemChange(i, 'qty', e.target.value)} placeholder="Кол-во" type="number"
                    className="w-16 px-2 py-2 rounded-lg bg-secondary border border-border text-[12px] outline-none focus:border-gold/50 text-foreground text-center" />
                  <input value={it.price} onChange={(e) => handleItemChange(i, 'price', e.target.value)} placeholder="Цена" type="number"
                    className="w-24 px-2 py-2 rounded-lg bg-secondary border border-border text-[12px] outline-none focus:border-gold/50 text-foreground text-right" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(i)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-status-crit/15 hover:text-status-crit shrink-0">
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {itemsTotal > 0 && (
              <div className="flex justify-end mt-2 text-sm">
                <span className="text-muted-foreground mr-2">Итого:</span>
                <span className="font-display font-bold text-gold">{fmtSum(itemsTotal)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Скидка (₽)</label>
            <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} type="number" placeholder="0"
              className="w-full px-3.5 py-3 rounded-xl bg-secondary border border-border text-sm outline-none focus:border-gold/50 text-foreground placeholder:text-muted-foreground/50" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="FileText" size={16} />}
              Создать КП
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Proposals;
