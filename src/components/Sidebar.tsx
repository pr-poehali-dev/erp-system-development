import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useChat } from '@/hooks/useChat';
import { useToast } from '@/hooks/useToast';

interface NavLeaf {
  name: string;
  path?: string;
  icon: string;
  soon?: boolean;
}

interface NavGroup {
  name: string;
  icon: string;
  path?: string;
  children?: NavLeaf[];
}

const NAV_TREE: NavGroup[] = [
  { name: 'Главная', icon: 'LayoutDashboard', path: '/dashboard' },
  {
    name: 'Клиенты', icon: 'Contact',
    children: [
      { name: 'Все клиенты', icon: 'Users', path: '/clients' },
      { name: 'Создать клиента', icon: 'UserPlus', path: '/clients?new=1' },
    ],
  },
  {
    name: 'Продажи', icon: 'ShoppingBag',
    children: [
      { name: 'Заявки', icon: 'ClipboardList', path: '/crm' },
      { name: 'Замеры', icon: 'Ruler', path: '/measurements' },
      { name: 'Коммерческие предложения', icon: 'FileText', path: '/proposals' },
      { name: 'Договоры', icon: 'FileSignature', soon: true },
      { name: 'Маркетинг', icon: 'Megaphone', path: '/marketing' },
    ],
  },
  {
    name: 'Производство', icon: 'Factory',
    children: [
      { name: 'Заказы', icon: 'ClipboardList', path: '/orders' },
      { name: 'Конструктор заказа', icon: 'Layers', soon: true },
      { name: 'Заказы в работе', icon: 'Factory', path: '/production' },
      { name: 'Контрольные замеры', icon: 'ClipboardCheck', path: '/control-measurements' },
      { name: 'Монтаж', icon: 'Wrench', path: '/installation' },
      { name: 'Архив', icon: 'Archive', soon: true },
    ],
  },
  {
    name: 'Склад', icon: 'Warehouse',
    children: [
      { name: 'Материалы', icon: 'Package', path: '/warehouse' },
      { name: 'Группы', icon: 'Boxes', soon: true },
      { name: 'Спецификации', icon: 'Cog', path: '/technology' },
      { name: 'Сметы', icon: 'Calculator', soon: true },
      { name: 'Поставщики и поставки', icon: 'PackageSearch', path: '/supply' },
    ],
  },
  {
    name: 'Логистика', icon: 'Truck',
    children: [
      { name: 'Доставка', icon: 'Truck', path: '/logistics' },
      { name: 'Монтаж', icon: 'Wrench', path: '/installation' },
    ],
  },
  {
    name: 'Компания', icon: 'Building2',
    children: [
      { name: 'Структура', icon: 'GitBranch', soon: true },
      { name: 'Отделы', icon: 'Layers', soon: true },
      { name: 'Сотрудники', icon: 'UserCog', path: '/staff' },
    ],
  },
  { name: 'Планер', icon: 'CalendarCheck', path: '/planner' },
  {
    name: 'Отчеты', icon: 'BarChart3',
    children: [
      { name: 'Аналитика и отчёты', icon: 'BarChart3', path: '/reports' },
      { name: 'Финансы и себестоимость', icon: 'CircleDollarSign', path: '/finance' },
    ],
  },
  { name: 'Настройки', icon: 'Settings', path: '/settings' },
];

const basePath = (p?: string) => (p ? p.split('?')[0] : '');

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NavContent = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChat } = useChat();
  const { info } = useToast();
  const [expanded, setExpanded] = useState<string[]>([]);

  // Автоматически раскрываем группу, содержащую активную страницу
  useEffect(() => {
    const activeGroup = NAV_TREE.find((g) =>
      g.children?.some((c) => c.path && basePath(c.path) === location.pathname)
    );
    if (activeGroup && !expanded.includes(activeGroup.name)) {
      setExpanded((prev) => [...prev, activeGroup.name]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (name: string) => {
    setExpanded((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const go = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const handleLeafClick = (leaf: NavLeaf) => {
    if (leaf.soon) {
      info('Раздел в разработке', `«${leaf.name}» появится в одном из следующих обновлений`);
      return;
    }
    if (leaf.path) go(leaf.path);
  };

  const isGroupActive = (g: NavGroup) => {
    if (g.path) return location.pathname === basePath(g.path);
    return g.children?.some((c) => c.path && basePath(c.path) === location.pathname) ?? false;
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
        {NAV_TREE.map((group) => {
          const active = isGroupActive(group);
          const isOpen = expanded.includes(group.name);

          if (!group.children) {
            return (
              <button
                key={group.name}
                onClick={() => go(group.path!)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-[13px] text-left transition-all duration-200 group ${
                  active
                    ? 'bg-sidebar-accent text-gold font-semibold shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon
                  name={group.icon}
                  size={16}
                  className={`shrink-0 transition-colors ${
                    active ? 'text-gold' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'
                  }`}
                />
                <span className="truncate flex-1">{group.name}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 shadow-sm shadow-gold/50" />}
              </button>
            );
          }

          return (
            <div key={group.name} className="mb-0.5">
              <button
                onClick={() => toggleGroup(group.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-left transition-all duration-200 group ${
                  active && !isOpen
                    ? 'bg-sidebar-accent text-gold font-semibold shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon
                  name={group.icon}
                  size={16}
                  className={`shrink-0 transition-colors ${
                    active ? 'text-gold' : 'text-sidebar-foreground/80 group-hover:text-sidebar-accent-foreground'
                  }`}
                />
                <span className="truncate flex-1">{group.name}</span>
                <Icon
                  name="ChevronRight"
                  size={13}
                  className={`shrink-0 transition-transform duration-200 text-sidebar-foreground/50 ${isOpen ? 'rotate-90' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="ml-3.5 pl-3 border-l border-sidebar-border/70 mt-0.5 mb-1 space-y-0.5" style={{ animation: 'fade-in 0.25s ease forwards' }}>
                  {group.children.map((leaf) => {
                    const leafActive = leaf.path ? basePath(leaf.path) === location.pathname : false;
                    return (
                      <button
                        key={leaf.name}
                        onClick={() => handleLeafClick(leaf)}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] text-left transition-all duration-200 group ${
                          leafActive
                            ? 'bg-sidebar-accent text-gold font-semibold'
                            : leaf.soon
                              ? 'text-sidebar-foreground/45 hover:text-sidebar-foreground/70'
                              : 'text-sidebar-foreground/85 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <Icon
                          name={leaf.icon}
                          size={14}
                          className={`shrink-0 ${leafActive ? 'text-gold' : leaf.soon ? 'text-sidebar-foreground/35' : 'text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground'}`}
                        />
                        <span className="truncate flex-1">{leaf.name}</span>
                        {leaf.soon && (
                          <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-sidebar-accent/70 text-sidebar-foreground/50 font-medium tracking-wide">
                            Скоро
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Company chat */}
      <div className="px-2.5 py-3 border-t border-sidebar-border shrink-0">
        <button
          onClick={() => { openChat(); onClose?.(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-sidebar-accent/70 hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-gold/12 flex items-center justify-center shrink-0">
            <Icon name="MessageCircle" size={14} className="text-gold" />
          </div>
          <div className="min-w-0 text-left">
            <div className="text-[11px] font-medium text-sidebar-accent-foreground">Чат компании</div>
            <div className="text-[10px] text-gold/70 truncate">Обсудить с коллегами</div>
          </div>
        </button>
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
