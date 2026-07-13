import { useState, useEffect, useCallback, FormEvent } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import Modal from '@/components/Modal';
import { useToast } from '@/hooks/useToast';
import { api, ApiError } from '@/lib/api';

interface ClientRow {
  id: number; fullName: string; firstName: string; lastName: string; phone?: string; email?: string;
  objectType?: string; objectAddress?: string; segment?: string; status?: string;
  managerId?: number; managerName?: string; dealsCount: number; dealsSum: number; source?: string;
}

const statusRu: Record<string, string> = { active: 'Активный', vip: 'VIP', on_hold: 'Перенесён', lost: 'Отменён' };
const statusBg: Record<string, string> = {
  active: 'bg-status-ok/15 text-status-ok',
  vip: 'bg-gold/15 text-gold',
  on_hold: 'bg-status-warn/15 text-status-warn',
  lost: 'bg-status-crit/15 text-status-crit',
};
const segmentRu: Record<string, string> = { premium: 'Премиум', business: 'Бизнес', standard: 'Стандарт', vip: 'VIP' };
const segmentBg: Record<string, string> = {
  premium: 'bg-gold/10 text-gold',
  business: 'bg-[hsl(199_60%_50%)]/10 text-[hsl(199_60%_60%)]',
  standard: 'bg-muted text-muted-foreground',
  vip: 'bg-[hsl(280_40%_55%)]/10 text-[hsl(280_45%_70%)]',
};

const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
const fmtSum = (v: number) => v ? `${v.toLocaleString('ru-RU')} ₽` : '—';

const emptyForm = { firstName: '', lastName: '', phone: '', email: '', objectType: '', objectAddress: '', segment: 'standard' };

const Clients = () => {
  const { success, error: toastError } = useToast();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await api<{ clients: ClientRow[] }>('crm', { params: { resource: 'clients' } });
      setClients(data.clients);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.fullName.toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.email || '').toLowerCase().includes(q);
  });

  const selClient = clients.find((c) => c.id === selId);

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    vip: clients.filter((c) => c.status === 'vip' || c.segment === 'vip').length,
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toastError('Укажите имя и фамилию клиента');
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<{ client: ClientRow }>('crm', {
        method: 'POST',
        params: { resource: 'clients' },
        body: {
          firstName: form.firstName.trim(), lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined, email: form.email.trim() || undefined,
          objectType: form.objectType.trim() || undefined, objectAddress: form.objectAddress.trim() || undefined,
          segment: form.segment,
        },
      });
      setShowAdd(false);
      setForm(emptyForm);
      success('Клиент добавлен', data.client.fullName);
      await load();
    } catch (err) {
      toastError('Не удалось добавить клиента', err instanceof ApiError ? err.message : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout
      title="Клиенты"
      titleIcon="Contact"
      actions={
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 whitespace-nowrap">
          <Icon name="Plus" size={17} /> <span className="hidden sm:inline">Новый клиент</span>
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-5">
        {[
          { label: 'Всего клиентов', value: stats.total, icon: 'Users' },
          { label: 'Активные', value: stats.active, icon: 'UserCheck' },
          { label: 'VIP клиенты', value: stats.vip, icon: 'Star' },
        ].map((k) => (
          <div key={k.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{k.label}</span>
              <Icon name={k.icon} size={16} className="text-gold" />
            </div>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-foreground">{k.value}</div>
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
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3.5 py-2.5 rounded-xl bg-secondary">
            <Icon name="Search" size={15} className="text-muted-foreground shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени, телефону, email..." className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground min-w-0" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={28} className="text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Клиенты не найдены</div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-[11px] text-muted-foreground text-left border-b border-border">
                  <th className="font-medium pb-2 pr-3">Клиент</th>
                  <th className="font-medium pb-2 pr-3">Контакты</th>
                  <th className="font-medium pb-2 pr-3">Сегмент</th>
                  <th className="font-medium pb-2 pr-3">Сделки</th>
                  <th className="font-medium pb-2 pr-3">Сумма</th>
                  <th className="font-medium pb-2 pr-3">Менеджер</th>
                  <th className="font-medium pb-2">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setSelId(c.id)} className="border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-[11px] font-bold text-gold shrink-0">{initialsOf(c.fullName)}</div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground text-[13px] truncate">{c.fullName}</div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">{c.objectAddress || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-[12px] text-foreground">{c.phone || '—'}</div>
                      <div className="text-[11px] text-muted-foreground">{c.email || '—'}</div>
                    </td>
                    <td className="py-3 pr-3"><span className={`text-[11px] px-2 py-1 rounded-md ${segmentBg[c.segment || 'standard']}`}>{segmentRu[c.segment || 'standard']}</span></td>
                    <td className="py-3 pr-3 text-center font-semibold text-foreground">{c.dealsCount}</td>
                    <td className="py-3 pr-3 font-semibold text-foreground whitespace-nowrap">{fmtSum(c.dealsSum)}</td>
                    <td className="py-3 pr-3 text-[12px] text-muted-foreground">{c.managerName || '—'}</td>
                    <td className="py-3"><span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[c.status || 'active']}`}>{statusRu[c.status || 'active']}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Профиль клиента modal ── */}
      <Modal
        open={!!selClient}
        onClose={() => setSelId(null)}
        title={selClient?.fullName}
        icon="Contact"
        size="sm"
        badge={selClient ? { label: segmentRu[selClient.segment || 'standard'], tone: 'gold' } : undefined}
      >
        {selClient && (
          <div className="space-y-4 pb-2">
            <div className="flex flex-col items-center text-center mb-2">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center text-background font-display font-black text-2xl mb-3">{initialsOf(selClient.fullName)}</div>
              <span className={`text-[11px] px-2 py-1 rounded-md ${statusBg[selClient.status || 'active']}`}>{statusRu[selClient.status || 'active']}</span>
            </div>
            <div className="space-y-3 text-[13px]">
              {[
                ['Телефон', selClient.phone || '—', 'Phone'],
                ['Email', selClient.email || '—', 'Mail'],
                ['Объект', selClient.objectAddress || '—', 'Home'],
                ['Менеджер', selClient.managerName || '—', 'UserCircle'],
                ['Сделок', String(selClient.dealsCount), 'Briefcase'],
                ['Общая сумма', fmtSum(selClient.dealsSum), 'CircleDollarSign'],
              ].map(([l, v, ic]) => (
                <div key={l} className="flex items-center gap-3 min-w-0">
                  <Icon name={ic as string} size={15} className="text-gold shrink-0" />
                  <div className="flex-1 flex justify-between gap-2 min-w-0">
                    <span className="text-muted-foreground shrink-0">{l}</span>
                    <span className="text-foreground font-medium truncate text-right">{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Новый клиент modal ── */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setForm(emptyForm); }}
        title="Новый клиент"
        icon="Contact"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Фамилия *</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="User" size={15} className="text-gold shrink-0" />
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Петрова" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Телефон</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Phone" size={15} className="text-gold shrink-0" />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (978) 000-00-00" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Email</label>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
                <Icon name="Mail" size={15} className="text-gold shrink-0" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@mail.ru" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Объект / Адрес</label>
            <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary border border-border focus-within:border-gold/50 transition-colors">
              <Icon name="MapPin" size={15} className="text-gold shrink-0" />
              <input value={form.objectAddress} onChange={(e) => setForm({ ...form, objectAddress: e.target.value })} placeholder="Симферополь, ЖК «Парковый»" className="bg-transparent text-sm outline-none flex-1 text-foreground placeholder:text-muted-foreground/50 min-w-0" />
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block font-medium">Сегмент</label>
            <div className="flex flex-wrap gap-2">
              {[['standard', 'Стандарт'], ['business', 'Бизнес'], ['premium', 'Премиум'], ['vip', 'VIP']].map(([v, l]) => (
                <button type="button" key={v} onClick={() => setForm({ ...form, segment: v })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] border transition-all ${form.segment === v ? 'gold-gradient text-background border-transparent font-semibold' : 'bg-secondary border-border text-muted-foreground hover:border-gold/30'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="flex-1 py-3 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
              Добавить клиента
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="px-5 py-3 rounded-xl bg-secondary border border-border text-sm hover:border-gold/30 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default Clients;
