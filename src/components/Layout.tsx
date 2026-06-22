import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Icon from '@/components/ui/icon';
import { QuickCreateModal, NotificationsModal } from '@/components/Modal';

interface LayoutProps {
  title: string;
  subtitle?: string;
  titleIcon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const Layout = ({ title, subtitle, titleIcon, actions, children }: LayoutProps) => {
  const navigate = useNavigate();
  const [showQuick, setShowQuick] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
  const dateRange = `${fmt(today)} — ${fmt(end)} ${end.getFullYear()}`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-background/85 backdrop-blur-xl border-b border-border gap-4">
          {/* Subtle top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px gold-gradient opacity-20 pointer-events-none" />

          <div className="flex items-center gap-3 min-w-0">
            {titleIcon && (
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name={titleIcon} size={20} className="text-gold" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-xl text-foreground truncate">{title}</h1>
              {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}

            {/* Company switcher */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-card hover:border-gold/30 transition-all duration-200 group"
            >
              <div className="w-6 h-6 rounded-lg gold-gradient flex items-center justify-center text-background text-[10px] font-black shadow-sm">ТМ</div>
              <span className="text-sm font-semibold hidden lg:inline group-hover:text-gold transition-colors">Территория Мебели</span>
              <Icon name="ChevronDown" size={14} className="text-muted-foreground" />
            </button>

            {/* Date */}
            <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card text-sm hidden xl:flex hover:border-gold/30 transition-all">
              <Icon name="Calendar" size={14} className="text-gold" />
              <span className="text-muted-foreground">{dateRange}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifs(true)}
              className="relative w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-all duration-200 group"
            >
              <Icon name="Bell" size={17} className="group-hover:text-gold transition-colors" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-status-crit text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">3</span>
            </button>

            {/* Help */}
            <button className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-all hidden xl:flex group">
              <Icon name="HelpCircle" size={17} className="group-hover:text-gold transition-colors" />
            </button>

            {/* Quick create */}
            <button
              onClick={() => setShowQuick(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gold-gradient btn-gold text-background font-semibold text-sm shadow-lg shadow-gold/20"
            >
              <Icon name="Plus" size={17} />
              <span className="hidden lg:inline">Создать</span>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="relative">
                <div className="w-9 h-9 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm">А</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-status-ok border-2 border-background" />
              </div>
              <div className="hidden xl:block">
                <div className="text-sm font-semibold leading-tight text-foreground">Александр</div>
                <div className="text-[11px] text-muted-foreground">Собственник</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>

      <QuickCreateModal open={showQuick} onClose={() => setShowQuick(false)} />
      <NotificationsModal open={showNotifs} onClose={() => setShowNotifs(false)} />
    </div>
  );
};

export default Layout;
