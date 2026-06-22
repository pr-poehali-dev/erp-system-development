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

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-[260px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/10 shrink-0">
          <Icon name="Box" size={22} className="text-background" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-bold text-[11px] text-foreground leading-tight">Система управления</div>
          <div className="text-[10px] text-muted-foreground leading-tight">мебельным производством</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl mb-0.5 text-[13px] text-left transition-all duration-300 group ${
                isActive
                  ? 'bg-sidebar-accent text-gold font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`}
            >
              <Icon name={item.icon} size={17} className={`shrink-0 ${isActive ? 'text-gold' : 'opacity-70 group-hover:opacity-100'}`} />
              <span className="truncate">{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-sidebar-accent/30">
          <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
            <Icon name="Headphones" size={16} className="text-gold" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">Техническая поддержка</div>
            <div className="text-[11px] text-gold/80 truncate">info@неостандарт.рф</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;