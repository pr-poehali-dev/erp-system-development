import Sidebar from '@/components/Sidebar';
import Icon from '@/components/ui/icon';

interface LayoutProps {
  title: string;
  subtitle?: string;
  titleIcon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const Layout = ({ title, subtitle, titleIcon, actions, children }: LayoutProps) => {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} ${['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'][d.getMonth()]}`;
  const dateRange = `${fmt(today)} — ${fmt(end)} ${end.getFullYear()}`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-xl border-b border-border gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {titleIcon && (
              <div className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
                <Icon name={titleIcon} size={20} className="text-gold" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-xl text-foreground truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}
            <button className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-card hover:border-gold/30 transition-colors">
              <div className="w-6 h-6 rounded-lg gold-gradient flex items-center justify-center text-background text-[10px] font-bold">ТМ</div>
              <span className="text-sm font-semibold hidden lg:inline">Территория Мебели</span>
              <Icon name="ChevronDown" size={15} className="text-muted-foreground" />
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hidden xl:flex">
              <Icon name="Calendar" size={15} className="text-gold" />
              {dateRange}
            </button>
            <button className="relative w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-colors">
              <Icon name="Bell" size={17} />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-status-crit text-white text-[10px] font-bold flex items-center justify-center">12</span>
            </button>
            <button className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-colors hidden xl:flex">
              <Icon name="HelpCircle" size={17} />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-border">
              <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm">А</div>
              <div className="hidden xl:block">
                <div className="text-sm font-semibold leading-tight">Александр</div>
                <div className="text-[11px] text-muted-foreground">Собственник</div>
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
