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
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 6);
  const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
  const dateRange = `${fmt(today)} — ${fmt(end)} ${end.getFullYear()}`;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileSidebar} onMobileClose={() => setMobileSidebar(false)} />

      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 bg-[hsl(222,28%,9%)]/90 backdrop-blur-xl border-b border-[hsl(220,18%,20%)] gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Hamburger mobile */}
            <button
              onClick={() => setMobileSidebar(true)}
              className="lg:hidden w-9 h-9 rounded-xl glass-card flex items-center justify-center shrink-0 hover:border-gold/30 transition-all"
              aria-label="Открыть меню"
            >
              <Icon name="Menu" size={17} />
            </button>

            {titleIcon && (
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 items-center justify-center shrink-0">
                <Icon name={titleIcon} size={18} className="text-gold" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-[15px] sm:text-[17px] md:text-xl text-[hsl(210,20%,92%)] truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-[hsl(215,14%,52%)] mt-0.5 truncate hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Page actions — sm+ only */}
            <div className="hidden sm:flex items-center gap-1.5">{actions}</div>

            {/* Company switcher — md+ */}
            <button
              onClick={() => navigate('/')}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl glass-card hover:border-gold/30 transition-all group max-w-[190px]"
            >
              <div className="w-5 h-5 rounded-md gold-gradient flex items-center justify-center text-[hsl(222,30%,8%)] text-[9px] font-black shrink-0">ТМ</div>
              <span className="text-[12px] font-semibold hidden lg:inline group-hover:text-gold transition-colors truncate">Территория Мебели</span>
              <Icon name="ChevronDown" size={12} className="text-[hsl(215,14%,52%)] shrink-0 hidden lg:block" />
            </button>

            {/* Date — xl+ */}
            <button className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card hover:border-gold/30 transition-all">
              <Icon name="Calendar" size={13} className="text-gold" />
              <span className="text-[12px] text-[hsl(215,14%,52%)] whitespace-nowrap">{dateRange}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifs(true)}
              className="relative w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-all group"
            >
              <Icon name="Bell" size={16} className="group-hover:text-gold transition-colors" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-[hsl(4,80%,60%)] text-white text-[9px] font-bold flex items-center justify-center border-2 border-[hsl(222,28%,9%)]">3</span>
            </button>

            {/* Help — lg+ */}
            <button className="hidden lg:flex w-9 h-9 rounded-xl glass-card items-center justify-center hover:border-gold/30 transition-all group">
              <Icon name="HelpCircle" size={16} className="group-hover:text-gold transition-colors" />
            </button>

            {/* Quick create */}
            <button
              onClick={() => setShowQuick(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl gold-gradient btn-gold text-[hsl(222,30%,8%)] font-bold text-[13px] shadow-md shadow-gold/20"
            >
              <Icon name="Plus" size={15} />
              <span className="hidden sm:inline">Создать</span>
            </button>

            {/* User */}
            <div className="flex items-center gap-2 pl-2 border-l border-[hsl(220,18%,20%)]">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[hsl(222,30%,8%)] font-bold text-sm">А</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[hsl(142,55%,48%)] border-2 border-[hsl(222,28%,9%)]" />
              </div>
              <div className="hidden xl:block">
                <div className="text-[13px] font-semibold leading-tight text-[hsl(210,20%,92%)]">Александр</div>
                <div className="text-[10px] text-[hsl(215,14%,52%)]">Собственник</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile actions bar */}
        {actions && (
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-[hsl(220,18%,20%)] bg-[hsl(222,28%,9%)]/80 overflow-x-auto scrollbar-thin shrink-0">
            {actions}
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>

      <QuickCreateModal open={showQuick} onClose={() => setShowQuick(false)} />
      <NotificationsModal open={showNotifs} onClose={() => setShowNotifs(false)} />
    </div>
  );
};

export default Layout;
