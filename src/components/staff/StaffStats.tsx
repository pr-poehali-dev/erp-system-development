interface StaffStatsProps {
  stats: {
    total: number;
    active: number;
    vacation: number;
    fired: number;
  };
  loadError: string | null;
  onRetry: () => void;
}

const StaffStats = ({ stats, loadError, onRetry }: StaffStatsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { l: 'Всего сотрудников', v: stats.total },
          { l: 'Активных', v: stats.active },
          { l: 'В отпуске', v: stats.vacation },
          { l: 'Уволено', v: stats.fired },
        ].map((k, i) => (
          <div key={k.l} className="glass-card rounded-2xl p-4 animate-fade-in opacity-0" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-gold">{k.v}</div>
            <div className="text-[11px] sm:text-[12px] text-muted-foreground mt-1 truncate">{k.l}</div>
          </div>
        ))}
      </div>

      {loadError && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-[hsl(4,80%,60%)]/10 border border-[hsl(4,80%,60%)]/25 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[13px] text-[hsl(4,80%,80%)]">{loadError}</span>
          <button onClick={onRetry} className="text-[12px] text-gold hover:underline shrink-0">Повторить</button>
        </div>
      )}
    </>
  );
};

export default StaffStats;