import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import Icon from '@/components/ui/icon';
import { api, ApiError } from '@/lib/api';

interface TopManager { id: number; name: string; dealsCount: number; dealsSum: number; }
interface FunnelStage { stageName: string; count: number; }
interface WorkshopStat { name: string; tasksCount: number; avgProgress: number; }
interface ReportsData {
  dealsCount: number; dealsSum: number; dealsWon: number;
  ordersCount: number; ordersSum: number; ordersOverdue: number;
  income: number; expense: number;
  topManagers: TopManager[]; funnel: FunnelStage[]; workshops: WorkshopStat[];
}

const fmtSum = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;
const donutColors = ['hsl(150 50% 48%)', 'hsl(199 60% 50%)', 'hsl(40 60% 55%)', 'hsl(280 40% 55%)', 'hsl(4 70% 55%)', 'hsl(30 8% 45%)'];

const Reports = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const d = await api<ReportsData>('crm', { params: { resource: 'reports' } });
      setData(d);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : 'Не удалось загрузить отчёты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const profit = data ? data.income - data.expense : 0;
  const marginPct = data && data.income ? (profit / data.income) * 100 : 0;
  const funnelTotal = data ? data.funnel.reduce((a, s) => a + s.count, 0) : 0;
  const maxManagerSum = data ? Math.max(...data.topManagers.map((m) => m.dealsSum), 1) : 1;

  return (
    <Layout title="Отчеты" titleIcon="BarChart3" actions={
      <button onClick={load} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hover:border-gold/30 transition-all">
        <Icon name="RefreshCw" size={15} /> <span className="hidden lg:inline">Обновить</span>
      </button>
    }>
      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-status-crit/10 border border-status-crit/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-status-crit">{loadError}</span>
          <button onClick={load} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center py-24"><Icon name="Loader2" size={32} className="text-gold animate-spin" /></div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
            {[
              { label: 'Выручка (сделки)', value: fmtSum(data.dealsSum), icon: 'TrendingUp', tone: 'gold' },
              { label: 'Сделок всего', value: String(data.dealsCount), icon: 'Briefcase', tone: 'ok' },
              { label: 'Заказов в работе', value: String(data.ordersCount), icon: 'ClipboardList', tone: 'ok' },
              { label: 'Просроченные заказы', value: String(data.ordersOverdue), icon: 'AlertTriangle', tone: 'crit' },
              { label: 'Прибыль', value: fmtSum(profit), icon: 'CircleDollarSign', tone: 'ok' },
            ].map((k, i) => (
              <div key={k.label} className="glass-card rounded-2xl p-5 card-hover animate-fade-in opacity-0" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{k.label}</span>
                  <Icon name={k.icon} size={16} className={k.tone === 'crit' ? 'text-status-crit' : k.tone === 'ok' ? 'text-status-ok' : 'text-gold'} />
                </div>
                <div className="font-display font-extrabold text-2xl text-foreground">{k.value}</div>
              </div>
            ))}
          </div>

          {/* Row: Funnel donut + Top managers */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
              <h3 className="font-display font-bold text-base mb-4">Воронка сделок по этапам</h3>
              {funnelTotal === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Сделок пока нет</div>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      {(() => {
                        let acc = 0;
                        return data.funnel.map((s, i) => {
                          const dash = (s.count / funnelTotal) * 100;
                          const el = <circle key={s.stageName} cx="18" cy="18" r="15.9" fill="none" stroke={donutColors[i % donutColors.length]} strokeWidth="4" strokeDasharray={`${dash} 100`} strokeDashoffset={-acc} />;
                          acc += dash;
                          return el;
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display font-extrabold text-2xl text-foreground">{funnelTotal}</span>
                      <span className="text-[10px] text-muted-foreground">сделок</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    {data.funnel.map((s, i) => (
                      <div key={s.stageName} className="flex items-center justify-between text-sm gap-2">
                        <span className="flex items-center gap-2 text-muted-foreground min-w-0 truncate"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: donutColors[i % donutColors.length] }} />{s.stageName}</span>
                        <span className="font-semibold text-foreground shrink-0">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
              <h3 className="font-display font-bold text-base mb-4">Топ менеджеров по выручке</h3>
              {data.topManagers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Нет данных по менеджерам</div>
              ) : (
                <div className="space-y-3">
                  {data.topManagers.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-[10px] font-bold text-gold shrink-0">{m.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}</div>
                      <span className="text-[13px] w-24 truncate text-foreground shrink-0">{m.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `${(m.dealsSum / maxManagerSum) * 100}%` }} /></div>
                      <span className="text-[12px] font-semibold text-foreground w-24 text-right shrink-0">{fmtSum(m.dealsSum)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row: Workshops + Financial result */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0">
              <h3 className="font-display font-bold text-base mb-4">Загрузка цехов</h3>
              {data.workshops.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Нет данных по цехам</div>
              ) : (
                <div className="space-y-4">
                  {data.workshops.map((w) => (
                    <div key={w.name}>
                      <div className="flex justify-between text-sm mb-1.5"><span className="text-foreground truncate">{w.name}</span><span className="font-semibold shrink-0">{w.avgProgress}%</span></div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full gold-gradient" style={{ width: `${w.avgProgress}%` }} /></div>
                      <div className="text-[11px] text-muted-foreground mt-1">{w.tasksCount} заданий</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 animate-fade-in opacity-0" style={{ animationDelay: '80ms' }}>
              <h3 className="font-display font-bold text-base mb-4">Финансовый результат</h3>
              <div className="flex items-end justify-around h-40 gap-4">
                {[
                  { l: 'Поступления', v: data.income, c: 'hsl(150 50% 48%)' },
                  { l: 'Расходы', v: data.expense, c: 'hsl(4 70% 55%)' },
                  { l: 'Прибыль', v: profit, c: 'hsl(199 60% 50%)' },
                ].map((f) => {
                  const max = Math.max(data.income, 1);
                  const h = Math.max(8, (f.v / max) * 100);
                  return (
                    <div key={f.l} className="flex flex-col items-center flex-1">
                      <span className="text-[11px] font-semibold text-foreground mb-1">{fmtSum(f.v)}</span>
                      <div className="w-full rounded-t-md transition-all" style={{ height: `${h}%`, background: f.c, minHeight: '8px' }} />
                      <span className="text-[10px] text-muted-foreground mt-2 text-center">{f.l}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-border text-center">
                <span className="text-[12px] text-muted-foreground">Рентабельность: </span>
                <span className="text-[13px] font-bold text-status-ok">{marginPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Сделок выиграно', value: String(data.dealsWon), icon: 'CheckCircle', tone: 'ok' },
              { label: 'Сумма заказов', value: fmtSum(data.ordersSum), icon: 'ClipboardList', tone: 'gold' },
              { label: 'Конверсия сделка→победа', value: data.dealsCount ? `${Math.round((data.dealsWon / data.dealsCount) * 100)}%` : '0%', icon: 'Percent', tone: 'ok' },
            ].map((k) => (
              <div key={k.label} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={k.icon} size={16} className={k.tone === 'ok' ? 'text-status-ok' : 'text-gold'} />
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                </div>
                <div className={`font-display font-extrabold text-xl ${k.tone === 'ok' ? 'text-status-ok' : 'text-gold'}`}>{k.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Reports;
