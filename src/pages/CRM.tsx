import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';
import DealsKanbanBoard, { Stage, Deal } from '@/components/crm/DealsKanbanBoard';
import DealDetailModal from '@/components/crm/DealDetailModal';
import NewDealModal, { DealForm } from '@/components/crm/NewDealModal';
import DealsFilterModal from '@/components/crm/DealsFilterModal';

interface ClientObjectOpt { id: number; objectType?: string; address: string; label?: string; isPrimary?: boolean; }
interface DealDetail extends Deal {
  clientPhone?: string; clientEmail?: string; objectType?: string; clientObjects?: ClientObjectOpt[];
  tasks: { id: number; text: string; done: boolean; tone?: string }[];
  history: { id: number; eventText: string; employeeName?: string; createdAt: string }[];
}
interface EmployeeOpt { id: number; firstName: string; lastName: string; roleSlug?: string; roleName: string; }

const emptyForm: DealForm = { firstName: '', lastName: '', phone: '', itemType: '', source: '', objectAddress: '', managerId: '', comment: '' };

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
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

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

  const handleDealFieldSave = async (dealId: number, field: string, value: string) => {
    const body: Record<string, unknown> = { id: dealId };
    if (field === 'sum') body.sum = value ? Number(value) : null;
    else if (field === 'clientObjectId') body.clientObjectId = value ? Number(value) : null;
    else body[field] = value;
    await api('crm', { method: 'PUT', params: { resource: 'deals' }, body });
    await load();
    if (selectedDealId === dealId) await loadDetail(dealId);
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
      <DealsKanbanBoard
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalDeals={totalDeals}
        loadError={loadError}
        onRetry={load}
        loading={loading}
        columns={columns}
        onOpenDeal={openDeal}
      />

      <DealDetailModal
        selectedDealId={selectedDealId}
        detail={detail}
        detailLoading={detailLoading}
        stages={stages}
        employees={employees}
        showChecklist={showChecklist}
        onClose={() => { setSelectedDealId(null); setDetail(null); }}
        onOpenChecklist={() => setShowChecklist(true)}
        onCloseChecklist={() => setShowChecklist(false)}
        onFieldSave={handleDealFieldSave}
        onMoveStage={handleMoveStage}
      />

      <NewDealModal
        open={showNewDeal}
        onClose={() => { setShowNewDeal(false); setForm(emptyForm); }}
        form={form}
        onFormChange={setForm}
        employees={employees}
        submitting={submitting}
        onSubmit={handleCreateDeal}
      />

      <DealsFilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        employees={employees}
        stages={stages}
        onApply={() => { setShowFilter(false); info('Фильтры применены'); }}
      />
    </Layout>
  );
};

export default CRM;
