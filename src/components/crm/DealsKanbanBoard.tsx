import Icon from '@/components/ui/icon';

const tabs = ['Канбан', 'Список', 'Аналитика'];

export interface Stage {
  id: number; slug: string; name: string; color: string; sortOrder?: number; sort_order?: number;
}
export interface Deal {
  id: number; clientId: number; clientName: string; stageId: number; stageSlug: string; stageName: string;
  objectAddress?: string; clientObjectId?: number | null; sum: number | null; managerId?: number; managerName?: string;
  companyId?: number; source?: string; tag?: string; taskNote?: string; isOverdue?: boolean;
  comment?: string; daysInStage?: number;
}

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

interface DealsKanbanBoardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalDeals: number;
  loadError: string | null;
  onRetry: () => void;
  loading: boolean;
  columns: { stage: Stage; deals: Deal[]; sum: number }[];
  onOpenDeal: (id: number) => void;
}

const DealsKanbanBoard = ({ activeTab, onTabChange, totalDeals, loadError, onRetry, loading, columns, onOpenDeal }: DealsKanbanBoardProps) => {
  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-border overflow-x-auto scrollbar-thin">
        {tabs.map((t) => (
          <button key={t} onClick={() => onTabChange(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === t ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
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
          <button onClick={onRetry} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
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
                  <DealCard key={deal.id} deal={deal} onClick={() => onOpenDeal(deal.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DealsKanbanBoard;
export { fmtSum };
