import { useState } from 'react';
import Icon from '@/components/ui/icon';

const navItems = [
  { name: 'Главная', icon: 'LayoutDashboard' },
  { name: 'CRM / Сделки', icon: 'Users' },
  { name: 'Клиенты', icon: 'Contact' },
  { name: 'Замеры', icon: 'Ruler' },
  { name: 'Заказы', icon: 'ClipboardList' },
  { name: 'Производство', icon: 'Factory' },
  { name: 'Снабжение', icon: 'PackageSearch' },
  { name: 'Склад', icon: 'Warehouse' },
  { name: 'Логистика', icon: 'Truck' },
  { name: 'Монтаж', icon: 'Wrench' },
  { name: 'Планер', icon: 'CalendarCheck' },
  { name: 'Маркетинг', icon: 'Megaphone' },
  { name: 'Финансы', icon: 'CircleDollarSign' },
  { name: 'Отчеты', icon: 'BarChart3' },
  { name: 'Сотрудники', icon: 'UserCog' },
  { name: 'Настройки', icon: 'Settings' },
];

const Sidebar = () => {
  const [active, setActive] = useState('Главная');
  return (
    <aside className="w-[260px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      <div className="px-6 py-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-11 h-11 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-gold/10">
          <Icon name="Box" size={24} className="text-background" />
        </div>
        <div>
          <div className="font-display font-extrabold text-sm tracking-wide gold-text leading-tight">TERRITORY ERP</div>
          <div className="text-[10px] text-muted-foreground tracking-wider uppercase">мебельное производство</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-3">
        {navItems.map((item) => {
          const isActive = active === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActive(item.name)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl mb-0.5 text-sm transition-all duration-300 group ${
                isActive
                  ? 'bg-sidebar-accent text-gold font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`}
            >
              <Icon name={item.icon} size={18} className={isActive ? 'text-gold' : 'opacity-70 group-hover:opacity-100'} />
              {item.name}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-background font-bold text-sm">А</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">Александр</div>
            <div className="text-xs text-muted-foreground">Собственник</div>
          </div>
          <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
