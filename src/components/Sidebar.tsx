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
      <div className="px-4 py-4 flex items-center gap-3 border-b border-[hsl(220,20%,14%)] shrink-0">
        <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-gold/15 shrink-0">
          <Icon name="Box" size={19} className="text-[hsl(222,30%,8%)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[11px] text-[hsl(210,20%,88%)] leading-tight">Система управления</div>
          <div className="text-[10px] text-[hsl(215,14%,55%)] leading-tight">мебельным производством</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[hsl(220,22%,15%)] flex items-center justify-center shrink-0 hover:bg-[hsl(220,22%,20%)] transition-colors"
          >
            <Icon name="X" size={14} className="text-[hsl(215,14%,55%)]" />
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
                  ? 'bg-[hsl(220,22%,15%)] text-[hsl(40,60%,65%)] font-semibold shadow-sm'
                  : 'text-[hsl(215,14%,62%)] hover:bg-[hsl(220,22%,13%)] hover:text-[hsl(210,20%,88%)]'
              }`}
            >
              <Icon
                name={item.icon}
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? 'text-gold' : 'text-[hsl(215,14%,50%)] group-hover:text-[hsl(215,14%,70%)]'
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
      <div className="px-2.5 py-3 border-t border-[hsl(220,20%,14%)] shrink-0">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[hsl(220,22%,13%)]">
          <div className="w-7 h-7 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
            <Icon name="Headphones" size={14} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-[hsl(210,20%,85%)]">Тех. поддержка</div>
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
      <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 flex-col h-screen sticky top-0 z-30 bg-[hsl(222,30%,7%)] border-r border-[hsl(220,20%,14%)]">
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
            className="absolute inset-0 bg-[hsl(222,40%,5%)]/75 backdrop-blur-sm"
            onClick={onMobileClose}
            style={{ animation: 'overlay-in 0.25s ease forwards' }}
          />
          {/* Panel */}
          <div
            className="relative w-[280px] max-w-[85vw] h-full flex flex-col bg-[hsl(222,30%,7%)] border-r border-[hsl(220,20%,14%)] z-10 overflow-y-auto"
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
