import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const navItems = [
  { name: 'Главная', icon: 'LayoutDashboard', path: '/dashboard' },
  { name: 'Компании', icon: 'Building2', path: '/' },
  { name: 'CRM / Сделки', icon: 'Users', path: '/crm' },
  { name: 'Клиенты', icon: 'Contact', path: '/clients' },
  { name: 'Замеры', icon: 'Ruler', path: '/measurements' },
  { name: 'Контрольные замеры', icon: 'ClipboardCheck', path: '/control-measurements' },
  { name: 'Коммерческие предложения', icon: 'FileText', path: '/proposals' },
  { name: 'Заказы', icon: 'ClipboardList', path: '/orders' },
  { name: 'Технология', icon: 'Cog', path: '/technology' },
  { name: 'Снабжение', icon: 'PackageSearch', path: '/supply' },
  { name: 'Склад', icon: 'Warehouse', path: '/warehouse' },
  { name: 'Производство', icon: 'Factory', path: '/production' },
  { name: 'Логистика', icon: 'Truck', path: '/logistics' },
  { name: 'Монтаж', icon: 'Wrench', path: '/installation' },
  { name: 'Планер и задачи', icon: 'CalendarCheck', path: '/planner' },
  { name: 'Маркетинг', icon: 'Megaphone', path: '/marketing' },
  { name: 'Финансы и себестоимость', icon: 'CircleDollarSign', path: '/finance' },
  { name: 'Отчеты', icon: 'BarChart3', path: '/reports' },
  { name: 'Сотрудники', icon: 'UserCog', path: '/staff' },
  { name: 'Настройки', icon: 'Settings', path: '/settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NavContent = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/15 shrink-0">
          <Icon name="Box" size={19} className="text-[hsl(222,30%,8%)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[11px] text-sidebar-accent-foreground leading-tight">Система управления</div>
          <div className="text-[10px] text-sidebar-foreground leading-tight">мебельным производством</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0 hover:bg-hover-bg transition-colors"
          >
            <Icon name="X" size={14} className="text-sidebar-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => go(item.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-sidebar-accent text-gold font-semibold shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon
                name={item.icon}
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-gold' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'
                }`}
              />
              <span className="truncate flex-1">{item.name}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 shadow-sm shadow-gold/50" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Support */}
      <div className="px-2.5 py-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/70">
          <div className="w-7 h-7 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
            <Icon name="Headphones" size={14} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-sidebar-accent-foreground">Тех. поддержка</div>
            <div className="text-[10px] text-gold/70 truncate">info@неостандарт.рф</div>
          </div>
        </div>
      </div>
    </>
  );
};

const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  return (
    <>
      {/* Desktop sidebar — всегда виден на lg+ */}
      <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 flex-col h-screen sticky top-0 z-30 bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          onClick={(e) => { if (e.target === e.currentTarget) onMobileClose?.(); }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 modal-overlay"
            onClick={onMobileClose}
            style={{ animation: 'overlay-in 0.25s ease forwards' }}
          />
          {/* Panel */}
          <div
            className="relative w-[280px] max-w-[85vw] h-full flex flex-col bg-sidebar border-r border-sidebar-border z-10 overflow-y-auto"
            style={{ animation: 'slide-in-mobile 0.3s cubic-bezier(0.22,1,0.36,1) forwards' }}
          >
            <NavContent onClose={onMobileClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
