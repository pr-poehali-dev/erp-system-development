import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Icon from '@/components/ui/icon';
import { QuickCreateModal, NotificationsModal } from '@/components/Modal';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggleButton } from '@/components/ThemeToggle';
import TeamChat from '@/components/TeamChat';
import { useChat } from '@/hooks/useChat';

interface LayoutProps {
  title: string;
  subtitle?: string;
  titleIcon?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const Layout = ({ title, subtitle, titleIcon, actions, children }: LayoutProps) => {
  const navigate = useNavigate();
  const { employee, logout } = useAuth();
  const { open: chatOpen, openChat, closeChat } = useChat();
  const [showQuick, setShowQuick] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = employee ? (employee.firstName[0] + (employee.lastName[0] || '')).toUpperCase() : '?';
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : 'Гость';

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
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 bg-topbar-bg/90 backdrop-blur-xl border-b border-border gap-2">
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
              <h1 className="font-display font-extrabold text-[15px] sm:text-[17px] md:text-xl text-foreground truncate leading-tight">{title}</h1>
              {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate hidden sm:block">{subtitle}</p>}
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
              <Icon name="ChevronDown" size={12} className="text-muted-foreground shrink-0 hidden lg:block" />
            </button>

            {/* Date — xl+ */}
            <button className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card hover:border-gold/30 transition-all">
              <Icon name="Calendar" size={13} className="text-gold" />
              <span className="text-[12px] text-muted-foreground whitespace-nowrap">{dateRange}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifs(true)}
              className="relative w-9 h-9 rounded-xl glass-card flex items-center justify-center hover:border-gold/30 transition-all group"
            >
              <Icon name="Bell" size={16} className="group-hover:text-gold transition-colors" />
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 rounded-full bg-status-crit text-white text-[9px] font-bold flex items-center justify-center border-2 border-background">3</span>
            </button>

            {/* Theme toggle */}
            <ThemeToggleButton />

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
            <div className="relative pl-2 border-l border-border">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 hover:bg-hover-bg rounded-xl px-1.5 py-1 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[hsl(222,30%,8%)] font-bold text-sm">{initials}</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-ok border-2 border-background" />
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-[13px] font-semibold leading-tight text-foreground max-w-[140px] truncate">{fullName}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{employee?.roleName}</div>
                </div>
                <Icon name="ChevronDown" size={13} className="hidden xl:block text-muted-foreground shrink-0" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 glass-modal rounded-xl p-2 z-40 animate-modal-in">
                    <div className="px-3 py-2.5 border-b border-border mb-1.5">
                      <div className="text-[13px] font-semibold text-foreground truncate">{fullName}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{employee?.email}</div>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-foreground hover:bg-hover-bg transition-colors"
                    >
                      <Icon name="Settings" size={15} className="text-muted-foreground" />
                      Настройки
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-status-crit hover:bg-status-crit/10 transition-colors"
                    >
                      <Icon name="LogOut" size={15} />
                      Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile actions bar */}
        {actions && (
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-topbar-bg/80 overflow-x-auto scrollbar-thin shrink-0">
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
      <TeamChat open={chatOpen} onOpen={openChat} onClose={closeChat} />
    </div>
  );
};

export default Layout;
